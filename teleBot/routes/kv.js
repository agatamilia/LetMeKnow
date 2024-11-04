const cloudinary = require('cloudinary').v2;
const sessionManager = require('../other/session');

const featureSelection = async (chatId, telebot) => {
    await telebot.sendMessage(chatId, 'Silakan pilih fitur lainnya:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Presensi', callback_data: 'api_presensi' }],
                [{ text: 'DJP', callback_data: 'api_djp' }],
                [{ text: 'Report', callback_data: 'api_report' }],
                [{ text: 'Program KV', callback_data: 'api_kv' }],
                [{ text: 'Saran / Komplain', callback_data: 'api_saran' }]
            ]
        }
    });
};

const checkLoginStatus = (chatId) => {
    const userStatus = sessionManager.getUserStatus(chatId); 
    return userStatus && userStatus.isLoggedIn && !userStatus.isExpired;
};

module.exports = (telebot) => {
    telebot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        const isLoggedIn = checkLoginStatus(chatId);
        if (!isLoggedIn) {
            await telebot.sendMessage(chatId, 'Anda belum login. Silakan login kembali dengan mengetik /start.');
            return;
        }

        if (callbackQuery.data === 'api_kv') {
            sessionManager.setUserStatus(chatId, { awaitingSaran: true });
            await telebot.sendMessage(chatId, 'Mengambil 5 file terakhir yang diupload...');

            try {
                // Ambil hingga 5 file gambar terakhir dari Cloudinary
                const imageResources = await cloudinary.api.resources({
                    max_results: 5, // Batasi hingga 5 file
                    type: 'upload',
                    resource_type: 'image', 
                });

                // Ambil hingga 5 file PDF terakhir dari Cloudinary
                const pdfResources = await cloudinary.api.resources({
                    max_results: 5, // Batasi hingga 5 file
                    type: 'upload',
                    resource_type: 'raw', 
                });

                // Gabungkan hasil yang ada
                const allResources = [...imageResources.resources, ...pdfResources.resources];

                // Cek apakah ada file yang ditemukan
                if (allResources.length === 0) {
                    await telebot.sendMessage(chatId, 'Tidak ada file yang ditemukan.');
                } else {
                    // Kirim hasil yang ditemukan ke pengguna
                    let message = 'File terakhir yang diupload:\n';
                    allResources.forEach((file, index) => {
                        message += `${index + 1}. ${file.public_id}: ${file.secure_url}\n`;
                    });
                    await telebot.sendMessage(chatId, message);
                }
                
                // Kembali ke menu fitur setelah menampilkan file
                await featureSelection(chatId, telebot);
            } catch (error) {
                console.error('Error fetching resources:', error);
                await telebot.sendMessage(chatId, 'Terjadi kesalahan saat mengambil file.');
                await featureSelection(chatId, telebot);
            }
        }
    });
};
