const mongoose = require('mongoose');

const presensiSchema = new mongoose.Schema({
    kodeSF: String,
    name: String,
    tanggal: String,
    waktu: String,
    lokasi: {
        lat: Number,
        long: Number
    }
});

const Presensi = mongoose.model('Presensi', presensiSchema);
module.exports = Presensi;
