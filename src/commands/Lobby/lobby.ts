import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { warnReply } from "../../utils/replies";
import Game from "../../models/Game";
import GuildConfig from "../../models/GuildConfig";

const data = new SlashCommandBuilder()
    .setName("lobby")
    .setDescription("View the lobby.");

module.exports = {
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const {
            lobby: { waitingIds },
        } = guildConfig;

        if (waitingIds.length === 0)
            return await warnReply(interaction, "Lobby is empty right now.");

        const game = guildConfig.currentGame;
        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: game ? "🐺 Current Players" : "🐺 Lobby",
                    description: game
                        ? game.players
                              .map((player) => player.mention)
                              .join("\n")
                        : waitingIds.map((id) => `<@${id}>`).join("\n"),
                    footer: {
                        text: `${waitingIds.length} player${
                            waitingIds.length != 1 ? "s" : ""
                        } waiting.`,
                    },
                }).setColor(
                    waitingIds.length >= Game.MinimumPlayerCount
                        ? "Green"
                        : "Gold"
                ),
            ],
        });
    },
};
