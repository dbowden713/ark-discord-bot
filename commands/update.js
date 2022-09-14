const { SlashCommandBuilder } = require("discord.js");
const utils = require("../utils");

// /update runs a server update script using SteamCMD
module.exports = {
	data: new SlashCommandBuilder()
		.setName("update")
		.setDescription(
			"Update the server. Stops the server if it is running. May take a while!"
		),
	async execute(interaction) {
		// Do nothing if a server instance is already running
		if (await utils.serverIsRunning()) {
			console.log(
				`[${utils.timestamp()}] (${
					interaction.user.tag
				}): update - stopping server to update`
			);
			await interaction.reply("Stopping server to update! :thumbsup:");
			utils.stopServer().then((x) => {
				utils.updateServer(interaction);
			});
		} else {
			console.log(
				`[${utils.timestamp()}] (${
					interaction.user.tag
				}): update - updating server`
			);
			await interaction.reply("Updating server...");
			utils.updateServer(interaction);
		}
	},
};
