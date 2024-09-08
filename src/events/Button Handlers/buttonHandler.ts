import {
    ActionRowBuilder,
    ButtonInteraction,
    EmbedBuilder,
    Events,
    Interaction,
    StringSelectMenuBuilder,
} from "discord.js";
import getGuildConfig from "../../utils/getGuildConfig";
import { allRoles } from "../../models/Role";

async function handleEndVote(interaction: ButtonInteraction) {
    const { currentGame } = getGuildConfig(interaction);

    const [, uuid] = interaction.customId.split("|");

    if (
        !currentGame ||
        currentGame.uuid !== uuid ||
        !currentGame.vote ||
        interaction.user.id !== currentGame.narratorId
    )
        return;

    await currentGame.endVote({ interaction });
}

async function handleGameInfo(interaction: ButtonInteraction) {
    const { currentGame } = getGuildConfig(interaction);
    const [, infoType, userId, uuid] = interaction.customId.split("|");
    if (interaction.user.id !== userId || uuid !== currentGame?.uuid) return;

    switch (infoType) {
        case "remRoles":
            const rolesByCamp = Object.groupBy(
                currentGame.aliveRoles,
                (role) => `${role.camp.emoji} ${role.camp.name}`
            );
            await interaction.update({
                embeds: [
                    new EmbedBuilder({
                        title: "📜 Alive Roles",
                        description: `${currentGame.alivePlayers.length} players alive.`,
                        fields: Object.entries(rolesByCamp).map(
                            ([campName, roles]) => {
                                return {
                                    name: `${campName} (${roles!.length})`,
                                    value: roles!
                                        .map((role) => role.name)
                                        .join("\n"),
                                    inline: true,
                                };
                            }
                        ),
                    }).setColor("DarkGreen"),
                ],
            });
            break;

        case "gameInfo":
            await interaction.update({
                embeds: [currentGame.infoEmbed],
            });
            break;

        case "nightHistory":
            await interaction.update({
                embeds: [
                    new EmbedBuilder({
                        title: "📜 Night History",
                        description:
                            currentGame.events.length === 0
                                ? "Nothing happened yet..."
                                : currentGame.events
                                      .map(
                                          (events, index) =>
                                              `### Night ${
                                                  index + 1
                                              }\n${events}`
                                      )
                                      .join("\n"),
                    }).setColor("White"),
                ],
            });
            break;

        case "narrationInfo":
            if (interaction.user.id !== currentGame.narratorId) return;
            await interaction.update({
                embeds: currentGame.narrationEmbeds,
            });
            break;

        default:
            return;
    }
}

async function handleRoleInfo(interaction: ButtonInteraction) {
    const [, userId, campName] = interaction.customId.split("|");
    if (interaction.user.id !== userId) return;

    const campRoles = allRoles
        .filter((role) => role.camp.name === campName)
        .slice(0, 25); //figure out a way to include everything. maybe pagination or something.

    await interaction.update({
        embeds: [campRoles[0].infoEmbed],
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [
                    new StringSelectMenuBuilder({
                        customId: "roleMenu",
                        minValues: 1,
                        maxValues: 1,
                        placeholder: "Select a role...",
                        options: campRoles.map((role) => {
                            return {
                                value: role.name,
                                label: role.name,
                                emoji: role.camp.emoji,
                            };
                        }),
                    }),
                ],
            }),
        ],
    });
}

async function handleNarrationMessageUpdate(interaction: ButtonInteraction) {
    const { currentGame } = getGuildConfig(interaction);
    const [, uuid] = interaction.customId.split("|");
    if (
        interaction.user.id !== currentGame?.narratorId ||
        uuid !== currentGame?.uuid
    )
        return;

    await interaction.update({ embeds: currentGame.narrationEmbeds });
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isButton()) return;

        const [type] = interaction.customId.split("|");
        switch (type) {
            case "endVote":
                await handleEndVote(interaction);
                break;

            case "gameInfo":
                await handleGameInfo(interaction);
                break;

            case "roleInfo":
                await handleRoleInfo(interaction);
                break;

            case "updateNarration":
                await handleNarrationMessageUpdate(interaction);
                break;

            default:
                break;
        }
    },
};
