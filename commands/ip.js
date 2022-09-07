const { SlashCommandBuilder } = require("discord.js");
axios = require("axios");
const utils = require("../utils");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ip")
		.setDescription("Gives ark-bot's IP address."),
	async execute(interaction) {
		await axios
			.get("https://www.myexternalip.com/json")
			.then((response) => {
				console.log(
					`[${utils.timestamp()}] (${interaction.user.tag}): ip - ${
						response.data.ip
					}`
				);
				interaction.reply(`IP: ${response.data.ip}`);
			});
	},
};
