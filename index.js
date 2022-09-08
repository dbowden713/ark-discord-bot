const {
	Client,
	GatewayIntentBits,
	ActivityType,
	ChannelType,
	Collection,
} = require("discord.js");
const axios = require("axios");
const { spawn, exec } = require("child_process");
const readline = require("readline");
const fs = require("node:fs");
const path = require("node:path");
const utils = require("./utils");
const config = require("./config.json");
const { token } = require("./token.json");

// Start a new discord client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

// Set up bot commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

// Config
const prefix = config.prefix;
const reconnect_delay = config.reconnect_delay;

// When the server is ready
client.once("ready", () => {
	console.log(`[${utils.timestamp()}] ark-bot connected!`);
	// Set ark-bot discord status
	client.user.setPresence({
		activities: [
			{
				name: "with otters",
				type: ActivityType.Playing,
			},
		],
		status: "online",
	});
});

// Command handling
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: "There was an error while executing this command!",
			ephemeral: true,
		});
	}
});

client.on("messageCreate", (message) => {
	// Only respond to messages with the prefix, and only respond to non-bots
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	// Commands must be from text or DM channels
	if (
		message.channel.type !== ChannelType.DM &&
		message.channel.type !== ChannelType.GuildText
	)
		return;

	// Check if the user is authorized. Server admins are always allowed.
	if (!userIsAuthorized(message)) {
		console.log(
			`[${utils.timestamp()}] (${
				message.author.tag
			}): ERROR - unauthorized user`
		);
		// Reply to DMs
		if (message.channel.type === ChannelType.DM) {
			message.reply("I can't do that! (unauthorized user)");
		}
		return; // Stop command execution here
	}

	// Check for command arguments and split into array
	const args = message.content.slice(prefix.length).toLowerCase().split(" ");
	const command = args.shift().toLowerCase();

	// !start attempts to start a server if one isn't already running
	if (command === "start") {
		isRunning("ShooterGameServer.exe", (status) => {
			// Do nothing if a server instance is already running
			if (status) {
				console.log(
					`[${utils.timestamp()}] (${
						message.author.tag
					}): start - server is already running`
				);
				message.reply("The server is already running! :thinking:");
			} else {
				// No map name given. Example: !start
				if (args.length === 0) {
					console.log(
						`[${utils.timestamp()}] (${
							message.author.tag
						}): start - NO MAP GIVEN!`
					);
					message.reply("Please give a map to start! :dizzy_face:");
					message.channel.send("Example: `!start island`");
					message.channel.send(
						"Maps: `island, scorchedearth, ragnarok, aberration, valguero, lostisland, genesis, crystalisles`"
					);
					// Too many arguments given. Example: !start my map
				} else if (args.length > 1) {
					console.log(
						`[${utils.timestamp()}] (${
							message.author.tag
						}): start - TOO MANY ARGS: ${args}`
					);
					message.reply("IDK What you're saying! :sob:");
					message.channel.send("Example: `!start island`");
					message.channel.send(
						"Maps: `island, scorchedearth, ragnarok, aberration, valguero, lostisland, genesis, crystalisles`"
					);
					// One argument given. Check that it is actually a valid map name
				} else {
					// If the argument was a valid map name
					if (
						args[0] === "island" ||
						args[0] === "scorchedearth" ||
						args[0] === "ragnarok" ||
						args[0] === "aberration" ||
						args[0] === "valguero" ||
						args[0] === "lostisland" ||
						args[0] === "genesis" ||
						args[0] === "crystalisles"
					) {
						console.log(
							`[${utils.timestamp()}] (${
								message.author.tag
							}): start - ${args[0]}`
						);
						message.reply(
							`Starting the \`${args[0]}\` server! :thumbsup:`
						);
						startServer(message, args[0]);
						// If the argument wasn't a correct map name
					} else {
						console.log(
							`[${utils.timestamp()}] (${
								message.author.tag
							}): start - INVALID MAP: ${args[0]}`
						);
						message.reply("That's not a map! :angry:");
						message.channel.send(
							"Maps: `island, scorchedearth, ragnarok, aberration, valguero, lostisland, genesis, crystalisles`"
						);
					}
				}
			}
		});
	}

	// !stop attempts to kill the server process if it's currently running
	if (command === "stop") {
		isRunning("ShooterGameServer.exe", (status) => {
			if (status) {
				console.log(
					`[${utils.timestamp()}] (${
						message.author.tag
					}): stop - stopping server...`
				);
				message.reply("Shutting down the server! :dizzy_face:");
				stopServer();
			} else {
				console.log(
					`[${utils.timestamp()}] (${
						message.author.tag
					}): stop - server is not running`
				);
				message.reply("The server isn't running. :thinking:");
			}
		});
	}

	// !update updates the server using SteamCMD
	if (command === "update") {
		// The server should be stopped before updating
		isRunning("ShooterGameServer.exe", (status) => {
			if (status) {
				console.log(
					`[${utils.timestamp()}] (${
						message.author.tag
					}): update - stopping server to update`
				);
				message.reply("Stopping server to update! :thumbsup:");
				stopServer();
				updateServer(message);
			} else {
				console.log(
					`[${utils.timestamp()}] (${
						message.author.tag
					}): update - updating server`
				);
				message.reply("Updating server. :ok_hand:");
				updateServer(message);
			}
		});
	}
});

// Attempt to reconnect if the bot ever disconnects
client.on("error", (error) => {
	console.log(`[${utils.timestamp()}] (ERROR) - ${error.message}`);
	console.log(`[${utils.timestamp()}] attempting to reconnect...`);
	let reconnect = setInterval(() => {
		if (client.status === 0) {
			clearInterval(reconnect);
		} else {
			client.login(token).catch(() => {
				console.log(
					`[${utils.timestamp()}] reconnect failed. trying again...`
				);
			});
		}
	}, reconnect_delay);
});

function userIsAuthorized(message) {
	// Check if user has a whitelisted name or role
	// Server admins are always allowed
	// Users in the authorized_users whitelist skip server role checks (allows DMs)

	// Check for user tag in the authorized_users whitelist
	if (config.authorized_users.includes(message.author.tag)) return true;

	// Check for user role in the authorized_roles whitelist
	if (message.channel.type === ChannelType.GuildText) {
		// Always allow server admins
		if (message.member.permissions.has("ADMINISTRATOR")) return true;

		// Check each role the user has against the authorized_roles
		let hasAuthorizedRole = message.member.roles.cache.some((role) => {
			return config.authorized_roles.includes(role.name);
		});
		if (hasAuthorizedRole) return true;
	}

	return false;
}

function startServer(message, map) {
	if (map === "island") {
		server = spawn("start_island.bat", [], {
			cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\",
			shell: true,
		});
	} else if (map === "scorchedearth") {
		server = spawn("start_scorchedearth.bat", [], {
			cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\",
			shell: true,
		});
	} else if (map === "ragnarok") {
		server = spawn("start_ragnarok.bat", [], {
			cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\",
			shell: true,
		});
	} else if (map === "aberration") {
		server = spawn("start_aberration.bat", [], {
			cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\",
			shell: true,
		});
	} else if (map === "valguero") {
		server = spawn("start_valguero.bat", [], {
			cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\",
			shell: true,
		});
	} else if (map === "lostisland") {
		server = spawn("start_lostisland.bat", [], {
			cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\",
			shell: true,
		});
	} else if (map === "genesis") {
		server = spawn("start_genesis.bat", [], {
			cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\",
			shell: true,
		});
	} else if (map === "crystalisles") {
		server = spawn("start_crystalisles.bat", [], {
			cwd: "C:\\Ark\\ArkServer\\ShooterGame\\Binaries\\Win64\\",
			shell: true,
		});
	} else {
		console.log(
			`[${utils.timestamp()}] (${
				message.author.tag
			}): start - INVALID MAP ARG: ${map}`
		);
	}
}

function updateServer(message) {
	// SteamCMD update script for ARK
	let options = [
		"+login",
		"anonymous",
		"+force_install_dir",
		config.arkserver_dir,
		"+app_update",
		"376030",
		"+quit",
	];

	// Start SteamCMD and attempt to update
	let update = spawn("steamcmd", options, { cwd: config.steamcmd_dir });

	update.stdout.on("data", (data) => {
		console.log(`${data}`);
	});

	// Wait for output from SteamCMD, then send it to discord and console
	/* readline.createInterface({
        input: update.stdout
    }).on('line', line => {
        console.log(line);
    }); */
}

function stopServer() {
	// Attempt to stop the server process
	exec(`taskkill /im ShooterGameServer.exe /t`, (err, stdout, stderr) => {
		// This should never run since we already made sure the process exists
		if (err) {
			throw err;
		}

		// The /^(?!\s*$).+/ regex keeps any blank lines from cluttering the output
		if (stdout) {
			stdout.split("\n").forEach((line) => {
				if (/^(?!\s*$).+/.test(line)) {
					console.log(
						`[${utils.timestamp()}] (TASKKILL):`,
						"stdout -",
						line
					);
				}
			});
		}

		// The /^(?!\s*$).+/ regex keeps any blank lines from cluttering the output
		if (stderr) {
			stderr.split("\n").forEach((line) => {
				if (/^(?!\s*$).+/.test(line)) {
					console.log(
						`[${utils.timestamp()}] (TASKKILL):`,
						"stderr -",
						line
					);
				}
			});
		}
	});
}

// Login to discord with the token from token.json
client.login(token);
