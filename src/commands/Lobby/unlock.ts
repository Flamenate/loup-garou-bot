import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { errorReply, successReply } from "../../utils/replies";

const data = new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock the game lobby.");

module.exports = {
    narratorOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        if (!guildConfig.lobby.isLocked)
            return await errorReply(interaction, "❔ Lobby is not locked.");

        await guildConfig.unlockLobby();

        await successReply(interaction, "🔓 Lobby has been unlocked.");
    },
};
