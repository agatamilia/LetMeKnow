const mongoose = require('mongoose');

// Define the User schema
const UserSchema = new mongoose.Schema({
    telegramId: String,
    token: String,
});

// Export the User model
module.exports = mongoose.model('User', UserSchema);
