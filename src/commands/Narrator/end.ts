import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    TextChannel,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import logger, { LogType } from "../../utils/Logger";
import changeMemberNickname from "../../utils/changeMemberNickname";

const data = new SlashCommandBuilder()
    .setName("end")
    .setDescription("End a game.")
    .addStringOption((opt) =>
        opt
            .setName("winners")
            .setDescription("The winning camp.")
            .setMaxLength(48)
            .setRequired(true)
    );

module.exports = {
    narratorOnly: true,
    inGameOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const game = guildConfig.currentGame!;

        const winners = (
            interaction.options as CommandInteractionOptionResolver
        ).getString("winners", true);

        await interaction.deferReply();

        await guildConfig.endGame(winners);
        try {
            const textChannel = await interaction.guild?.channels.fetch(
                game.channelIds.text
            );
            for (const threadId of [
                game.threadIds.narrator,
                game.threadIds.loups,
                game.threadIds.loner,
            ]) {
                if (!threadId) continue;
                const narrationThread = await (
                    textChannel as TextChannel
                )?.threads.fetch(threadId);
                await narrationThread?.delete();
            }

            const gameThread = await (
                textChannel as TextChannel
            )?.threads.fetch(game.threadIds.game);
            await gameThread?.setLocked(true);
            await gameThread?.setArchived(true);

            const narrator = await interaction.guild!.members.fetch(
                game.narratorId
            );

            await Promise.allSettled([
                ...game.deadPlayers.map(async (player) => {
                    const member = await interaction.guild!.members.fetch(
                        player.id
                    );
                    await changeMemberNickname(member, player.originalNickname);
                }),
                changeMemberNickname(narrator, null),
            ]);
        } catch (error) {
            logger.write({
                level: LogType.Warn,
                interaction,
                message: error as Error,
            });
        }

        await interaction.editReply({
            content: `# *${winners}* Victory!`,
            embeds: [game.narrationEmbeds[1]],
        });
    },
};
