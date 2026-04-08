module.exports.config = {
    name: "toilet",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "Aarav Mehra",
    description: "Toilet 🚽 image maker",
    commandCategory: "Image",
    usages: "[tag]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "axios": "",
        "path": "",
        "jimp": ""
    }
};

// Circular avatar processing
async function circle(imagePath) {
    const jimp = require("jimp");
    const img = await jimp.read(imagePath);
    img.circle();
    return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");
    const jimp = require("jimp");

    const __root = path.resolve(__dirname, "cache");
    if (!fs.existsSync(__root)) fs.mkdirSync(__root, { recursive: true });

    const backgroundPath = path.resolve(__root, 'toilet.png');
    
    // Download background if missing
    if (!fs.existsSync(backgroundPath)) {
        const getImg = await axios.get("https://i.imgur.com/BtSlsSS.jpg", { responseType: 'arraybuffer' });
        fs.writeFileSync(backgroundPath, Buffer.from(getImg.data, 'utf-8'));
    }

    const pathImg = path.resolve(__root, `toilet_${one}_${two}.png`);
    const avatarOnePath = path.resolve(__root, `avt_${one}.png`);
    const avatarTwoPath = path.resolve(__root, `avt_${two}.png`);

    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

    // Fetch Avatars
    const getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=${token}`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarOnePath, Buffer.from(getAvatarOne, 'utf-8'));

    const getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=${token}`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarTwoPath, Buffer.from(getAvatarTwo, 'utf-8'));

    // Jimp Image Processing
    const baseImage = await jimp.read(backgroundPath);
    const circleOne = await jimp.read(await circle(avatarOnePath));
    const circleTwo = await jimp.read(await circle(avatarTwoPath));

    // Coordinates fixed so faces don't overlap in the same spot
    baseImage.resize(500, 500)
             .composite(circleOne.resize(100, 100), 50, 250) // User 1 position
             .composite(circleTwo.resize(100, 100), 250, 250); // User 2 position

    const resultBuffer = await baseImage.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, resultBuffer);

    // Cleanup temp files
    fs.unlinkSync(avatarOnePath);
    fs.unlinkSync(avatarTwoPath);

    return pathImg;
}

module.exports.run = async function ({ event, api, args, Currencies }) { 
    const fs = require("fs-extra");
    const { threadID, messageID, senderID, mentions } = event;
    const mentionIDs = Object.keys(mentions);

    if (mentionIDs.length == 0) return api.sendMessage("Please tag 1 person!", threadID, messageID);

    try {
        const hc = Math.floor(Math.random() * 101);
        const rd = Math.floor(Math.random() * 1000) + 500;
        await Currencies.increaseMoney(senderID, parseInt(hc * rd));

        api.sendMessage("⏳ | Creating image...", threadID, messageID);

        const one = senderID;
        const two = mentionIDs;
        const resultPath = await makeImage({ one, two });

        return api.sendMessage({ 
            body: `You flushed them! 🚽\nYou earned $${hc * rd} for this clean-up!`, 
            attachment: fs.createReadStream(resultPath) 
        }, threadID, () => {
            if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
        }, messageID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Error: Could not generate image. Check logs.", threadID, messageID);
    }
};
