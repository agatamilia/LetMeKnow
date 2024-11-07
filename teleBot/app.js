//require('dotenv').config();
const express = require('express');  // Import Express
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const teleRoutes = require('./routes/login');
const presensiRoutes = require('./routes/presensi');
const djpRoutes = require('./routes/djp');
const reportRoutes = require('./routes/report');
const kvRoutes = require('./routes/kv');
const saranRoutes = require('./routes/saran');
const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Inisialisasi Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi bot Telegram dengan webhook
const telebot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

// Tentukan URL webhook
const url = 'https://71105346-f3c7-4f8f-9f8a-2c521069c30e-00-p9fnr1ya1x2u.pike.replit.dev';
telebot.setWebHook(`${url}/webhook`);

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

// Jalankan routing untuk berbagai fitur
teleRoutes(telebot);
presensiRoutes(telebot);
djpRoutes(telebot);
reportRoutes(telebot);
kvRoutes(telebot);
saranRoutes(telebot);

// Endpoint untuk menangani webhook Telegram
app.post('/webhook', express.json(), (req, res) => {
    telebot.processUpdate(req.body);  // Proses update dari Telegram
    res.sendStatus(200);  // Mengirim status OK
});

// Endpoint lain untuk pengecekan
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

// Jalankan server Express
app.listen(PORT, () => {
    console.log(`Bot is running on port ${PORT}`);
});
