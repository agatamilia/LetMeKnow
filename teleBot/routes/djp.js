const DJP = require('../models/DJP');
const User = require('../models/User');
const sessionManager = require('../other/session'); // Impor sessionManager

const featureSelection = async (chatId, telebot) => {
    await telebot.sendMessage(chatId, 'Silakan pilih fitur lainnya:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Presensi', callback_data: 'api_presensi' }],
                [{ text: 'KV Program', callback_data: 'api_kv' }],
                [{ text: 'DJP', callback_data: 'api_djp' }],
                [{ text: 'Logout', callback_data: 'logout' }]
            ]
        }
    });
};

const checkLoginStatus = async (chatId, telebot) => {
    const userStatus = sessionManager.getUserStatus(chatId); // Mengambil status login dari sessionManager

    if (!userStatus || !userStatus.isLoggedIn) {
        return false;
    }
    return true;
};

module.exports = (telebot) => {
    telebot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        const isLoggedIn = await checkLoginStatus(chatId, telebot);
        if (!isLoggedIn) return;

        if (callbackQuery.data === 'api_djp') {
            try {
                const user = await User.findOne({ chatId }).exec();
                if (!user) {
                    telebot.sendMessage(chatId, 'Anda belum login.');
                    return;
                }

                // Menggunakan find untuk mengambil semua data DJP berdasarkan Kode SF
                const djpData = await DJP.find({ 'id sf': user['Kode SF'] }).exec();

                if (djpData.length > 0) {
                    const userName = user['Name']; // Ambil nama pengguna
                    const currentDate = new Date().toLocaleDateString('id-ID'); // Tanggal terkini
                    const currentMonth = new Date().toLocaleString('id-ID', { month: 'long' }); // Bulan terkini

                    // Membuat pesan untuk DJP
                    let djpMessage = `HALO ${userName}, hari ini tanggal ${currentDate}, Daily journey plan mu pada bulan ${currentMonth} adalah:\n\n`;

                    // Loop untuk setiap DJP dan buat format hyperlink
                    djpData.forEach((djp, index) => {
                        const formattedDate = `${djp.tgl}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
                        djpMessage += `${index + 1}. <a href="${djp.map}">${formattedDate}</a>\n`;
                    });

                    await telebot.sendMessage(chatId, djpMessage, { parse_mode: 'HTML' });
                } else {
                    await telebot.sendMessage(chatId, 'Data DJP tidak ditemukan untuk Kode SF ini.');
                }
                await featureSelection(chatId, telebot);
            } catch (error) {
                console.error('Error fetching DJP data:', error);
                await telebot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data DJP.');
                await featureSelection(chatId, telebot);
            }
        }
    });
};
