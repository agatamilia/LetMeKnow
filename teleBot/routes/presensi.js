const Presensi = require('../models/Presensi');
const User = require('../models/User');
const sessionManager = require('../other/session'); // Impor sessionManager

const featureSelection = async (chatId, telebot) => {
    await telebot.sendMessage(chatId, 'Silakan pilih fitur lainnya:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Presensi', callback_data: 'api_presensi' }],
                [{ text: 'KV Program', callback_data: 'api_kv' }],
                [{ text: 'Fitur 2', callback_data: 'feature_2' }],
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

        if (callbackQuery.data === 'api_presensi') {
            try {
                const user = await User.findOne({ chatId }).exec();
                if (!user) {
                    telebot.sendMessage(chatId, 'Anda belum login.');
                    return;
                }

                await telebot.sendMessage(chatId, 'Silakan aktifkan dan kirimkan lokasi Anda untuk melakukan presensi.', {
                    reply_markup: {
                        keyboard: [
                            [{ text: 'Bagikan Lokasi', request_location: true }],
                            [{ text: 'Batal' }]
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
            } catch (error) {
                console.error('Error during presensi:', error);
                await telebot.sendMessage(chatId, 'Terjadi kesalahan saat memproses presensi.');
            }
        }
    });

    telebot.on('location', async (msg) => {
        const chatId = msg.chat.id;
        const { latitude, longitude } = msg.location;

        const isLoggedIn = await checkLoginStatus(chatId, telebot);
        if (!isLoggedIn) return;

        try {
            const user = await User.findOne({ chatId }).exec();
            if (!user) {
                telebot.sendMessage(chatId, 'Anda belum login.');
                return;
            }

            const newPresensi = new Presensi({
                kodeSF: user['Kode SF'],
                name: user['Name'],
                tanggal: new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }),
                waktu: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }),
                lokasi: {
                    lat: latitude,
                    long: longitude
                }
            });

            await newPresensi.save(); 
            await telebot.sendMessage(chatId, 'Presensi berhasil disimpan!', {
                reply_markup: {
                    remove_keyboard: true
                }
            });
            await featureSelection(chatId, telebot);
        } catch (error) {
            console.error('Error saving presensi:', error);
            telebot.sendMessage(chatId, 'Terjadi kesalahan saat menyimpan presensi.');
        }
    });

    telebot.onText(/Batal/, async (msg) => {
        const chatId = msg.chat.id;
        const isLoggedIn = await checkLoginStatus(chatId, telebot);
        if (!isLoggedIn) return;
        
        telebot.sendMessage(chatId, 'Presensi dibatalkan.', {
            reply_markup: {
                remove_keyboard: true
            }
        });
        await featureSelection(chatId, telebot);
    });
};
