module.exports.config = {
    name: "music",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "KSHITIZ/kira",
    description: "Play a song with lyrics and audio",
    usePrefix: false,
    commandCategory: "utility",
    usages: "[song name]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "axios": "",
        "ytdl-core": "",
        "yt-search": ""
    }
};

module.exports.run = async ({ api, event, args }) => {
    const axios = require("axios");
    const fs = require("fs-extra");
    const ytdl = require("ytdl-core");
    const yts = require("yt-search");

    const song = args.join(" ");

    if (!song) {
        return api.sendMessage("Please enter a music name!", event.threadID, event.messageID);
    }

    try {
        api.sendMessage(`🔍 | Searching for "${song}"...`, event.threadID, (err, info) => {
            setTimeout(() => api.unsendMessage(info.messageID), 5000);
        }, event.messageID);

        // Lyrics Search
        let lyrics = "Not found!";
        let title = "Unknown";
        let artist = "Unknown";

        try {
            const res = await axios.get(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(song)}`);
            lyrics = res.data.lyrics || "Lyrics not found!";
            title = res.data.title || "Not found!";
            artist = res.data.artist || "Not found!";
        } catch (e) {
            console.log("Lyrics API Error");
        }

        // YouTube Search
        const searchResults = await yts(song);
        if (!searchResults.videos.length) {
            return api.sendMessage("❌ Error: Song not found on YouTube.", event.threadID, event.messageID);
        }

        const video = searchResults.videos;
        const videoUrl = video.url;
        const stream = ytdl(videoUrl, { filter: "audioonly", quality: "highestaudio" });

        const path = __dirname + `/cache/${event.senderID}_music.mp3`;

        // Create Cache folder if it doesn't exist
        if (!fs.existsSync(__dirname + "/cache")) {
            fs.mkdirSync(__dirname + "/cache");
        }

        const fileStream = fs.createWriteStream(path);
        stream.pipe(fileStream);

        fileStream.on('finish', () => {
            const stats = fs.statSync(path);
            const fileSizeInBytes = stats.size;

            if (fileSizeInBytes > 26214400) { // 25MB check
                fs.unlinkSync(path);
                return api.sendMessage("❌ File size is too large (over 25MB).", event.threadID, event.messageID);
            }

            const message = {
                body: `🎵 𝙏𝙞𝙩𝙡𝙚: ${video.title}\n🎤 𝘼𝙧𝙩𝙞𝙨𝙩: ${video.author.name}\n\n📝 𝙇𝙮𝙧𝙞𝙘𝙨:\n${lyrics.substring(0, 1500)}...`,
                attachment: fs.createReadStream(path)
            };

            api.sendMessage(message, event.threadID, () => {
                if (fs.existsSync(path)) fs.unlinkSync(path);
            }, event.messageID);
        });

        stream.on('error', (error) => {
            console.error('[YTDL ERROR]', error);
            api.sendMessage("❌ An error occurred during streaming.", event.threadID);
            if (fs.existsSync(path)) fs.unlinkSync(path);
        });

    } catch (error) {
        console.error('[SYSTEM ERROR]', error);
        api.sendMessage('❌ Error: Could not process request.', event.threadID);
    }
};
