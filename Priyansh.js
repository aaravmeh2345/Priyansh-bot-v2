const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const login = require("fca-priyansh"); 
const axios = require("axios");

const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

global.client = new Object({
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: new Array(),
    handleSchedule: new Array(),
    handleReaction: new Array(),
    handleReply: new Array(),
    mainPath: process.cwd(),
    configPath: new String(),
    getTime: function (option) {
        switch (option) {
            case "seconds": return moment.tz("Asia/Kolkata").format("ss");
            case "minutes": return moment.tz("Asia/Kolkata").format("mm");
            case "hours": return moment.tz("Asia/Kolkata").format("HH");
            case "date": return moment.tz("Asia/Kolkata").format("DD");
            case "month": return moment.tz("Asia/Kolkata").format("MM");
            case "year": return moment.tz("Asia/Kolkata").format("YYYY");
            case "fullHour": return moment.tz("Asia/Kolkata").format("HH:mm:ss");
            case "fullYear": return moment.tz("Asia/Kolkata").format("DD/MM/YYYY");
            case "fullTime": return moment.tz("Asia/Kolkata").format("HH:mm:ss DD/MM/YYYY");
        }
    }
});

global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Array()
});

global.utils = require("./utils");
global.nodemodule = new Object();
global.config = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();

//========= Load Config =========//
try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    let configValue = require(global.client.configPath);
    for (const key in configValue) global.config[key] = configValue[key];
    logger.loader("Found file config: config.json");
} catch {
    return logger.loader("config.json not found or corrupted!", "error");
}

const { Sequelize, sequelize } = require("./includes/database");

//========= Load Language =========//
const langFile = readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, { encoding: 'utf-8' }).split(/\r?\n|\r/);
for (const item of langFile.filter(i => i.indexOf('#') != 0 && i != '')) {
    const sep = item.indexOf('=');
    const itemKey = item.slice(0, sep);
    const itemValue = item.slice(sep + 1).replace(/\\n/gi, '\n');
    const [head, ...rest] = itemKey.split('.');
    if (!global.language[head]) global.language[head] = {};
    global.language[head][rest.join('.')] = itemValue;
}

global.getText = function (...args) {
    const langText = global.language;    
    if (!langText.hasOwnProperty(args)) return `Language key not found: ${args}`;
    let text = langText[args][args];
    for (let i = args.length - 1; i > 0; i--) {
        text = text.replace(new RegExp(`%${i}`, 'g'), args[i + 1]);
    }
    return text;
}

//========= Login and Listener =========//
async function onBot({ models: botModel }) {
    const appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
    let appState;
    try {
        appState = require(appStateFile);
    } catch {
        return logger.loader("AppState not found!", "error");
    }

    login({ appState }, async (err, api) => {
        if (err) return logger(JSON.stringify(err), `LOGIN ERROR`);
        
        api.setOptions(global.config.FCAOption);
        writeFileSync(appStateFile, JSON.stringify(api.getAppState(), null, 4));
        global.client.api = api;
        global.client.timeStart = Date.now();

        // Load Commands
        const commandPath = join(global.client.mainPath, 'Priyansh', 'commands');
        const listCommand = readdirSync(commandPath).filter(file => file.endsWith('.js') && !global.config.commandDisabled.includes(file));
        
        for (const file of listCommand) {
            try {
                const module = require(join(commandPath, file));
                if (!module.config || !module.run) throw new Error("Invalid format");
                global.client.commands.set(module.config.name, module);
                logger.loader(`Loaded Command: ${module.config.name}`);
            } catch (e) {
                logger.loader(`Fail to load command ${file}: ${e.message}`, 'error');
            }
        }

        // Load Events
        const eventPath = join(global.client.mainPath, 'Priyansh', 'events');
        const listEvent = readdirSync(eventPath).filter(file => file.endsWith('.js') && !global.config.eventDisabled.includes(file));
        
        for (const file of listEvent) {
            try {
                const module = require(join(eventPath, file));
                global.client.events.set(module.config.name, module);
                logger.loader(`Loaded Event: ${module.config.name}`);
            } catch (e) {
                logger.loader(`Fail to load event ${file}: ${e.message}`, 'error');
            }
        }

        logger.loader(`Bot is online! Total Commands: ${global.client.commands.size} | Events: ${global.client.events.size}`);
        
        const listenerData = { api, models: botModel };
        const listener = require('./includes/listen')(listenerData);

        global.handleListen = api.listenMqtt((error, message) => {
            if (error) return logger(JSON.stringify(error), 'LISTENER ERROR');
            if (['presence', 'typ', 'read_receipt'].includes(message.type)) return;
            if (global.config.DeveloperMode) console.log(message);
            return listener(message);
        });
    });
}

//========= Start Database and Bot =========//
(async () => {
    try {
        await sequelize.authenticate();
        const models = require('./includes/database/model')({ Sequelize, sequelize });
        logger("Connected to Database!", "[ DATABASE ]");
        onBot({ models });
    } catch (e) {
        logger(`Database connection failed: ${e.message}`, "[ DATABASE ]");
    }
})();

process.on('unhandledRejection', (err) => { /* Silently handle rejections */ });
