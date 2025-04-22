import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
    EmbedBuilder,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { ErrorEmbed } from "../../utils/replies";

const data = new SlashCommandBuilder()
    .setName("accuse")
    .setDescription("Helpful command to make accusation list");

const buttonsPerActionRow = 5;
const maxActionRows = 5;

module.exports = {
    narratorOnly: true,
    inGameOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const game = guildConfig.currentGame!;
        if (game.accusationActive)
            return await interaction.reply({
                embeds: [new ErrorEmbed("Accusation is already active.")],
                ephemeral: true,
            });

        let neededActionRows = Math.ceil(
            game.alivePlayers.length / buttonsPerActionRow
        );
        if (neededActionRows < maxActionRows) {
            neededActionRows++;
        }
        const actionRows = new Array<ActionRowBuilder<ButtonBuilder>>(
            neededActionRows
        );
        let currentActionRowIndex = 0;
        for (let i = 0; i < game.alivePlayers.length; i++) {
            if (i > 0 && i % buttonsPerActionRow === 0) {
                currentActionRowIndex++;
            }
            if (!actionRows[currentActionRowIndex]) {
                actionRows[currentActionRowIndex] =
                    new ActionRowBuilder<ButtonBuilder>();
            }
            const player = game.alivePlayers[i];
            actionRows[currentActionRowIndex].addComponents(
                new ButtonBuilder({
                    customId: `accuse|${game.uuid}|${interaction.user.id}|${player.id}`, //83 (6 + 1 + 36 + 1 + 19 + 1 + 19) characters. Max for customId is 100.
                    label: player.gameNickname,
                    style: ButtonStyle.Primary,
                })
            );
        }
        const endAccusationButton = new ButtonBuilder({
            customId: `accuse|${game.uuid}|${interaction.user.id}|end`,
            label: "End Accusation",
            style: ButtonStyle.Danger,
        });
        if (!actionRows[actionRows.length - 1]) {
            actionRows.push(
                new ActionRowBuilder<ButtonBuilder>().setComponents(
                    endAccusationButton
                )
            );
        } else {
            actionRows[actionRows.length - 1].addComponents(
                endAccusationButton
            );
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "Accusation",
                    description: `${interaction.user} click on the buttons to count accusations.`,
                    timestamp: new Date(),
                }).setColor("NotQuiteBlack"),
            ],
            components: actionRows,
        });
    },
};
