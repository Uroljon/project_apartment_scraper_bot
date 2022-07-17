const { TOKEN, MONGO_URL } = require("./config");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(TOKEN, { polling: true });
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const mongoose = require("mongoose");
const apartments = require("./models/apartments");
const users = require("./models/users");

const link = `https://www.olx.uz/d/nedvizhimost/kvartiry/arenda-dolgosrochnaya/tashkent/?currency=UZS&search%5Bfilter_float_price:to%5D=3000000&search%5Bfilter_float_number_of_rooms:to%5D=4`;


mongoose.connect(MONGO_URL, (err) => {
    if (err) {
        console.log("Mongo error", err + "");
    } else {
        console.log("Mongo connected");
        init_bot()
    }
});

let init_bot = async () => {
    setInterval(() => {
        search_apart(link)
    }, 1000 * 60 * 3) //har 3 min refresh
}

async function search_apart(url) {
    const user_list = await users.find()

    fetch(url)
        .then((res) => res.text())
        .then((body) => {
            const dom = new JSDOM(body);
            let items = dom.window.document.querySelectorAll("[data-cy='l-card']");
   
            items.forEach(async (apartment, index) => {
                let href = apartment.querySelector("a").getAttribute("href");
                if(href){
                    let ad_link = "https://www.olx.uz" + href;
                    let ads = await apartments.findOne({
                        link: ad_link,
                    });
                    if (!ads) {
                        let img_link = "https://images.unsplash.com/photo-1502672023488-70e25813eb80?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1064&q=80";
                        let ad_text = apartment.querySelector("h6").textContent;
                        let price = apartment.querySelector(`[data-testid="ad-price"]`).textContent;
                        let address = apartment.querySelector(`[data-testid="location-date"]`).textContent.split("-")[0].trim();
                        let time = apartment.querySelector(`[data-testid="location-date"]`).textContent.split("-")[1].trim();
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
                }
            });
        })
        .catch((err) => { console.log(err + "") });

    await apartments.deleteMany({
        recorded_date: { $lt: Date.now() - 604800000 } //7kunlik elonni o'chiradi
    })
}

bot.on("message", async (data) => {
    let user = String(data.from.id)
    let user_list = await users.find()
    user_list = user_list.map((el=>el.user_id))

    if (!user_list.includes(user)) {
        await users.create({ user_id: data.from.id })
    }
    if (data.text === "kvartira_top") {
        search_apart(link)
    }else if(data.text === "bazani_tozala"){
        let found = await apartments.deleteMany({
            recorded_date: { $lt: Date.now() - 100 } //7kunlik elonni o'chiradi
        })
        bot.sendMessage(data.from.id, `Bot has cleared ${found.deletedCount} db entries from past 7 days`)
    }
    else{
        bot.sendMessage(data.from.id, "Command: 'kvartira_top - searches instantly, returns found apartments'")
    }
});