const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    'NO': Number,
    'Branch': String,
    'Cluster': String,
    'Agency': String,
    'Nama SPV': String,
    'Kode SPV': String,
    'Kode SF': String, 
    'Name SF': String,
    'Name': String,
    'Tahun Aktif': Number,
    'chatId': Number
}, { collection: 'users' });

module.exports = mongoose.model('User', userSchema);

