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
                [{ text: 'Program KV', callback_data: 'api_kv' }],
                [{ text: 'Saran / Komplain', callback_data: 'api_saran' }]
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
// Main bot functionality
module.exports = (telebot) => {
    // Handle callback queries (button presses)
    telebot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        const userStatus = sessionManager.getUserStatus(chatId); // Get user status here
        const isLoggedIn = checkLoginStatus(chatId);
        if (!isLoggedIn) {
            return;
        }

        // Handle the "DJP" button press
        if (callbackQuery.data === 'api_djp') {
            try {
                // Cari user berdasarkan chatId (yang sebelumnya dihubungkan dengan Kode SF)
                const user = await User.findOne({ 'Kode SF': userStatus.kodeSF }).exec();
                if (!user) {
                    await telebot.sendMessage(chatId, 'Data pengguna tidak ditemukan.');
                    return;
                }

                const kodeSF = user['Kode SF']; // Ambil Kode SF dari pengguna

                // Mengambil semua data DJP berdasarkan Kode SF yang sesuai
                const djpData = await DJP.find({ 'id sf': kodeSF }).exec();

                if (djpData.length > 0) {
                    const currentDate = new Date().toLocaleDateString('id-ID');
                    const currentMonth = new Date().toLocaleString('id-ID', { month: 'long' });
                    let djpMessageByDates = [];

                    const openingMessage = `Hari ini tanggal ${currentDate}, Daily Journey Plan Anda untuk bulan ${currentMonth} adalah:\n\n`;
                    djpMessageByDates.push(openingMessage);

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

                    // Membangun pesan dengan bullet, menyatukan lokasi dengan tanggalnya
                    Object.keys(groupedDJP).forEach((dateKey) => {
                        const locations = groupedDJP[dateKey].join(' > '); // Menggabungkan semua lokasi
                        djpMessageByDates.push(`• ${dateKey}: ${locations}\n`); // Menyimpan pesan per tanggal dalam array
                    });

                    // Kirim pesan per batch (per tanggal) dalam batas batchSize
                    await sendLongMessageInBatches(telebot, chatId, djpMessageByDates);
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

