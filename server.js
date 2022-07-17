const { TOKEN, MONGO_URL } = require("./config");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(TOKEN, { polling: true });
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const mongoose = require("mongoose");
const apartments = require("./models/apartments");
const users = require("./models/users");

mongoose.connect(MONGO_URL, (err) => {
    if (err) {
        console.log("Mongo error", err + "");
    } else {
        console.log("Mongo connected");
        init_bot()
    }
});
let init_bot = async () => {
    const user_list = await users.find()
    let link = `https://www.olx.uz/d/nedvizhimost/kvartiry/arenda-dolgosrochnaya/tashkent/?currency=UZS&search%5Bfilter_float_price:to%5D=3000000&search%5Bfilter_float_number_of_rooms:to%5D=4`;
    //4xonagacha 300$ gacha
    setInterval(async () => {
        // console.log("searching apartments")

        fetch(link)
            .then((res) => res.text())
            .then((body) => {
                const dom = new JSDOM(body);
                let items = dom.window.document.querySelectorAll(".offer:not(.promoted) .offer-wrapper table tbody");
                items.forEach(async (apartment, index) => {
                    let ad_link = apartment.querySelector(".photo-cell a").getAttribute("href");
                    let ads = await apartments.findOne({
                        link: ad_link,
                    });
                    if (!ads) {
                        console.log(ads, " => ads value")
                        let img_link = apartment.querySelector(".photo-cell a img").src;
                        let ad_text = apartment.querySelector(".photo-cell a img").alt;
                        let price = apartment.querySelector(".td-price .price strong").textContent;
                        let address = apartment.querySelectorAll(".bottom-cell small span")[0].textContent;
                        let time = apartment.querySelectorAll(".bottom-cell small span")[1].textContent;
                        apartments.create({
                            link: ad_link,
                            img: img_link,
                            about: ad_text,
                            price: price,
                            location: address,
                            time: time,
                            recorded_date: Date.now()
                        });
                        user_list.forEach(user => {
                            bot.sendPhoto(user.user_id, img_link, {
                                caption: `🏣: ${ad_text} \n💰: <strong>${price}</strong> \n🌍: ${address} \n🚩: ${time} \n<a href="${ad_link}">Check it</a> 👀`,
                                parse_mode: "html",
                            });
                        })
                    }
                });
            })
            .catch((err) => { console.log(err + "") });

        let found = await apartments.deleteMany({
            recorded_date: { $lt: Date.now() - 604800000 } //7kunlik elonni o'chiradi
        })
    }, 1000 * 60 * 3) //har 3 min refresh
}

bot.on("message", async (data) => {
    // if ((data.from.id !== 1296799837) && (data.from.id !== 1184695869) && (data.from.id !== 1186377237)) {
    //     bot.sendMessage(data.from.id, `You (${data.from.id}) are unauthorized user. Please contact @Uroljon_Khidirboev for registration !`)
    // } else {
        bot.sendMessage(data.from.id, "salom")
    // }
});