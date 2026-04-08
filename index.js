const { spawn } = require("child_process");
const axios = require("axios");
const logger = require("./utils/log");
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(port, () => {
    logger(`Server is running on port ${port}...`, "[ Starting ]");
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        logger(`Permission denied. Cannot bind to port ${port}.`, "[ Error ]");
    } else {
        logger(`Server error: ${err.message}`, "[ Error ]");
    }
});

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////

function startBot(message) {
    if (message) logger(message, "[ Starting ]");

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Priyansh.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        // Agar codeExit 1 hai ya 0 nahi hai, toh bot restart hoga
        if (codeExit !== 0) {
            logger(`Bot crashed with exit code ${codeExit}. Restarting in 5 seconds...`, "[ Error ]");
            setTimeout(() => {
                startBot();
            }, 5000); // 5 seconds ka delay taaki Facebook ban na kare spam ki wajah se
        } else {
            // Manual stop par bhi kabhi kabhi restart chahiye hota hai
            logger(`Bot was stopped. Restarting...`, "[ Restarting ]");
            startBot();
        }
    });

    child.on("error", (error) => {
        logger(`An error occurred: ${error.message}`, "[ Error ]");
    });
};

////////////////////////////////////////////////
//========= Check update from Github =========//
////////////////////////////////////////////////

// Isko optional rakhein, agar link dead ho toh bot crash nahi hoga
axios.get("https://raw.githubusercontent.com/priyanshu192/bot/main/package.json")
    .then((res) => {
        logger(`Project: ${res.data.name}`, "[ INFO ]");
        logger(`Version: ${res.data.version}`, "[ INFO ]");
    })
    .catch((err) => {
        logger("Could not check for updates, skipping...", "[ Update ]");
    });

// Start the bot for the first time
startBot("Initializing Priyansh Bot...");
