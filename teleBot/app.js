// Load environment variables from .env file
require('dotenv').config();

const mongoose = require('mongoose');
const startBot = require('./bot'); // Import the bot functionality

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
  startBot();  // Start the bot after the DB connection is established
}).catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});
