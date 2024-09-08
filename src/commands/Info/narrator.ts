import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";

const data = new SlashCommandBuilder()
    .setName("narrator")
    .setDescription("View the current narrator.");

module.exports = {
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const narratorId = guildConfig.narratorId;

        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "Current Narrator",
                    description: narratorId
                        ? `The current narrator is **<@${narratorId}>**.`
                        : "This server has no narrator.",
                    timestamp: new Date(),
                }).setColor("White"),
            ],
        });
    },
};
