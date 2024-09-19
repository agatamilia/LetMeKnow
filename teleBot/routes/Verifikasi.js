const User = require('../models/User'); // Import User model

module.exports = (telebot) => {
    // Handle initial message
    telebot.on("message", (callback) => {
        const id = callback.from.id;

        // Send message with "Masukan Token" button
        telebot.sendMessage(id, 'Halo, Selamat Pagi! Silahkan masukan kode token anda', {
            reply_markup: {
                inline_keyboard: [[
                    { text: 'Masukan Token', callback_data: 'input_token' }
                ]]
            }
        });
    });

    // Handle button click
    telebot.on('callback_query', (query) => {
        const id = query.from.id;

        if (query.data === 'input_token') {
            telebot.sendMessage(id, 'Silakan masukan token anda.');
            telebot.once('message', (callback) => {
                const token = callback.text;

                // Check if the token exists in MongoDB
                User.findOne({ telegramId: id, token: token }, (err, user) => {
                    if (err) {
                        telebot.sendMessage(id, 'Terjadi kesalahan. Silakan coba lagi.');
                    } else if (user) {
                        // If token matches, show feature buttons
                        telebot.sendMessage(id, 'Token valid! Silakan pilih fitur berikut:', {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: 'Fitur 1', callback_data: 'feature_1' }],
                                    [{ text: 'Fitur 2', callback_data: 'feature_2' }],
                                    [{ text: 'Fitur 3', callback_data: 'feature_3' }]
                                ]
                            }
                        });
                    } else {
                        telebot.sendMessage(id, 'Token tidak valid. Silakan coba lagi.');
                    }
                });
            });
        }
    });

    // Handle feature selection
    telebot.on('callback_query', (query) => {
        const id = query.from.id;

        // Handle feature selection
        switch (query.data) {
            case 'feature_1':
                telebot.sendMessage(id, 'Anda memilih Fitur 1. Menghubungi API yang berbeda...');
                // Call your API for feature 1
                feature1API(id); // Example function
                break;
            case 'feature_2':
                telebot.sendMessage(id, 'Anda memilih Fitur 2. Menghubungi API yang berbeda...');
                // Call your API for feature 2
                feature2API(id); // Example function
                break;
            case 'feature_3':
                telebot.sendMessage(id, 'Anda memilih Fitur 3. Menghubungi API yang berbeda...');
                // Call your API for feature 3
                feature3API(id); // Example function
                break;
            default:
                telebot.sendMessage(id, 'Fitur tidak ditemukan.');
        }
    });

    // Example API functions
    function feature1API(id) {
        // Logic for feature 1
        telebot.sendMessage(id, 'Fitur 1 berhasil dijalankan!');
    }

    function feature2API(id) {
        // Logic for feature 2
        telebot.sendMessage(id, 'Fitur 2 berhasil dijalankan!');
    }

    function feature3API(id) {
        // Logic for feature 3
        telebot.sendMessage(id, 'Fitur 3 berhasil dijalankan!');
    }
};
