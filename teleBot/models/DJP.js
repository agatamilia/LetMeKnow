const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const djpSchema = new Schema({
    'cluster': String,
    'id sf': String,   
    'tgl': Number,
    'grid': String,
    'grid_mandatory': Number,
    'map': String,
    'chatId': Number
}, { collection: 'djps' });

module.exports = mongoose.model('DJP', djpSchema);
