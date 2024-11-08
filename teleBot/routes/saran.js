const Saran = require('../models/Saran');
const User = require('../models/User');
const sessionManager = require('../other/session'); // Import sessionManager

const featureSelection = async (chatId, telebot) => {
    await telebot.sendMessage(chatId, 'Silakan pilih fitur lainnya:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Presensi', callback_data: 'api_presensi' }],
                [{ text: 'DJP', callback_data: 'api_djp' }],
                [{ text: 'Report', callback_data: 'api_report' }],
                [{ text: 'Program KV', callback_data: 'api_kv' }],
                [{ text: 'Saran / Komplain', callback_data: 'api_saran' }]
            ]
        }
    });
};

const checkLoginStatus = (chatId) => {
    const userStatus = sessionManager.getUserStatus(chatId); 
    return userStatus && userStatus.isLoggedIn && !userStatus.isExpired;
};

module.exports = (telebot) => {
    telebot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        const isLoggedIn = checkLoginStatus(chatId);
        if (!isLoggedIn) {
            return;
        }

        if (callbackQuery.data === 'api_saran') {
            sessionManager.setUserStatus(chatId, { awaitingSaran: true });
            await telebot.sendMessage(chatId, 'Silakan kirimkan saran atau komplain Anda:');
        }
    });

    telebot.on('text', async (msg) => {
        const chatId = msg.chat.id;
        const userStatus = sessionManager.getUserStatus(chatId);

        // Hanya proses jika pengguna login dan sedang menunggu saran
        if (!userStatus || !userStatus.isLoggedIn || !userStatus.awaitingSaran) {
            return; // Keluarkan jika tidak dalam sesi saran
        }

        const suggestionText = msg.text.trim();

        // Validasi panjang karakter saran
        if (suggestionText.length < 30) {
            await telebot.sendMessage(chatId, 'Saran / komplain terlalu pendek (min 30 karakter). Mohon berikan saran lebih detail.');
            return;
        }

        try {
            const user = await User.findOne({ 'Kode SF': userStatus.kodeSF }).exec();

            if (!user) {
                await telebot.sendMessage(chatId, 'Pengguna tidak ditemukan.');
                return;
            }

            // Membuat dokumen saran dengan nama pengguna
            const newSaran = new Saran({
                kodeSF: user['Kode SF'],
                name: user['Name'] || 'Nama tidak ditemukan', // Menangani kasus jika nama tidak ada
                saran: suggestionText
            });

            await newSaran.save();
            await telebot.sendMessage(chatId, 'Terima kasih! Saran/komplain Anda telah disimpan.', {
                reply_markup: {
                    remove_keyboard: true
                }
            });

            sessionManager.setUserStatus(chatId, { awaitingSaran: false }); // Reset status setelah menyimpan
            await featureSelection(chatId, telebot); // Tampilkan pilihan fitur setelah menyimpan saran
        } catch (error) {
            console.error('Error saving suggestion:', error);
            await telebot.sendMessage(chatId, 'Terjadi kesalahan saat menyimpan saran/komplain.');
        }
    });

    telebot.onText(/Batal/, async (msg) => {
        const chatId = msg.chat.id;
        if (!checkLoginStatus(chatId)) return;

        sessionManager.setUserStatus(chatId, { awaitingSaran: false });

        await telebot.sendMessage(chatId, 'Proses dibatalkan.', {
            reply_markup: {
                remove_keyboard: true
            }
        });

        await featureSelection(chatId, telebot); // Tampilkan pilihan fitur setelah membatalkan
    });
};
