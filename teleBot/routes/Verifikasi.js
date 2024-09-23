const User = require('../models/User'); // Pastikan path ini sesuai

module.exports = (telebot) => {
    // Handle command /start
    telebot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        telebot.sendMessage(chatId, 'Halo, Selamat Pagi! Silakan masukkan kode token Anda:');
        telebot.startPolling();
    });
    telebot.onText(/\/stopbot/, (msg) => {
        const chatId = msg.chat.id;
        telebot.sendMessage(chatId, 'semoga harimu tidak huhu');
        telebot.stopPolling(); 
    });
    // Handle input token verification
    telebot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const token = msg.text.trim(); // Mengambil teks yang dikirim pengguna sebagai token

        // Cek apakah pesan yang dikirim adalah token (tidak memproses command atau teks selain token)
        if (token.startsWith('/')) return; // Abaikan jika itu adalah perintah

        try {
            // Verifikasi token dengan mencari di MongoDB
            const user = await User.findOne({ 'Kode SF': token }).exec(); // Pastikan query dieksekusi

            if (user) {
                // Jika token valid, kirim fitur yang tersedia
                console.log('Token valid:', user); // Log pengguna yang ditemukan
                telebot.sendMessage(chatId, 'Token valid! Berikut fitur yang tersedia:', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Fitur 1', callback_data: 'feature_1' }],
                            [{ text: 'Fitur 2', callback_data: 'feature_2' }]
                        ]
                    }
                });
            } else {
                // Jika token tidak valid
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

        if (callbackQuery.data === 'feature_1') {
            telebot.sendMessage(chatId, 'Anda telah memilih Fitur 1!');
        } else if (callbackQuery.data === 'feature_2') {
            telebot.sendMessage(chatId, 'Anda telah memilih Fitur 2!');
        }
    });
};
