const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const djpSchema = new Schema({
    cluster: String,
    id_sf: String,   
    tgl: Number,
    grid: String,
    grid_mandatory: Number,
    map: String
});

module.exports = mongoose.model('DJP', djpSchema);
