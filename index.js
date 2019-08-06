const Discord = require('discord.js');
const axios = require('axios');
const { spawn, exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const util = require('util');

const config = require('./config.json');
const { token } = require('./token.json');

// Start a new discord client
const client = new Discord.Client();

// Config
const prefix = config.prefix;

// When the server is ready
client.once('ready', () => {
    console.log(`[${getTimestamp()}] ark-bot started!`);
    client.user.setPresence({
        game: { 
            name: "with other otters",
            type: 'PLAYING'
        },
        status: 'online'
    });
});

client.on('message', message => {
    // Only respond to messages with the prefix, and only respond to non-bots
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Check for authorized users, but only respond to DMs
    if (message.author.tag !== "Old Man#1726" && message.author.tag !== "Keilania#6826") {
        if (message.channel.type === "dm") {
            message.reply("I can't do that! (unauthorized user)");
            return;
        }
    }

    // Check for command arguments from discord and split into array
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    // !ip returns the external ip address of the bot
    if (command === 'ip') {
        axios.get("https://www.myexternalip.com/json").then(response => {
            message.reply(`IP: ${response.data.ip}`);
        });
    }

    // !start attempts to start the server if it isn't already running
    if (command === 'start') {
        isRunning('ShooterGameServer.exe', status => {
            if (status) {
                console.log(`[${getTimestamp()}] (${message.author.tag}): start - server is already running`);
                message.reply("The server is already running! :thinking:");
            } else {
                if(args.length === 0) {
                    console.log(`[${getTimestamp()}] (${message.author.tag}): start - NO MAP GIVEN!`);
                    message.reply("Please give a map to start! :dizzy_face:");
                    message.channel.send("Example: \`!start island\`");
                    message.channel.send("Maps: \`island, aberration, valguero, newisland\`");
                } else if (args.length > 1) {
                    console.log(`[${getTimestamp()}] (${message.author.tag}): start - TOO MANY ARGS: ${args}`);
                    message.reply("IDK What you're saying! :sob:");
                    message.channel.send("Example: \`!start island\`");
                    message.channel.send("Maps: \`island, aberration, valguero, newisland\`");
                } else {
                    if(args[0] === "island" || args[0] === "aberration" || args[0] === "valguero" || args[0] === "newisland") {
                        console.log(`[${getTimestamp()}] (${message.author.tag}): start - ${args[0]}`);
                        message.reply(`Starting the \`${args[0]}\` server! :thumbsup:`);
                        startServer(message, args[0]);
                    } else {
                        console.log(`[${getTimestamp()}] (${message.author.tag}): start - INVALID MAP: ${args[0]}`);
                        message.reply("That's not a map! :angry:");
                        message.channel.send("Maps: \`island, aberration, valguero, newisland\`");
                    }
                }
            }
        })
    }

    // !stop attempts to kill the server process if it's currently running
    if (command === 'stop') {
        isRunning('ShooterGameServer.exe', status => {
            if (status) {
                console.log(`[${getTimestamp()}] (${message.author.tag}): stop - stopping server...`);
                message.reply("Shutting down the server! :dizzy_face:");
                stopServer();
            } else {
                console.log(`[${getTimestamp()}] (${message.author.tag}): stop - server is not running`);
                message.reply("The server isn't running. :thinking:");
            }
        })
    }

    // !status the bot displays the current server status
    if (command === 'status') {
        isRunning('ShooterGameServer.exe', status => {
            if (status) {
                console.log(`[${getTimestamp()}] (${message.author.tag}): status - running`);
                message.reply("Local: The server is running! :thumbsup:");
            } else {
                console.log(`[${getTimestamp()}] (${message.author.tag}): status - not running`);
                message.reply("Local: The server isn't running. :thumbsdown:");
            }
        });
        axios.get("https://www.myexternalip.com/json").then(response => {
            axios.get(`http://api.steampowered.com/ISteamApps/GetServersAtAddress/v1?addr=${response.data.ip}`).then(response => {
                if(response.data.response.success === true) {
                    if(response.data.response.servers.length > 0) {
                        console.log(`[${getTimestamp()}] (Steam API): status - running`);
                        message.reply("Steam API: Server is connected to Steam!");
                    } else {
                        console.log(`[${getTimestamp()}] (Steam API): status - not running`);
                        message.reply("Steam API: Server isn't connected to Steam.");
                    }
                }
            });
        });
    }

    if (command === 'update') {
        isRunning('ShooterGameServer.exe', status => {
            if (status) {
                console.log(`[${getTimestamp()}] (${message.author.tag}): update - stopping server to update`);
                message.reply("Stopping server to update! :thumbsup:");
                stopServer();
                updateServer(message);
            } else {
                console.log(`[${getTimestamp()}] (${message.author.tag}): update - updating server`);
                message.reply("Updating server. :ok_hand:");
                updateServer(message);
            }
        });
    }
});


// Return a new date in 24-hour format: 14:22:39
function getTimestamp() {
    return new Date().toLocaleTimeString('en-us', { hour12: false });
}

// Uses tasklist command and checks for (query) in the process list, with a callback for the result
const isRunning = (query, cb) => {
    let cmd = `tasklist`;
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}

function startServer(message, map) {
    if(map === "island"){    
        server = spawn('start_island.bat', [] ,{cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\", shell: true});
    } else if (map === "aberration") {
        server = spawn('start_aberration.bat', [] ,{cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\", shell: true});
    } else if (map === "valguero") {
        server = spawn('start_valguero.bat', [] ,{cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\", shell: true});
    } else if (map === "newisland") {
        server = spawn('start_newisland.bat', [] ,{cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\", shell: true});
    } else {
        console.log(`[${getTimestamp()}] (${message.author.tag}): start - INVALID MAP ARG: ${map}`);
    }
}

function updateServer(message) {
    // SteamCMD update script for ARK
    let options = [ 
        '+login', 'anonymous', 
        "+force_install_dir", "C:\\Ark\\ArkServer", 
        "+app_update", "376030", "exit"
    ]

    // Start SteamCMD and attempt to update
    let update = spawn('steamcmd', options, {cwd: "C:\\Ark\\steamcmd"});

    // Wait for output from SteamCMD, then send it to discord and console
    readline.createInterface({
        input: update.stdout
    }).on('line', line => {
        console.log(line);
        if (line != '') message.channel.send(`\`${line}\``);
    });
}

function stopServer() {
    // Attempt to stop the server process
    exec(`taskkill /im ShooterGameServer.exe /t`, (err, stdout, stderr) => {
        // This should never run since we already made sure the process exists
        if (err) {
          throw err;
        }

        // The /^(?!\s*$).+/ regex keeps any blank lines from cluttering the output
        if(stdout) {
            stdout.split('\n').forEach(line => {
                if(/^(?!\s*$).+/.test(line)) {
                    console.log(`[${getTimestamp()}] (TASKKILL):`, 'stdout -', line);
                }
            });
        }

        // The /^(?!\s*$).+/ regex keeps any blank lines from cluttering the output
        if(stderr) {
            stderr.split('\n').forEach(line => {
                if(/^(?!\s*$).+/.test(line))  {
                    console.log(`[${getTimestamp()}] (TASKKILL):`, 'stderr -',line);
                }
            });
        }
      })
}

// Login to discord with the token from config.json
client.login(token);
