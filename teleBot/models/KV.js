const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    title: String,
    imageUrl: String,
    description: String,
});

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;
