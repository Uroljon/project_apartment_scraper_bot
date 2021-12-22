const mongoose = require("mongoose")

const sxema = new mongoose.Schema({
    link :{
        type: String,
        required: true,
        unique: true
    },
    img: {
        type: String
    },
    about: {
        type: String
    },
    price: {
        type: String
    },
    location: {
        type: String
    },
    time: {
        type: String
    },
    recorded_date: {
        type: Date,
        default: Date.now()
    }
})

const ads = mongoose.model("apartments", sxema);
module.exports = ads;