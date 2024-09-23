const User = require('../models/User'); // Pastikan path ini sesuai

let isBotActive = true; // Status untuk mengontrol aktivitas bot
let isLoggedIn = false; // Status untuk memeriksa apakah pengguna sudah login

module.exports = (telebot) => {
    // Handle command /start
    telebot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        isLoggedIn = false; // Reset status login saat /start
        telebot.sendMessage(chatId, 'Halo, Selamat Pagi! Silakan masukkan kode token Anda:', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Stop Bot' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    });

    telebot.onText(/Stop Bot/, (msg) => {
        const chatId = msg.chat.id;
        isBotActive = false; // Ubah status bot
        telebot.sendMessage(chatId, 'Semoga harimu menyenangkan!');
    });

    // Handle input token verification
    telebot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const token = msg.text.trim();

        // Cek apakah pesan yang dikirim adalah token (tidak memproses command atau teks selain token)
        if (token.startsWith('/') || token === 'Stop Bot') return;

        // Jika pengguna sudah login, abaikan pesan yang bukan token
        if (isLoggedIn) {
            telebot.sendMessage(chatId, 'Anda sudah login. Silakan pilih fitur yang tersedia atau logout untuk memasukkan token baru.');
            return;
        }

        try {
            const kodeSF = await User.findOne({ 'Kode SF': token }).exec();
            if (kodeSF) {
                const namaSPV = kodeSF['Nama SPV'];
                console.log('Token valid:', kodeSF);
                isLoggedIn = true; // Ubah status login
                telebot.sendMessage(chatId, `Token valid! Halo ${namaSPV}, silakan pilih fitur yang tersedia:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Fitur 1', callback_data: 'feature_1' }],
                            [{ text: 'Fitur 2', callback_data: 'feature_2' }],
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

    // Fitur callback untuk fitur
    telebot.on('callback_query', (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        if (!isLoggedIn) {
            telebot.sendMessage(chatId, 'Anda telah Logout, silahkan ketik /start untuk memulai Bot dan masukan Kode SF terlebih dahulu sebelum memilih fitur.');
            return;
        }

        if (callbackQuery.data === 'feature_1') {
            telebot.sendMessage(chatId, 'Anda telah memilih Fitur 1!');
        } else if (callbackQuery.data === 'feature_2') {
            telebot.sendMessage(chatId, 'Anda telah memilih Fitur 2!');
        } else if (callbackQuery.data === 'logout') {
            isLoggedIn = false; // Ubah status login
            // telebot.sendMessage(chatId, 'Anda telah logout. Silakan masukkan token baru untuk login.');
        }
    });

    telebot.startPolling();
};

// const User = require('../models/User'); // Pastikan path ini sesuai

// module.exports = (telebot) => {
//     // Handle command /start
//     telebot.onText(/\/start/, (msg) => {
//         const chatId = msg.chat.id;
//         telebot.sendMessage(chatId, 'Halo, Selamat Pagi! Silakan masukkan kode token Anda:');
//         telebot.startPolling();
//     });
//     telebot.onText(/\/stop/, (msg) => {
//         const chatId = msg.chat.id;
//         isBotActive = false;
//         telebot.sendMessage(chatId, 'semoga harimu tidak huhu');
//     });
//     // Handle input token verification
//     telebot.on('message', async (msg) => {
//         const chatId = msg.chat.id;
//         const token = msg.text.trim(); // Mengambil teks yang dikirim pengguna sebagai token

//         // Cek apakah pesan yang dikirim adalah token (tidak memproses command atau teks selain token)
//         if (token.startsWith('/')) return;

//         try {
//             const kodeSF = await User.findOne({ 'Kode SF': token }).exec(); // Pastikan query dieksekusi
//             if (kodeSF) {
//             console.log('Token valid:', kodeSF); // Log pengguna yang ditemukan
//             const namaSPV = kodeSF['Nama SPV'];
//             console.log('Nama SPV:', namaSPV);
//             telebot.sendMessage(chatId, `Token valid! Halo ${namaSPV}, silakan pilih fitur yang tersedia:`, {
//                     reply_markup: {
//                         inline_keyboard: [
//                             [{ text: 'Fitur 1', callback_data: 'feature_1' }],
//                             [{ text: 'Fitur 2', callback_data: 'feature_2' }],
//                             [{ text: 'Stop Bot', callback_data: 'stop_bot' }]
//                         ]
//                     }
//                 });
//             } else {
//                 telebot.sendMessage(chatId, 'Token tidak valid, silakan coba lagi.');
//             }
//         } catch (error) {
//             console.error('Error verifying token:', error);
//             telebot.sendMessage(chatId, 'Terjadi kesalahan saat memverifikasi token.');
//         }
//     });

//     // Fitur callback untuk fitur
//     telebot.on('callback_query', (callbackQuery) => {
//         const msg = callbackQuery.message;
//         const chatId = msg.chat.id;

//         if (callbackQuery.data === 'feature_1') {
//             telebot.sendMessage(chatId, 'Anda telah memilih Fitur 1!');
//         } else if (callbackQuery.data === 'feature_2') {
//             telebot.sendMessage(chatId, 'Anda telah memilih Fitur 2!');
//         } else if (callbackQuery.data === 'stop_bot') {
//             isBotActive = false,
//             telebot.sendMessage(chatId, 'Bot telah dihentikan. Terima kasih!');
//         }
//     });
//     telebot.startPolling();
// };
