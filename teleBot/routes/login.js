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

        // Check if message contains text
        if (!msg.text) return;

        const token = msg.text.trim();

        // Ignore non-token messages (commands or specific text)
        if (token.startsWith('/') || token === 'Stop' || token === 'Batal') return;

        // Retrieve user status from session manager
        const userStatus = sessionManager.getUserStatus(chatId);
        if (userStatus.isLoggedIn) {
            // User is already logged in, handle suggestion input
            await handleSaran(chatId, telebot);
            return;
        }

        // Token verification
        try {
            console.log('Received token for verification:', token); // Debugging line
            const kodeSF = await User.findOne({ 'Kode SF': token }).exec();

            // Log the result of the query for debugging
            if (kodeSF) {
                console.log('Token verified successfully:', kodeSF); // Debugging line
                const nama = kodeSF['Name SF'];

                // Check if chatId is already associated with another kodeSF
                const existingUser = await User.findOne({ chatId }).exec();
                if (existingUser && existingUser['Kode SF'] !== kodeSF['Kode SF']) {
                    telebot.sendMessage(chatId, `Anda sudah terdaftar dengan kode SF ${existingUser['Kode SF']}. Silakan mencoba dengan kode SF yang baru.`);
                    return;
                }

                // Associate the chatId with the kodeSF
                kodeSF.chatId = chatId;
                await kodeSF.save();

                // Save login status in sessionManager
                sessionManager.setUserStatus(chatId, {
                    isLoggedIn: true,
                    kodeSF: kodeSF['Kode SF'],
                    name: nama,
                    awaitingSaran: false // Reset status waiting for suggestions
                });

                // Send success message with available features
                telebot.sendMessage(chatId, `Token valid! \n\nHalo ${nama}, silakan pilih fitur yang tersedia:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Presensi', callback_data: 'api_presensi' }],
                            [{ text: 'DJP', callback_data: 'api_djp' }],
                            [{ text: 'Report', callback_data: 'api_report' }],
                            [{ text: 'KV Program', callback_data: 'api_kv' }],
                            [{ text: 'Saran / Komplain', callback_data: 'api_saran' }],
                            // [{ text: 'Logout', callback_data: 'logout' }] adih
                        ]
                    }
                });
            } else {
                console.log('Token not found in database:', token); // Debugging line
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

        // if (callbackQuery.data === 'logout') {
        //     sessionManager.deleteUserStatus(chatId); // Hapus status login user 
        //     telebot.sendMessage(chatId, 'Anda telah logout. Silakan masukkan token baru untuk login.', {
        //         reply_markup: {
        //             remove_keyboard: true 
        //         }
        //     });
        // }
        // if (callbackQuery.data === 'logout') {
        //     const userStatus = sessionManager.getUserStatus(chatId);
        //     if (userStatus && userStatus.kodeSF) {
        //         // Cari pengguna di database berdasarkan Kode SF
        //         await User.updateOne(
        //             { 'Kode SF': userStatus.kodeSF },
        //             { $unset: { chatId: "" } } // Hapus chatId dari pengguna
        //         );
        //     }
            
        //     sessionManager.deleteUserStatus(chatId); // Hapus status login user
        //     telebot.sendMessage(chatId, 'Anda telah logout. Silakan masukkan token baru untuk login.', {
        //         reply_markup: {
        //             remove_keyboard: true 
        //         }
        //     });
        // }
    });
};

async function handleSaran(chatId, telebot) {
    const userStatus = sessionManager.getUserStatus(chatId);
    if (!userStatus || !userStatus.isLoggedIn) {
        telebot.sendMessage(chatId, 'Anda belum login.');
        return;
    }
    if (userStatus.awaitingSaran) {
        // Proceed with saran handling logic here
    } else {
        console.log("User is not logged in or not awaiting suggestion. Exiting.");
    }
}
