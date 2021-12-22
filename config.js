require("dotenv").config()
const {env} = process;
module.exports = {
    TOKEN: env.TOKEN,
    MONGO_URL: env.MONGO_URL
}