import { Events, Interaction, TextChannel } from "discord.js";
import getGuildConfig from "../../utils/getGuildConfig";
import logger, { LogType } from "../../utils/Logger";

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isModalSubmit()) return;
        const [_, uuid] = interaction.customId.split("|");
        const { currentGame } = getGuildConfig(interaction);
        if (!currentGame || uuid !== currentGame.uuid) return;

        const lastNightEvents = interaction!.fields.getTextInputValue("events");
        currentGame.advanceToDay(lastNightEvents);
        await interaction.reply({ embeds: [currentGame.infoEmbed] });
        try {
            const textChannel = await interaction.guild?.channels.fetch(
                currentGame.channelIds.text
            );
            const gameThread = await (textChannel as TextChannel).threads.fetch(
                currentGame.threadIds.game
            );
            await gameThread?.setLocked(false);
        } catch (error) {
            logger.write({
                level: LogType.Warn,
                interaction: {
                    commandName: "nightEventModal",
                    user: interaction.user,
                },
                message: error as Error,
            });
        }
    },
};
