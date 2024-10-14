// models/Suggestion.js
const mongoose = require('mongoose');

const saranSchema = new mongoose.Schema({
    kodeSF: { type: String, required: true },
    name: { type: String, required: true },
    saran: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Saran', saranSchema);
