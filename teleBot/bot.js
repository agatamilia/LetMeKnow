const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config(); // Load environment variables

// Create a new TelegramBot instance
const telebot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Import the bot routes
require('./routes/botRoutes')(telebot);  // Pass the bot instance

module.exports = telebot;
