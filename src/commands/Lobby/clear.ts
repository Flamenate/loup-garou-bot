import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { successReply } from "../../utils/replies";

const data = new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear the entire lobby.");

module.exports = {
    narratorOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        await guildConfig.updateLobby([]);
        await successReply(interaction, "💨 Lobby was cleared successfully.");
    },
};
