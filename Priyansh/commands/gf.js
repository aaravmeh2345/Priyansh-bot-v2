module.exports.config = {
    name: "gf",
    version: "7.3.2",
    hasPermssion: 0,
    credits: "Aarav Mehra", 
    description: "Get Pair From Mention",
    commandCategory: "img",
    usages: "[@mention]",
    cooldowns: 5, 
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "path": "",
        "jimp": ""
    }
};

// Circular avatar function
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

    const backgroundPath = path.resolve(__root, 'arr2.png');
    
    // Download background if it doesn't exist
    if (!fs.existsSync(backgroundPath)) {
        const getImg = await axios.get("https://i.imgur.com/iaOiAXe.jpeg", { responseType: 'arraybuffer' });
        fs.writeFileSync(backgroundPath, Buffer.from(getImg.data, 'utf-8'));
    }

    const pathImg = path.resolve(__root, `gf_${one}_${two}.png`);
    const avatarOnePath = path.resolve(__root, `avt_${one}.png`);
    const avatarTwoPath = path.resolve(__root, `avt_${two}.png`);

    // Facebook Graph API Token
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

    // Composite avatars on background
    baseImage.composite(circleOne.resize(200, 200), 70, 110)
             .composite(circleTwo.resize(200, 200), 465, 110);

    const resultBuffer = await baseImage.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, resultBuffer);

    // Cleanup temp avatars
    fs.unlinkSync(avatarOnePath);
    fs.unlinkSync(avatarTwoPath);

    return pathImg;
}

module.exports.run = async function ({ event, api, args }) {    
    const fs = require("fs-extra");
    const { threadID, messageID, senderID, mentions } = event;
    const mentionIDs = Object.keys(mentions);

    if (mentionIDs.length == 0) return api.sendMessage("Please mention 1 person.", threadID, messageID);

    try {
        api.sendMessage("⌛ | Processing your pairing...", threadID, messageID);
        
        const one = senderID;
        const two = mentionIDs;
        const resultPath = await makeImage({ one, two });

        const bodyMsg = "╔═══❖••° °••❖═══╗\n\n   𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐏𝐚𝐢𝐫𝐢𝐧𝐠\n\n╚═══❖••° °••❖═══╝\n\n   ✶⊶⊷⊷❍⊶⊷⊷✶\n\n       👑 𝐌𝐢𝐥𝐥 𝐆𝐚𝐲𝐢 ❤\n\n𝐓𝐞𝐫𝐢 𝐆𝐢𝐫𝐥𝐟𝐫𝐢𝐞𝐧𝐝 🩷\n\n   ✶⊶⊷⊷❍⊶⊷⊷✶";

        return api.sendMessage({ 
            body: bodyMsg, 
            attachment: fs.createReadStream(resultPath) 
        }, threadID, () => {
            if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
        }, messageID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Error: Could not generate image. Make sure the mention is valid.", threadID, messageID);
    }
};
