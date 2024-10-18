require('dotenv').config();
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const teleRoutes = require('./routes/login');
const presensiRoutes = require('./routes/presensi');
const djpRoutes = require('./routes/djp');
const reportRoutes = require('./routes/report');
// const kvRoutes= require('./routes/kv');
const saranRoutes = require('./routes/saran');

// Initialize the bot with token from .env
const telebot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Connect to local MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

// Run routing
teleRoutes(telebot);
presensiRoutes(telebot);
djpRoutes(telebot);
reportRoutes(telebot);
// kvRoutes(telebot);
saranRoutes(telebot);
