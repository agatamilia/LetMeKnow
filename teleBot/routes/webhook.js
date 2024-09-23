// routes/webhook.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User'); // MongoDB model

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Webhook route for handling incoming updates from Telegram
router.post('/', async (req, res) => {
    const message = req.body.message;

    if (message && message.text) {
        const chatId = message.chat.id;
        const token = message.text.trim();

        // Ignore commands like /start or /stop
        if (token.startsWith('/')) {
            return res.sendStatus(200);
        }

        try {
            // Log token
            console.log(`Received token: ${token}`);

            // Query MongoDB to verify token
            const user = await User.findOne({ 'Kode SF': token }).exec();

            if (user) {
                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: 'Token valid! Berikut fitur yang tersedia:',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Fitur 1', callback_data: 'feature_1' }],
                            [{ text: 'Fitur 2', callback_data: 'feature_2' }]
                        ]
                    }
                });
            } else {
                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: 'Token tidak valid, silakan coba lagi.'
                });
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: 'Terjadi kesalahan saat memverifikasi token.'
            });
        }
    }

    res.sendStatus(200);
});

// Route for handling callback queries (like button presses)
router.post('/', async (req, res) => {
    const callbackQuery = req.body.callback_query;

    if (callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        if (data === 'feature_1') {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: 'Anda telah memilih Fitur 1!'
            });
        } else if (data === 'feature_2') {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: 'Anda telah memilih Fitur 2!'
            });
        }
    }

    res.sendStatus(200);
});

module.exports = router;
