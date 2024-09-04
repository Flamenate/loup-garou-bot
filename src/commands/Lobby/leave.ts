import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { errorReply, warnReply } from "../../utils/replies";
import GuildConfig from "../../models/GuildConfig";

const data = new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave the game lobby.");

module.exports = {
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        if (!guildConfig.lobby.waitingIds.includes(interaction.user.id))
            return await errorReply(
                interaction,
                "❔ You have not joined the game lobby."
            );

        if (guildConfig.currentGame)
            return await errorReply(
                interaction,
                "🐺 You cannot leave a game in progress."
            );

        const newLobbyIds = guildConfig.lobby.waitingIds.filter(
            (id) => id !== interaction.user.id
        );
        await guildConfig.updateLobby(newLobbyIds);

        await warnReply(
            interaction,
            `⛔ ${interaction.user} has left the lobby.`
        );
    },
};
