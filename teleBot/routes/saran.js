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
                [{ text: 'KV Program', callback_data: 'api_kv' }],
                [{ text: 'Saran / Komplain', callback_data: 'api_saran' }],
                [{ text: 'Logout', callback_data: 'logout' }]
            ]
        }
    });
};

const checkLoginStatus = (chatId) => {
    const userStatus = sessionManager.getUserStatus(chatId); // Mengambil status login dari sessionManager
    return userStatus && userStatus.isLoggedIn;
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
            try {
                sessionManager.setUserStatus(chatId, { awaitingSaran: true }); // Set awaitingSaran to true
                await telebot.sendMessage(chatId, 'Silakan kirimkan saran atau komplain Anda:');
            } catch (error) {
                console.error('Error in saran feature:', error);
                await telebot.sendMessage(chatId, 'Terjadi kesalahan saat memproses saran/komplain.');
            }
        }
    });

    telebot.on('text', async (msg) => {
        const chatId = msg.chat.id;
        const userStatus = sessionManager.getUserStatus(chatId);

        // Log status pengguna untuk debugging
        console.log(`User Status: `, userStatus);

        // Hanya proses jika pengguna login dan sedang menunggu saran
        if (!userStatus || !userStatus.isLoggedIn || !userStatus.awaitingSaran) {
            console.log('User is not logged in or not awaiting suggestion. Exiting.');
            return; // Keluarkan jika tidak dalam sesi saran
        }

        const suggestionText = msg.text.trim();
        console.log(`Received suggestion text: "${suggestionText}"`);

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

            const newSaran = new Saran({
                kodeSF: user['Kode SF'],
                name: user['Name'],
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

        sessionManager.setUserStatus(chatId, { awaitingSaran: false }); // Reset awaiting status
        await telebot.sendMessage(chatId, 'Saran/komplain dibatalkan.', {
            reply_markup: {
                remove_keyboard: true
            }
        });
        await featureSelection(chatId, telebot);
    });
};
