import {
    EmbedBuilder,
    Events,
    Interaction,
    StringSelectMenuInteraction,
} from "discord.js";
import getGuildConfig from "../../utils/getGuildConfig";
import { errorReply, WarnEmbed } from "../../utils/replies";
import { allRoles, RoleOptions } from "../../models/Role";
import pgClient from "../../utils/pgClient";
import Game from "../../models/Game";
import Player, { PlayerOptions } from "../../models/Player";

async function handleMarryMenu(interaction: StringSelectMenuInteraction) {
    const { currentGame, narratorId } = getGuildConfig(interaction);
    const [, uuid] = interaction.customId.split("|");
    if (currentGame?.uuid !== uuid || interaction.user.id !== narratorId)
        return;

    const firstPlayer = currentGame.alivePlayers.find(
        (player) => player.id === interaction.values[0]
    );
    const secondPlayer = currentGame.alivePlayers.find(
        (player) => player.id === interaction.values[1]
    );
    if (!firstPlayer || !secondPlayer)
        return await errorReply(
            interaction,
            "I could not identify one of the selected players."
        );

    await currentGame.setMarriedCouple(firstPlayer, secondPlayer);
    await interaction.update({
        embeds: currentGame.narrationEmbeds,
        components: [],
    });

    const firstMember = await interaction.guild?.members.fetch(firstPlayer.id);
    const secondMember = await interaction.guild?.members.fetch(
        secondPlayer.id
    );
    await firstMember
        ?.send({
            embeds: [
                new EmbedBuilder({
                    title: "💘 Cupid's Arrow",
                    description: `You have been bound by love to ${secondPlayer.mention} (**${secondPlayer.originalNickname}**). Your souls will stay intertwined for the rest of the game.`,
                    thumbnail: { url: secondMember?.avatarURL() || "" },
                }).setColor("Fuchsia"),
            ],
        })
        .catch(async () => {
            await interaction.followUp({
                embeds: [
                    new WarnEmbed(
                        `${firstMember} (${firstMember.displayName}) did not receive a marry notification. Please inform them manually.`
                    ),
                ],
            });
        });
    await secondMember
        ?.send({
            embeds: [
                new EmbedBuilder({
                    title: "💘 Cupid's Arrow",
                    description: `You have been bound by love to ${firstPlayer.mention} (**${firstPlayer.originalNickname}**). Your souls will stay intertwined for the rest of the game.`,
                    thumbnail: { url: firstMember?.avatarURL() || "" },
                }).setColor("Fuchsia"),
            ],
        })
        .catch(async () => {
            await interaction.followUp({
                embeds: [
                    new WarnEmbed(
                        `${secondMember} (${secondMember.displayName}) did not receive a marry notification. Please inform them manually.`
                    ),
                ],
            });
        });
}

async function handleVoteMenu(interaction: StringSelectMenuInteraction) {
    const { currentGame } = getGuildConfig(interaction);
    const [, uuid] = interaction.customId.split("|");
    if (
        !currentGame ||
        currentGame.uuid !== uuid ||
        !currentGame.vote ||
        !currentGame.alivePlayers
            .map((player) => player.id)
            .includes(interaction.user.id) ||
        currentGame.vote.voters.includes(interaction.user.id)
    )
        return;

    const vote = currentGame.vote;
    const selectedValue = interaction.values[0];
    const [targetId] = selectedValue.split("|", 2);

    vote.votes[selectedValue]++;
    vote.voters.push(interaction.user.id);
    vote.log.push(
        `* ${interaction.user} voted against <@${targetId}> (${
            vote.votes[selectedValue]
        } vote${vote.votes[selectedValue] !== 1 ? "s" : ""})`
    );

    const nonVoters = currentGame.alivePlayers.filter(
        (player) => !vote.voters.includes(player.id)
    );

    const embed = interaction.message.embeds[0];
    await interaction.update({
        embeds: [
            new EmbedBuilder({
                ...embed.data,
                description: `Select the person you want to vote against from the menu below.\n${vote.log.join(
                    "\n"
                )}`,
                footer: {
                    text: `${nonVoters.length} player${
                        nonVoters.length !== 1 ? "s" : ""
                    } did not vote yet.`,
                },
            }),
        ],
    });
    if (nonVoters.length === 0) await currentGame.endVote({ interaction });
}

async function handleRoleInfo(interaction: StringSelectMenuInteraction) {
    const role = allRoles.find((role) => role.name === interaction.values[0])!;
    await interaction.update({ embeds: [role.infoEmbed] });
}

async function handleHistoryMenu(interaction: StringSelectMenuInteraction) {
    const [, userId] = interaction.customId.split("|");
    if (interaction.user.id !== userId) return;

    const {
        rows: [gameData],
    } = await pgClient.query("SELECT * FROM games WHERE uuid = $1", [
        interaction.values[0],
    ]);
    const players = (gameData.players as Array<any>).map(
        (playerFromJson: PlayerOptions & { role: RoleOptions }) =>
            new Player({
                ...playerFromJson,
                roleName: playerFromJson.role.name,
            })
    );
    const game = new Game({
        ...gameData,
        players,
    });
    await interaction.update({
        embeds: [game.narrationEmbeds[1]],
        components: [],
    });
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isStringSelectMenu()) return;

        const [type] = interaction.customId.split("|");
        switch (type) {
            case "marry":
                await handleMarryMenu(interaction);
                break;

            case "vote":
                await handleVoteMenu(interaction);
                break;

            case "roleMenu":
                await handleRoleInfo(interaction);
                break;

            case "history":
                await handleHistoryMenu(interaction);
                break;

            default:
                break;
        }
    },
};
