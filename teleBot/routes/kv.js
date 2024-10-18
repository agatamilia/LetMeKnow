// const KV = require('../models/KV');
// const User = require('../models/User');
// const sessionManager = require('../other/session');
// const { getDriveFiles } = require('../other/googleDrive'); // Import Google Drive function

// // Function to handle feature selection
// const featureSelection = async (chatId, telebot) => {
//     await telebot.sendMessage(chatId, 'Silakan pilih fitur KV:', {
//         reply_markup: {
//             inline_keyboard: [
//                 [{ text: 'Tambah KV', callback_data: 'add_kv' }],
//                 [{ text: 'Lihat KV', callback_data: 'view_kv' }],
//                 [{ text: 'Lihat File PDF/Images', callback_data: 'view_files' }],  // New button for viewing files
//                 [{ text: 'Hapus KV', callback_data: 'delete_kv' }],
//                 [{ text: 'Kembali ke Menu Utama', callback_data: 'main_menu' }]
//             ]
//         }
//     });
// };

// // Function to display Google Drive files
// const showDriveFiles = async (chatId, telebot) => {
//     const files = await getDriveFiles();

//     if (files.length === 0) {
//         return telebot.sendMessage(chatId, 'Tidak ada file yang ditemukan.');
//     }

//     for (const file of files) {
//         let message = `Nama File: ${file.name}\n`;
//         if (file.mimeType === 'application/pdf') {
//             message += `Tipe: PDF\nLink: ${file.webViewLink}`;
//         } else if (file.mimeType.includes('image')) {
//             message += `Tipe: Gambar\nLink: ${file.webViewLink}`;
//         }

//         await telebot.sendMessage(chatId, message);
//     }
// };

// // Add a callback handler for 'view_files'
// telebot.on('callback_query', async (callbackQuery) => {
//     const chatId = callbackQuery.message.chat.id;
//     const data = callbackQuery.data;

//     if (data === 'view_files') {
//         await showDriveFiles(chatId, telebot);
//     }
// });
