import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

const data = new SlashCommandBuilder()
    .setName("history")
    .setDescription("View this server's game history.");

module.exports = {
    data,
    async execute(interaction: ChatInputCommandInteraction) {},
};
