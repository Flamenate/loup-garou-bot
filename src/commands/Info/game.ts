import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";

const data = new SlashCommandBuilder()
    .setName("game")
    .setDescription("View information about the current game.");

module.exports = {
    inGameOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const game = guildConfig.currentGame!;
        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "🐺 Current Game",
                    description: `Narrator: <@${game.narratorId}>\nClick one of the buttons below to view relevant information.`,
                }).setColor("White"),
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            customId: `gameInfo|remRoles|${interaction.user.id}|${game.uuid}`,
                            label: "Remaining Roles",
                            emoji: "🛖",
                            style: ButtonStyle.Secondary,
                        }),
                        new ButtonBuilder({
                            customId: `gameInfo|gameInfo|${interaction.user.id}|${game.uuid}`,
                            label: "Game Info",
                            emoji: "🐺",
                            style: ButtonStyle.Secondary,
                        }),
                        new ButtonBuilder({
                            customId: `gameInfo|nightHistory|${interaction.user.id}|${game.uuid}`,
                            label: "Night History",
                            emoji: "📜",
                            style: ButtonStyle.Secondary,
                        }),
                        ...(interaction.user.id === game.narratorId
                            ? [
                                  new ButtonBuilder({
                                      customId: `gameInfo|narrationInfo|${interaction.user.id}|${game.uuid}`,
                                      label: "Narration Info",
                                      emoji: "ℹ️",
                                      style: ButtonStyle.Success,
                                  }),
                              ]
                            : []),
                    ],
                }),
            ],
        });
    },
};
