const DJP = require('../models/DJP');
const User = require('../models/User');
const sessionManager = require('../other/session'); // Impor sessionManager

// Function to display available features after an action
const featureSelection = async (chatId, telebot) => {
    await telebot.sendMessage(chatId, 'Silakan pilih fitur lainnya:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Presensi', callback_data: 'api_presensi' }],
                [{ text: 'DJP', callback_data: 'api_djp' }],
                [{ text: 'Report', callback_data: 'api_report' }],
                [{ text: 'Saran / Komplain', callback_data: 'api_saran' }],
            ],
            resize_keyboard: true
        }
    });
};

// Function to check login status
const checkLoginStatus = (chatId) => {
    const userStatus = sessionManager.getUserStatus(chatId); 
    if (!userStatus) {
        return false;
    }
    // Check if user is logged in and session is not expired
    if (!userStatus.isLoggedIn || userStatus.isExpired) {
        return false;
    }
    return true;
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

        // Handle the "DJP" button press
        if (callbackQuery.data === 'api_djp') {
            try {
                // Logika untuk mengambil dan mengirim data DJP
                const userStatus = sessionManager.getUserStatus(chatId);
                const user = await User.findOne({ 'Kode SF': userStatus.kodeSF }).exec();

                if (!user) {
                    await telebot.sendMessage(chatId, 'Anda belum login.');
                    return;
                }

                // Ambil data DJP untuk pengguna ini
                const djpData = await DJP.find({ 'Kode SF': user['Kode SF'] }).exec();

                if (djpData.length === 0) {
                    await telebot.sendMessage(chatId, 'Tidak ada data DJP untuk pengguna ini.');
                } else {
                    const messageByDates = djpData.map(d => `Tanggal: ${d.tanggal}, Data: ${d.data}`).join('\n');
                    await sendLongMessageInBatches(telebot, chatId, messageByDates);
                }

                await featureSelection(chatId, telebot); // Return to feature selection after processing
            } catch (error) {
                console.error('Error fetching DJP data:', error);
                await telebot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data DJP.');
                await featureSelection(chatId, telebot);
            }
        }
    });

    // Function to send long messages in batches
    const sendLongMessageInBatches = async (telebot, chatId, messageByDates, batchSize = 4000) => {
        let currentMessage = '';

        for (const messageChunk of messageByDates) {
            // Jika menambahkan chunk ini akan melebihi batchSize, kirim pesan saat ini dan reset
            if ((currentMessage.length + messageChunk.length) > batchSize) {
                await telebot.sendMessage(chatId, currentMessage, { parse_mode: 'HTML' });
                currentMessage = ''; // Reset pesan
            }

            // Tambahkan chunk ke pesan saat ini
            currentMessage += messageChunk + '\n'; // Tambahkan chunk dan buat baris baru
        }

        // Kirim sisa pesan yang mungkin belum terkirim
        if (currentMessage.length > 0) {
            await telebot.sendMessage(chatId, currentMessage, { parse_mode: 'HTML' });
        }
    };
};
