module.exports.config = {
  name: "pair",
  version: "1.0.1", 
  hasPermssion: 0,
  credits: "Anup Kumar / Fixed by Gemini",
  description: "Randomly pair two members in the group",
  commandCategory: "Love", 
  usages: "pair", 
  cooldowns: 5
};

module.exports.run = async function({ api, event, Threads, Users }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const { threadID, messageID, senderID } = event;

    try {
        var threadData = await api.getThreadInfo(threadID);
        var participantIDs = threadData.participantIDs;
        var botID = api.getCurrentUserID();
        
        // Filter out bot and sender
        var listUserID = participantIDs.filter(ID => ID != botID && ID != senderID);
        
        if (listUserID.length == 0) return api.sendMessage("Not enough members to pair!", threadID, messageID);

        // Random selection
        var id = listUserID[Math.floor(Math.random() * listUserID.length)];
        var tle = Math.floor(Math.random() * 101);

        // Special pairings (Admin/Specific IDs)
        if (senderID == "100074940129987") id = "100047251667599";
        else if (senderID == "100047251667599") id = "100074940129987";

        // Get names
        var nameSender = (await Users.getData(senderID)).name;
        var namePair = (await Users.getData(id)).name;

        // Message texts
        let messages = [
            "𝑲𝒚𝒂 𝒕𝒖𝒎𝒏𝒆 𝒌𝒉𝒂𝒏𝒂 𝒌𝒉𝒂𝒚𝒂 𝒅𝒆𝒂𝒓 💝🥀", "𝑺𝒂𝒃𝒔𝒆 𝒂𝒄𝒉𝒉𝒊 𝒋𝒐𝒅𝒊", "𝑲𝒊𝒕𝒏𝒆 𝒄𝒖𝒕𝒆 𝒍𝒈 𝒓𝒉𝒆 𝒅𝒐𝒏𝒐 💛🧡",
            "𝑴𝒔𝒕 𝒄𝒐𝒖𝒑𝒍𝒆𝒔 𝒆𝒌𝒅𝒂𝒎 💓", "𝑹𝒆𝒂𝒍 𝑩𝑭 𝑮𝑭 𝒂𝒂 𝒈𝒚𝒆 💝", "𝑺𝒉𝒂𝒅𝒊 𝒌𝒃 𝒌𝒓 𝒓𝒉𝒆 𝒉𝒐 💝",
            "𝑰𝒏𝒃𝒐𝒙 𝒎 𝒋𝒂𝒐 𝒍𝒐𝒗𝒆𝒃𝒂𝒛𝒊 𝒌𝒓𝒐 💞💓", "🌸 चलो एक दूसरे को चुम्मा देदो जल्दी से _____😝🦋"
        ];
        let randomMsg = messages[Math.floor(Math.random() * messages.length)];

        // Profile Picture URLs (Using direct link instead of token-based graph API for stability)
        let avt1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        let avt2 = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        let gifLove = "https://i.imgur.com/vcydK3t.gif";

        // Download Images
        let getAvt1 = (await axios.get(avt1, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(__dirname + "/cache/avt1.png", Buffer.from(getAvt1, "utf-8"));

        let getAvt2 = (await axios.get(avt2, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(__dirname + "/cache/avt2.png", Buffer.from(getAvt2, "utf-8"));

        let getGif = (await axios.get(gifLove, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(__dirname + "/cache/love.gif", Buffer.from(getGif, "utf-8"));

        var arrayTag = [
            { id: senderID, tag: nameSender },
            { id: id, tag: namePair }
        ];

        var attachments = [
            fs.createReadStream(__dirname + "/cache/avt1.png"),
            fs.createReadStream(__dirname + "/cache/love.gif"),
            fs.createReadStream(__dirname + "/cache/avt2.png")
        ];

        var finalMsg = {
            body: `🥰 Successful pairing!\n💌 Wish you two hundred years of happiness\n💕 Love Ratio: ${tle}%\n\n${nameSender} 💓 ${namePair}\n👉 ${randomMsg}\n\n© Ayush Shukla`,
            mentions: arrayTag,
            attachment: attachments
        };

        return api.sendMessage(finalMsg, threadID, () => {
            // Clean up cache
            fs.unlinkSync(__dirname + "/cache/avt1.png");
            fs.unlinkSync(__dirname + "/cache/avt2.png");
            fs.unlinkSync(__dirname + "/cache/love.gif");
        }, messageID);

    } catch (e) {
        console.log(e);
        return api.sendMessage("Something went wrong! Please try again.", threadID, messageID);
    }
};
