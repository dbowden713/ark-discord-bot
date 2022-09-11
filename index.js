const {
	Client,
	GatewayIntentBits,
	ActivityType,
	ChannelType,
	Collection,
} = require("discord.js");
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

// Login to discord with the token from token.json
client.login(token);
