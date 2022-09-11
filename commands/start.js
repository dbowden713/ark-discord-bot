const { SlashCommandBuilder } = require("discord.js");
const utils = require("../utils");
const map_choices = require("../config.json").map_scripts;

// /start attempts to start a server if one isn't already running
module.exports = {
	data: new SlashCommandBuilder()
		.setName("start")
		.setDescription("Start a server for the specified map.")
		.addStringOption((option) =>
			option
				.setName("map")
				.setDescription("The name of the map to start.")
				.setRequired(true)
				.addChoices(
					...Object.entries(map_choices).map((entry) => {
						return {
							name: entry[0],
							value: entry[0],
						};
					})
				)
		),
	async execute(interaction) {
		// Do nothing if a server instance is already running
		if (await utils.serverIsRunning()) {
			console.log(
				`[${utils.timestamp()}] (${
					interaction.user.tag
				}): start - server is already running`
			);
			await interaction.reply(
				"The server is already running! :thinking:"
			);
		} else {
			let map = interaction.options.getString("map");
			console.log(
				`[${utils.timestamp()}] (${
					interaction.user.tag
				}): start - ${map}`
			);
			await interaction.reply(`Starting the ${map} server! :thumbsup:`);
			utils.startServer(map);
		}
	},
};
