const User = require('../models/User');
const presensiRoutes = require('./presensi');
const djpRoutes = require('./djp');
const saranRoutes = require('./saran');
const kvRoutes = require('./kv');
const reportRoutes = require('./report');
const sessionManager = require('../other/session'); // Impor sessionManager

module.exports = (telebot) => {
    telebot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const userStatus = sessionManager.getUserStatus(chatId);
    
        if (userStatus && userStatus.isLoggedIn) {
            telebot.sendMessage(chatId, `Selamat datang kembali, ${userStatus.name}! Silakan pilih fitur yang tersedia:`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Presensi', callback_data: 'api_presensi' }],
                        [{ text: 'DJP', callback_data: 'api_djp' }],
                        [{ text: 'Report', callback_data: 'api_report' }],
                        [{ text: 'Program KV', callback_data: 'api_kv' }],
                        [{ text: 'Saran / Komplain', callback_data: 'api_saran' }]
                    ],
                    resize_keyboard: true
                }
            });
            return;
        }
    
        // Cek jika sesi sebelumnya habis, langsung berikan akses ke fitur
        if (userStatus.wasExpired) {
            sessionManager.setUserStatus(chatId, { isLoggedIn: true, wasExpired: false });
            telebot.sendMessage(chatId, `Sesi Anda telah diperbarui, ${userStatus.name}. Silakan pilih fitur yang tersedia:`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Presensi', callback_data: 'api_presensi' }],
                        [{ text: 'DJP', callback_data: 'api_djp' }],
                        [{ text: 'Report', callback_data: 'api_report' }],
                        [{ text: 'Program KV', callback_data: 'api_kv' }],
                        [{ text: 'Saran / Komplain', callback_data: 'api_saran' }]
                            ],
                    resize_keyboard: true
                }
            });
            return;
        }
    
        // Jika belum login, minta pengguna memasukkan kode SF
        sessionManager.setUserStatus(chatId, { isLoggedIn: false, isExpired: false, isStopped: false });
        telebot.sendMessage(chatId, 'Halo, Selamat Datang!!! Silakan masukkan kode SF Anda:', {
            reply_markup: {
                keyboard: [[{ text: 'Stop' }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    });
    


    // Tangani input token (kode SF) untuk verifikasi
    telebot.on('message', async (msg) => {
        const chatId = msg.chat.id;

        if (msg.text === '/start') {
            // Reset atau mulai ulang sesi di sini jika diperlukan
            sessionManager.setUserStatus(chatId, { isStopped: false }); // Contoh reset status
            return; // Keluar dari fungsi setelah menampilkan pesan
        }
    
        // Abaikan pesan jika pengguna berada dalam status stopped
        const userStatus = sessionManager.getUserStatus(chatId);
        if (userStatus && userStatus.isStopped) {
            telebot.sendMessage(chatId, 'Anda telah menghentikan sesi. Ketik /start untuk memulai kembali. M');
            return;
        }

        if (!msg.text) return;

        const token = msg.text.trim().toUpperCase();
        if (token.startsWith('/') || token === 'Stop' || token === 'Batal') return;

        // Jika pengguna sudah login, arahkan ke saran
        if (userStatus && userStatus.isLoggedIn) {
            await handleSaran(chatId, telebot);
            return;
        }

        // Verifikasi token
        try {
            const kodeSF = await User.findOne({ 'Kode SF': token }).exec();

            if (kodeSF) {
                const nama = kodeSF['Name SF'];

                // Cek apakah kodeSF sudah terhubung dengan pengguna lain
                if (kodeSF.chatId && kodeSF.chatId !== chatId) {
                    telebot.sendMessage(chatId, 'Kode SF ini sudah terhubung dengan pengguna lain. Silakan gunakan kode SF lain.');
                    return;
                }

                // Cek jika chatId sudah terhubung dengan kodeSF yang berbeda
                const existingUser = await User.findOne({ chatId }).exec();
                if (existingUser && existingUser['Kode SF'] !== kodeSF['Kode SF']) {
                    telebot.sendMessage(chatId, `Anda sudah terdaftar dengan kode SF ${existingUser['Kode SF']}.`);
                    return;
                }

                // Sambungkan chatId ke kodeSF jika belum ada
                kodeSF.chatId = chatId;
                await kodeSF.save();

                sessionManager.setUserStatus(chatId, {
                    isLoggedIn: true,
                    kodeSF: kodeSF['Kode SF'],
                    name: nama,
                    awaitingSaran: false
                });

                telebot.sendMessage(chatId, `SELAMAT Kode SF valid! \n\nHalo ${nama}, silakan pilih fitur yang tersedia:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Presensi', callback_data: 'api_presensi' }],
                            [{ text: 'DJP', callback_data: 'api_djp' }],
                            [{ text: 'Report', callback_data: 'api_report' }],
                            [{ text: 'Program KV', callback_data: 'api_kv' }],
                            [{ text: 'Saran / Komplain', callback_data: 'api_saran' }]
                                    ],
                        resize_keyboard: true
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

    telebot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;
    
        // Ambil status pengguna untuk memeriksa login
        const userStatus = sessionManager.getUserStatus(chatId);
        // Jika sesi pengguna sudah kadaluwarsa, setel ulang dan izinkan akses ke fitur
        
        if (userStatus.isExpired) {
            sessionManager.setUserStatus(chatId, { isLoggedIn: false, isExpired: false, wasExpired: true });//false was expired
            // telebot.sendMessage(chatId, `Sesi Anda telah diperbarui, ${userStatus.name}. Silakan pilih fitur yang tersedia:`);
            await telebot.sendMessage(chatId, 'Anda belum login. Silakan login kembali dengan mengetik /start.');
        }

        // if (userStatus && userStatus.isExpired) {
        //     await telebot.sendMessage(chatId, 'Sesi Anda telah berakhir. Silakan klik /start untuk memulai ulang sesi.');
        //     return;
        // }gagal
        
        // if (userStatus && userStatus.isExpired && !userStatus.wasExpired) {
        //     sessionManager.setUserStatus(chatId, { ...userStatus, wasExpired: true }); // Tandai bahwa sesi telah kadaluwarsa
        //     await telebot.sendMessage(chatId, 'Sesi Anda telah berakhir. Silakan klik /start untuk memulai ulang sesi.');
        //     return;
        // }gagal

        // Jika pengguna tidak login atau sesi habis, kirim pesan error
        if (!userStatus || !userStatus.isLoggedIn) {
            await telebot.sendMessage(chatId, 'Anda belum login. Silakan login kembali dengan mengetik /start.');
            return;
        }
    
        const kodeSF = userStatus.kodeSF;
    
        try {
            switch (callbackQuery.data) {
                case 'api_presensi':
                    await presensiRoutes(kodeSF, chatId, telebot);
                    break;
                case 'api_djp':
                    await djpRoutes(chatId, telebot);
                    break;
                case 'api_report':
                    await reportRoutes(chatId, telebot); // Call the report generation function
                    break;
                case 'api_kv':
                    await kvRoutes(kodeSF, chatId, telebot);
                    break;
                case 'api_saran':
                    await saranRoutes(kodeSF, chatId, telebot);
                    break;
                default:
                    // telebot.sendMessage(chatId, 'Opsi tidak dikenali.');
                    break;
            }
        } catch (error) {
            console.error(`Error handling callback query: ${error.message}`);
        }
    });
    

    telebot.onText(/\/outkode/, async (msg) => {
        const chatId = msg.chat.id;
        const userStatus = sessionManager.getUserStatus(chatId);

        if (!userStatus || !userStatus.isLoggedIn) {
            telebot.sendMessage(chatId, 'Anda belum login. Tidak ada sesi yang dapat ditutup.');
            return;
        }

        try {
            // Menghapus chatId dari kode SF
            const kodeSF = userStatus.kodeSF;
            const kodeSFDokumen = await User.findOne({ 'Kode SF': kodeSF }).exec();

            if (kodeSFDokumen && kodeSFDokumen.chatId === chatId) {
                // Hapus chatId dari kode SF
                kodeSFDokumen.chatId = null;
                await kodeSFDokumen.save();

                // Reset status pengguna
                sessionManager.setUserStatus(chatId, { isLoggedIn: false, kodeSF: null, name: null });

                telebot.sendMessage(chatId, 'Anda telah berhasil logout. Kode SF Anda telah dihapus.');
            } else {
                telebot.sendMessage(chatId, 'Tidak ada sesi yang ditemukan untuk kode SF ini.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            telebot.sendMessage(chatId, 'Terjadi kesalahan saat mencoba logout. Silakan coba lagi.');
        }
    });
    
    // Perintah Stop untuk menghentikan sesi pengguna
    telebot.onText(/Stop/, (msg) => {
        const chatId = msg.chat.id;
        sessionManager.setUserStatus(chatId, { isStopped: true });
        telebot.sendMessage(chatId, 'Anda telah menghentikan sesi. Ketik /start untuk memulai kembali. S');
    });

    async function handleSaran(chatId, telebot) {
        const userStatus = sessionManager.getUserStatus(chatId);
        if (!userStatus || !userStatus.isLoggedIn) {
            telebot.sendMessage(chatId, 'Anda belum login.');
            return;
        }

        // Logika untuk menangani saran jika menunggu
        if (userStatus.awaitingSaran) {
            telebot.sendMessage(chatId, 'Silakan ketik saran Anda:', {
                reply_markup: {
                    keyboard: [[{ text: 'Stop' }]],
                    resize_keyboard: true
                }
            });
        } else {
            console.log("User tidak login atau tidak sedang menunggu saran.");
        }
    }
};
