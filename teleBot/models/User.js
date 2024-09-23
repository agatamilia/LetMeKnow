const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    'NO': Number,
    'Nama SPV': String,
    'Kode SPV': String,
    'Kode SF': String, 
    'Name': String,
    'Agency': String,
    'Cluster': String,
    'Branch': String,
    'Cluster Agency': String,
    'Tahun Aktif': Number,
    'Bulan aktif': Number,
    'tgl Aktif': Number,
    'yyyymm': Number
}, { collection: 'users' });

module.exports = mongoose.model('User', userSchema);
