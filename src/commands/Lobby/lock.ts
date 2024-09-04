import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { errorReply, warnReply } from "../../utils/replies";

const data = new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock the game lobby.");

module.exports = {
    narratorOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        if (guildConfig.lobby.isLocked)
            return await errorReply(interaction, "❔ Lobby is already locked.");

        await guildConfig.lockLobby();

        await warnReply(interaction, "🔒 Lobby has been locked.");
    },
};
