const { SlashCommandBuilder } = require("discord.js");
axios = require("axios");
const utils = require("../utils");

// /status displays the current server status. Checks local process list and Steam API
module.exports = {
	data: new SlashCommandBuilder()
		.setName("status")
		.setDescription(
			"Checks if the server is running and connected to Steam."
		),
	async execute(interaction) {
		var runningLocally = false;
		var connectedToSteam = false;
		// Check local process list
		runningLocally = await utils.serverIsRunning();

		// Check Steam API
		await axios
			.get("https://www.myexternalip.com/json")
			.then((response) => {
				axios
					.get(
						`https://api.steampowered.com/ISteamApps/GetServersAtAddress/v1?addr=${response.data.ip}`
					)
					.then((response) => {
						if (response.data.response.success === true) {
							if (response.data.response.servers.length > 0) {
								connectedToSteam = true;
							} else {
								connectedToSteam = false;
							}
						}
						console.log(
							`[${utils.timestamp()}] (${
								interaction.user.tag
							}): status - Local: ${runningLocally} | Steam: ${connectedToSteam}`
						);
						interaction.reply(
							`Local: The server ${
								runningLocally ? "is" : "isn't"
							} running${
								runningLocally
									? "! :thumbsup:"
									: ". :thumbsdown:"
							}` +
								"\n" +
								`Steam: The server ${
									connectedToSteam ? "is" : "isn't"
								} connected to Steam${
									connectedToSteam ? "!" : "."
								}`
						);
					});
			});
	},
};
