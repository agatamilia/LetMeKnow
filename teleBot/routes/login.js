const User = require('../models/User');
// const Saran = require('../models/Saran');
const presensiRoutes = require('./presensi');
const djpRoutes = require('./djp');
const saranRoutes = require('./saran');
const kvRoutes = require('./kv')
const sessionManager = require('../other/session'); // Impor sessionManager

module.exports = (telebot) => {
    telebot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        sessionManager.setUserStatus(chatId, { isLoggedIn: false }); // Reset status login saat /start
        telebot.sendMessage(chatId, 'Halo, Selamat Pagi! Silakan masukkan kode SF Anda:', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Stop' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    });

    // Handle command /stop
    telebot.onText(/Stop/, (msg) => {
        const chatId = msg.chat.id;
        telebot.sendMessage(chatId, 'Semoga harimu menyenangkan!');
    });

    // Handle input token verification
    telebot.on('message', async (msg) => {
        const chatId = msg.chat.id;

        if (!msg.text) return;
        const token = msg.text.trim();

        // Abaikan pesan yang bukan token (misalnya command atau 'Stop')
        if (token.startsWith('/') || token === 'Stop' || token === 'Batal') return;

        const userStatus = sessionManager.getUserStatus(chatId); // Ambil status pengguna

        if (userStatus && userStatus.isLoggedIn) {
            // User is already logged in, handle suggestion input
            await handleSaran(chatId, telebot);
            return;
        }

        // Verifikasi token
        try {
            const kodeSF = await User.findOne({ 'Kode SF': token }).exec();
            if (kodeSF) {
                const nama = kodeSF['Name SF'];
                kodeSF.chatId = chatId;
                await kodeSF.save();

                // Simpan status login ke sessionManager
                sessionManager.setUserStatus(chatId, {
                    isLoggedIn: true,
                    kodeSF: kodeSF['Kode SF'],
                    name: nama,
                    awaitingSaran: false // Reset status menunggu saran
                });

                telebot.sendMessage(chatId, `Token valid! \n\nHalo ${nama}, silakan pilih fitur yang tersedia:`, {
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
            } else {
                telebot.sendMessage(chatId, 'Token tidak valid, silakan coba lagi.');
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            telebot.sendMessage(chatId, 'Terjadi kesalahan saat memverifikasi token.');
        }
    });

    // Handle callback query
    telebot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const userStatus = sessionManager.getUserStatus(chatId); // Mengambil status login user

        if (!userStatus || !userStatus.isLoggedIn) {
            telebot.sendMessage(chatId, 'Anda belum login, silakan masukkan token terlebih dahulu.');
            return;
        }

        const kodeSF = userStatus.kodeSF;

        if (callbackQuery.data === 'api_presensi') {
            try {
                await presensiRoutes(kodeSF, chatId, telebot); 
            } catch (error) {
                console.error('Error during presensi:', error);
            }
        }

        if (callbackQuery.data === 'api_djp') {
            try {
                await djpRoutes(chatId, telebot);
            } catch (error) {
                console.error('Error during DJP retrieval:', error);
            }
        }

        if (callbackQuery.data === 'api_report') {
            try {
                await reportRoutes(chatId, telebot); // Call the report generation function
            } catch (error) {
                telebot.sendMessage('Terjadi kesalahan saat menghasilkan report.', error);
            }
        }

        if (callbackQuery.data === 'api_kv') {
            try {
                await kvRoutes(kodeSF, chatId, telebot); // Call the report generation function
            } catch (error) {
                telebot.sendMessage(chatId, 'Terjadi kesalahan saat menghasilkan KV program.');
            }
        }

        if (callbackQuery.data === 'api_saran') {
            try {
                await saranRoutes(kodeSF, chatId, telebot);
            } catch (error) {
                console.error('Error handling saran:', error);
            }
        }

        if (callbackQuery.data === 'logout') {
            sessionManager.deleteUserStatus(chatId); // Hapus status login user
            telebot.sendMessage(chatId, 'Anda telah logout. Silakan masukkan token baru untuk login.', {
                reply_markup: {
                    remove_keyboard: true 
                }
            });
        }
    });
};

async function handleSaran(chatId, telebot) {
    const userStatus = sessionManager.getUserStatus(chatId);
    sessionManager.setUserStatus(chatId, { awaitingSaran: true }); // Set awaitingSaran to true

}