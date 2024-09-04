import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
} from "discord.js";
import { errorReply } from "../../utils/replies";

const data = new SlashCommandBuilder()
    .setName("add")
    .setDescription("Mention a player to add them to one of the game threads.")
    .addUserOption((opt) =>
        opt
            .setName("player")
            .setDescription("Player to mention")
            .setRequired(true)
    );

module.exports = {
    narratorOnly: true,
    inGameOnly: true,
    data,
    async execute(interaction: ChatInputCommandInteraction) {
        const targetUser = (
            interaction.options as CommandInteractionOptionResolver
        ).getUser("player", true);
        if (!interaction.channel || !interaction.channel.isThread())
            return await errorReply(
                interaction,
                "You can only use this command in threads."
            );
        await interaction.reply({ content: targetUser.toString() });
    },
};
