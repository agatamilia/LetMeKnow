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

const checkLoginStatus = (chatId) => {
    const userStatus = sessionManager.getUserStatus(chatId); // Mengambil status login dari sessionManager

    if (!userStatus || !userStatus.isLoggedIn) {
        return false;
    }
    return userStatus; // Return userStatus untuk akses kodeSF nantinya
};

module.exports = (telebot) => {
    telebot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        // Cek status login dan ambil userStatus
        const userStatus = checkLoginStatus(chatId);
        if (!userStatus) {
            return;
        }

        if (callbackQuery.data === 'api_djp') {
            try {
                // Cari user berdasarkan chatId (yang sebelumnya dihubungkan dengan Kode SF)
                const user = await User.findOne({ 'Kode SF': userStatus.kodeSF }).exec();

                if (!user) {
                    await telebot.sendMessage(chatId, 'Data pengguna tidak ditemukan.');
                    return;
                }

                const kodeSF = user['Kode SF'];

                // Mengambil semua data DJP berdasarkan Kode SF yang sesuai
                const djpData = await DJP.find({ 'id sf': kodeSF }).exec();

                if (djpData.length > 0) {
                    // const userName = user['Name'];
                    const currentDate = new Date().toLocaleDateString('id-ID');
                    const currentMonth = new Date().toLocaleString('id-ID', { month: 'long' });

                    let djpMessage = `Hari ini tanggal ${currentDate}, Daily Journey Plan (DJP) Anda untuk bulan ${currentMonth} adalah:\n\n`;

                    // Sort data DJP berdasarkan tanggal
                    djpData.sort((a, b) => new Date(a.tgl) - new Date(b.tgl));
                    const groupedDJP = djpData.reduce((acc, djp) => {
                        const dateKey = `${djp.tgl}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
                        if (!acc[dateKey]) {
                            acc[dateKey] = [];
                        }
                        acc[dateKey].push(`<a href="${djp.map}">Lokasi ${acc[dateKey].length + 1}</a>`);
                        return acc;
                    }, {});

                    Object.keys(groupedDJP).forEach((dateKey) => {
                        djpMessage += `• ${dateKey} = ${groupedDJP[dateKey].join(' > ')}\n`;
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
