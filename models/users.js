const mongoose = require("mongoose")
const sxema = mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    }
})
module.exports = mongoose.model("users", sxema)

        // users.create({user_id: 1296799837})
// 933599824