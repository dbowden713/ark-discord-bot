const { SlashCommandBuilder } = require("discord.js");
const utils = require("../utils");

// /stop attempts to kill the server process if it's currently running
module.exports = {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stops the server if it is running."),
	async execute(interaction) {
		// Check if server is running
		if (await utils.serverIsRunning()) {
			console.log(
				`[${utils.timestamp()}] (${
					interaction.user.tag
				}): stop - stopping server...`
			);
			utils.stopServer();
			await interaction.reply("Shutting down the server! :dizzy_face:");
		} else {
			console.log(
				`[${utils.timestamp()}] (${
					interaction.user.tag
				}): stop - server is not running`
			);
			await interaction.reply({
				content: "The server isn't running. :thinking:",
				ephemeral: true,
			});
		}
	},
};
