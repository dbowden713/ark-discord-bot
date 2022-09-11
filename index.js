const {
	Client,
	GatewayIntentBits,
	ActivityType,
	Collection,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const utils = require("./utils");
const config = require("./config.json");
const { token } = require("./token.json");

// Start a new discord client
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Set up bot commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands"); // Look in command folder
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js")); // find .js files in command folder

// For each .js file found...
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	// Set a /command. Each /command is the same as the file name
	client.commands.set(command.data.name, command);
}

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

	// Try to find interaction in command list
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
	}, config.reconnect_delay);
});

// Login to discord with the token from token.json
client.login(token);
