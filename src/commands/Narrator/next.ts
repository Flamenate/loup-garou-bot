import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalActionRowComponentBuilder,
    TextChannel,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import logger, { LogType } from "../../utils/Logger";

const data = new SlashCommandBuilder()
    .setName("next")
    .setDescription("Advance the day/night cycle (narrator only).");

module.exports = {
    narratorOnly: true,
    inGameOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const game = guildConfig.currentGame!;
        if (game.isDaytime) {
            game.advanceToNight();
            await interaction.reply({ embeds: [game.infoEmbed] });
            try {
                const textChannel = await interaction.guild?.channels.fetch(
                    game.channelIds.text
                );
                const gameThread = await (
                    textChannel as TextChannel
                ).threads.fetch(game.threadIds.game);
                await gameThread?.setLocked(true);
            } catch (error) {
                logger.write({
                    level: LogType.Warn,
                    interaction,
                    message: error as Error,
                });
            }
            return;
        }

        const modal = new ModalBuilder({
            title: `Night ${game.timeCycle.night} Summary`,
            customId: `nightModal|${game.uuid}`,
        }).setComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>({
                components: [
                    new TextInputBuilder({
                        customId: "events",
                        required: true,
                        label: "What happened last night?",
                        placeholder: `Please type what happened in night ${game.timeCycle.night}...`,
                        style: TextInputStyle.Paragraph,
                    }),
                ],
            })
        );
        await interaction.showModal(modal);
    },
};
