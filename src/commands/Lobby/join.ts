import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { errorReply, successReply } from "../../utils/replies";
import Game from "../../models/Game";
import GuildConfig from "../../models/GuildConfig";

const data = new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join the game lobby.");

module.exports = {
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        if (interaction.user.id === guildConfig.narratorId)
            return await errorReply(
                interaction,
                "🧑‍⚖️ The narrator cannot join the lobby."
            );
        if (guildConfig.lobby.waitingIds.includes(interaction.user.id))
            return await errorReply(
                interaction,
                "🚪 You have already joined the lobby."
            );
        if (guildConfig.lobby.isLocked || guildConfig.currentGame)
            return await errorReply(
                interaction,
                "🔒 Lobby is locked right now.",
                false
            );
        if (guildConfig.lobby.waitingIds.length >= Game.MaximumPlayerCount)
            return await errorReply(
                interaction,
                "⌛ Lobby is full right now.",
                false
            );
        if (guildConfig.blacklistedIds.includes(interaction.user.id))
            return await errorReply(
                interaction,
                "🚫 You have been banned from joining this server's lobby."
            );

        const newLobbyIds = guildConfig.lobby.waitingIds.concat(
            interaction.user.id
        );
        await guildConfig.updateLobby(newLobbyIds);

        await successReply(
            interaction,
            `✅ ${interaction.user} has joined the lobby.`
        );
    },
};
