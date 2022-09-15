const {
	SlashCommandBuilder,
	EmbedBuilder,
	AttachmentBuilder,
} = require("discord.js");
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
		var serverInfo;

		// Check local process list
		runningLocally = await utils.serverIsRunning();

		// If server is running, attempt to get info
		if (runningLocally) {
			serverInfo = await utils.serverInfo();
		}

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
							}): status - Local: ${runningLocally} | Map: ${
								serverInfo && serverInfo.map
									? serverInfo.map
									: "unknown"
							} | Steam: ${connectedToSteam}`
						);
						const file = new AttachmentBuilder(
							"https://static.wikia.nocookie.net/arksurvivalevolved_gamepedia/images/2/24/ARK.png"
						);
						interaction.deferReply().then(() => {
							const statusEmbed = new EmbedBuilder()
								.setColor(0x0099ff)
								.setTitle("Server Status")
								.setThumbnail("attachment://ARK.png")
								.addFields(
									{
										name: "Local",
										value: runningLocally
											? "Running"
											: "Not Running",
										inline: true,
									},
									{
										name: "\u200B",
										value: "\u200B",
										inline: true,
									},
									{
										name: "Steam",
										value: connectedToSteam
											? "Connected"
											: "Not Connected",
										inline: true,
									}
								);
							if (serverInfo && serverInfo != -1) {
								statusEmbed
									.setDescription(serverInfo.name)
									.addFields(
										{
											name: "Map",
											value: serverInfo.map,
											inline: true,
										},
										{
											name: "\u200B",
											value: "\u200B",
											inline: true,
										},
										{
											name: "Players",
											value: `${serverInfo.players}/${serverInfo.max_players}`,
											inline: true,
										}
									);
							}
							interaction.editReply({
								embeds: [statusEmbed],
								files: [file],
							});
						});
					});
			});
	},
};
