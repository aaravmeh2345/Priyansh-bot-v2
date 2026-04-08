module.exports.config = {
    name: "couple",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "Aarav Mehra",
    description: "Create a couple image with tagged person",
    commandCategory: "Love",
    usages: "[tag]",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "path": "",
        "jimp": ""
    }
};

// Function to create a circular avatar
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

    const __root = path.resolve(__dirname, "cache", "canvas");
    if (!fs.existsSync(__root)) fs.mkdirSync(__root, { recursive: true });

    const backgroundPath = path.resolve(__root, 'seophi.png');
    
    // Download background if missing
    if (!fs.existsSync(backgroundPath)) {
        const getImg = await axios.get("https://i.imgur.com/hmKmmam.jpg", { responseType: 'arraybuffer' });
        fs.writeFileSync(backgroundPath, Buffer.from(getImg.data, 'utf-8'));
    }

    const pathImg = path.resolve(__root, `couple_${one}_${two}.png`);
    const avatarOnePath = path.resolve(__root, `avt_${one}.png`);
    const avatarTwoPath = path.resolve(__root, `avt_${two}.png`);

    // Fetch Avatars
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=${token}`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarOnePath, Buffer.from(getAvatarOne, 'utf-8'));

    const getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=${token}`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarTwoPath, Buffer.from(getAvatarTwo, 'utf-8'));

    // Process Image
    const baseImage = await jimp.read(backgroundPath);
    const circleOne = await jimp.read(await circle(avatarOnePath));
    const circleTwo = await jimp.read(await circle(avatarTwoPath));

    baseImage.resize(1024, 712)
             .composite(circleOne.resize(200, 200), 527, 141)
             .composite(circleTwo.resize(200, 200), 389, 407);

    const resultBuffer = await baseImage.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, resultBuffer);

    // Cleanup individual avatars
    fs.unlinkSync(avatarOnePath);
    fs.unlinkSync(avatarTwoPath);

    return pathImg;
}

module.exports.run = async function ({ event, api, args }) {
    const fs = require("fs-extra");
    const { threadID, messageID, senderID, mentions } = event;

    if (Object.keys(mentions).length == 0) return api.sendMessage("Please tag 1 person!", threadID, messageID);

    try {
        const mentionID = Object.keys(mentions);
        const tagName = mentions[mentionID].replace("@", "");
        
        api.sendMessage("⏳ | Creating your couple image, please wait...", threadID, messageID);

        const imagePath = await makeImage({ one: senderID, two: mentionID });

        return api.sendMessage({
            body: `Ship confirmed! ❤️\nCouple: You & ${tagName}`,
            mentions: [{ tag: tagName, id: mentionID }],
            attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }, messageID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Error: Could not create image. Check your internet or API token.", threadID, messageID);
    }
};
