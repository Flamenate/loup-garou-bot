import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedField,
    SelectMenuComponentOptionData,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import pgClient from "../../utils/pgClient";
import { warnReply } from "../../utils/replies";
import moment from "moment";

const data = new SlashCommandBuilder()
    .setName("history")
    .setDescription("View this server's game history.");

module.exports = {
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const query = await pgClient.query(
            "SELECT uuid, narrator_id, game_thread_id, start_timestamp, winners, players FROM games WHERE guild_id = $1 ORDER BY start_timestamp DESC LIMIT 9;",
            [guildConfig.guildId]
        );
        if (query.rowCount === 0)
            return await warnReply(
                interaction,
                "There have been no games in this guild so far."
            );
        const embedFields: EmbedField[] = [];
        const menuOptions: SelectMenuComponentOptionData[] = [];
        for (const partialGameData of query.rows) {
            embedFields.push({
                name: `${partialGameData.winners} Victory`,
                value: `* Narrator: <@${
                    partialGameData.narrator_id
                }>\n* Thread: <#${
                    partialGameData.game_thread_id
                }>\n* Players: ${
                    partialGameData.players.length
                }\n* Date: <t:${moment(
                    partialGameData.start_timestamp
                ).unix()}>\n`,
                inline: true,
            });
            menuOptions.push({
                label: `${partialGameData.winners} Victory`,
                value: partialGameData.uuid,
                description: moment(partialGameData.start_timestamp).fromNow(),
            });
        }
        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "🐺 Games",
                    description:
                        "Select a game from the dropdown menu to view its details.",
                    fields: embedFields,
                    thumbnail: {
                        url: interaction.client.user.avatarURL() || "",
                    },
                }).setColor("White"),
            ],
            components: [
                new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            customId: `history|${interaction.user.id}`,
                            maxValues: 1,
                            minValues: 1,
                            placeholder: "Select a game...",
                            options: menuOptions,
                        }),
                    ],
                }),
            ],
        });
    },
};
