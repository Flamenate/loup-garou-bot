import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { errorReply, warnReply } from "../../utils/replies";

const data = new SlashCommandBuilder()
    .setName("unjoin")
    .setDescription("Kick someone from the game lobby.")
    .addUserOption((opt) =>
        opt
            .setName("user")
            .setDescription("User to kick from the game lobby.")
            .setRequired(true)
    );

module.exports = {
    narratorOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const targetUser = (
            interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);

        if (!guildConfig.lobby.waitingIds.includes(targetUser.id))
            return await errorReply(
                interaction,
                `❔ ${targetUser} is not in the game lobby.`
            );

        if (guildConfig.currentGame)
            return await errorReply(
                interaction,
                "❌ You cannot kick someone from a game in progress."
            );

        const newLobbyIds = guildConfig.lobby.waitingIds.filter(
            (id) => id !== targetUser.id
        );
        await guildConfig.updateLobby(newLobbyIds);

        await warnReply(
            interaction,
            `👞 ${targetUser} has been forced out of the lobby.`
        );
    },
};
