import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalActionRowComponentBuilder,
    TextChannel,
    GuildMember,
    PermissionsBitField,
    GuildChannelResolvable,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import logger, { LogType } from "../../utils/Logger";

const data = new SlashCommandBuilder()
    .setName("next")
    .setDescription("Advance the day/night cycle (narrator only).");

function memberHasManageThreads(
    member?: GuildMember,
    channel?: GuildChannelResolvable | null
) {
    if (!member || !channel) return false;
    const perms = member.permissionsIn(channel);
    return perms.has(PermissionsBitField.Flags.ManageThreads);
}

module.exports = {
    narratorOnly: true,
    inGameOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const game = guildConfig.currentGame!;
        const narrator = await interaction.guild?.members.fetch(
            game.narratorId
        );
        if (game.isDaytime) {
            await game.advanceToNight();
            await interaction.reply({ embeds: [game.infoEmbed] });
            try {
                const gameChannel = await interaction.guild?.channels.fetch(
                    game.channelIds.text
                );
                const gameThread = await (
                    gameChannel as TextChannel
                ).threads.fetch(game.threadIds.game);
                if (memberHasManageThreads(narrator, gameChannel))
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
