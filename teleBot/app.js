require('dotenv').config(); // Load environment variables
const express = require('express'); // Import Express
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const teleRoutes = require('./routes/login');
const presensiRoutes = require('./routes/presensi');
const djpRoutes = require('./routes/djp');
const reportRoutes = require('./routes/report');
const kvRoutes = require('./routes/kv');
const saranRoutes = require('./routes/saran');
const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Telegram bot with webhook
const telebot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

// Define webhook URL for Telegram
const url = process.env.VERCEL_URL || 'http://localhost:3000';
telebot.setWebHook(`${url}/webhook`);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

// Apply routes for various features
teleRoutes(telebot);
presensiRoutes(telebot);
djpRoutes(telebot);
reportRoutes(telebot);
kvRoutes(telebot);
saranRoutes(telebot);

// Endpoint for handling Telegram webhook
app.post('/webhook', express.json(), (req, res) => {
    telebot.processUpdate(req.body); // Process update from Telegram
    res.sendStatus(200); // Send OK status
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Bot is running on port ${PORT}`);
});
