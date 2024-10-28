const Presensi = require('../models/Presensi');
const User = require('../models/User');
const sessionManager = require('../other/session'); // Impor sessionManager

// Function to display available features after an action
const featureSelection = async (chatId, telebot) => {
    await telebot.sendMessage(chatId, 'Silakan pilih fitur lainnya:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Presensi', callback_data: 'api_presensi' }],
                [{ text: 'KV Program', callback_data: 'api_kv' }],
                [{ text: 'DJP', callback_data: 'api_djp' }],
                [{ text: 'Report', callback_data: 'api_report' }],
                [{ text: 'Saran / Komplain', callback_data: 'api_saran' }],
                [{ text: 'Logout', callback_data: 'logout' }]
            ],
            resize_keyboard: true
        }
    });
};

// Function to display presensi type selection
const presensiTypeSelection = async (chatId, telebot) => {
    await telebot.sendMessage(chatId, 'Pilih tipe presensi yang ingin dilakukan:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Morning Briefing', callback_data: 'presensi_Morning Briefing' }],
                [{ text: 'DJP', callback_data: 'presensi_DJP' }],
                [{ text: 'D2D', callback_data: 'presensi_D2D' }],
                [{ text: 'Event', callback_data: 'presensi_Event' }]
            ],
            resize_keyboard: true // Ensure the buttons are small and fit well
        }
    });
};

// Function to check login status
const checkLoginStatus = (chatId) => {
    const userStatus = sessionManager.getUserStatus(chatId); 
    return userStatus && userStatus.isLoggedIn;
};

// Main bot functionality
module.exports = (telebot) => {
    // Handle callback queries (button presses)
    telebot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        const isLoggedIn = checkLoginStatus(chatId);
        if (!isLoggedIn) {
            return;
        }

        // Handle the "Presensi" button press
        if (callbackQuery.data === 'api_presensi') {
            await presensiTypeSelection(chatId, telebot); // Trigger presensi type selection first
        }

        // Capture presensi type selection and move to location input
        const presensiTypes = ['presensi_Morning Briefing', 'presensi_DJP', 'presensi_D2D', 'presensi_Event'];
        if (presensiTypes.includes(callbackQuery.data)) {
            const presensiType = callbackQuery.data.split('_')[1]; // Extract the presensi type
            const userStatus = sessionManager.getUserStatus(chatId);
            userStatus.presensiType = presensiType; // Store presensi type in session
            sessionManager.setUserStatus(chatId, userStatus);

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
        }
    });

    // Handle location sharing
    telebot.on('location', async (msg) => {
        const chatId = msg.chat.id;
        const { latitude, longitude } = msg.location;

        const isLoggedIn = checkLoginStatus(chatId);
        if (!isLoggedIn) return;

        try {
            const userStatus = sessionManager.getUserStatus(chatId);
            const user = await User.findOne({ 'Kode SF': userStatus.kodeSF }).exec();

            if (!user) {
                await telebot.sendMessage(chatId, 'Anda belum login.');
                return;
            }

            // Check if Kode SF exists
            if (!user['Kode SF']) {
                await telebot.sendMessage(chatId, 'Kode SF tidak ditemukan, tidak dapat melakukan presensi.');
                return;
            }

            // Get the presensi type from session
            const presensiType = userStatus.presensiType;

            const newPresensi = new Presensi({
                kodeSF: user['Kode SF'],
                name: user['Name'],
                tanggal: new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }),
                waktu: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }),
                lokasi: {
                    lat: latitude,
                    long: longitude
                },
                presensiType // Save presensi type to the database
            });

            await newPresensi.save(); 
            await telebot.sendMessage(chatId, 'Presensi berhasil disimpan!', {
                reply_markup: {
                    remove_keyboard: true
                }
            });
            await featureSelection(chatId, telebot); // Return to feature selection after presensi
        } catch (error) {
            console.error('Error saving presensi:', error);
            await telebot.sendMessage(chatId, 'Terjadi kesalahan saat menyimpan presensi.');
        }
    });

    // Handle canceling presensi
    telebot.onText(/Batal/, async (msg) => {
        const chatId = msg.chat.id;
        const isLoggedIn = checkLoginStatus(chatId);
        if (!isLoggedIn) return;

        await telebot.sendMessage(chatId, 'Presensi dibatalkan.', {
            reply_markup: {
                remove_keyboard: true
            }
        });
        await featureSelection(chatId, telebot); // Return to feature selection
    });
};
