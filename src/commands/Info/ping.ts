import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { successReply } from "../../utils/replies";

const data = new SlashCommandBuilder().setName("ping").setDescription("Pong!");

module.exports = {
    data,
    async execute(interaction: ChatInputCommandInteraction) {
        await successReply(
            interaction,
            `🏓 Pong! \`${interaction.client.ws.ping} ms\``
        );
    },
};
