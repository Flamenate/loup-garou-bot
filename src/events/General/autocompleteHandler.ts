import { Events, Interaction } from "discord.js";
import ExtendedClient from "../../models/ExtendedClient";
import logger, { LogType } from "../../utils/Logger";

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isAutocomplete()) return;

        const command = (interaction.client as ExtendedClient).commands.get(
            interaction.commandName
        );
        if (!command) return;

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            logger.write({
                level: LogType.Error,
                interaction,
                message: error as Error,
            });
        }
    },
};
