import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageMentions,
    CommandInteractionOptionResolver,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { errorReply } from "../../utils/replies";
import Vote from "../../models/Vote";
import Player from "../../models/Player";

const data = new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Initiate a village vote.")
    .addStringOption((opt) =>
        opt
            .setName("accused")
            .setDescription("Mention the accused players.")
            .setRequired(true)
    )
    .addMentionableOption((opt) =>
        opt
            .setName("corbeau")
            .setDescription(
                "Player who was affected by Corbeau's double votes."
            )
    );

function parseUserMentions(input: string) {
    const regex = new RegExp(MessageMentions.UsersPattern, "g");
    return {
        mentions: [...input.matchAll(regex)].map((arr) => arr[0]),
        ids: [...input.matchAll(regex)].map((arr) => arr[1]),
    };
}

module.exports = {
    narratorOnly: true,
    inGameOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const { ids } = parseUserMentions(
            (interaction.options as CommandInteractionOptionResolver).getString(
                "accused",
                true
            )
        );
        const game = guildConfig.currentGame!;
        const accusedPlayers = game.alivePlayers.filter((player) =>
            ids.includes(player.id)
        );
        if (accusedPlayers.length !== ids.length)
            return await errorReply(
                interaction,
                "Please only mention alive players."
            );

        const corbeauedUser = (
            interaction.options as CommandInteractionOptionResolver
        ).getUser("corbeau");
        let corbeauedPlayer: Player | undefined;
        if (corbeauedUser) {
            corbeauedPlayer = game.alivePlayers.find(
                (player) => player.id === corbeauedUser.id
            );
            if (!corbeauedPlayer)
                return await errorReply(
                    interaction,
                    "Please mention an alive player in the **Corbeau** option."
                );
        }

        const voteEmbed = new EmbedBuilder({
            title: "🐺 Time to Vote",
            description: `Select the person you want to vote against from the menu below.${
                corbeauedPlayer
                    ? `\n* **Corbeau** voted against ${corbeauedUser} (2 votes)`
                    : ""
            }`,
            footer: {
                text: `${game.alivePlayers.length} people haven't voted.`,
            },
        }).setColor("Aqua");
        const voteMsg = await interaction.reply({
            embeds: [voteEmbed],
            components: [
                new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            customId: `vote|${game.uuid}`,
                            minValues: 1,
                            maxValues: 1,
                            placeholder: "Vote against someone...",
                            options: accusedPlayers.map((player) => {
                                return {
                                    label: player.originalNickname,
                                    value: `${player.id}|${player.originalNickname}`,
                                    emoji: "🐺",
                                };
                            }),
                        }),
                    ],
                }),
                new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            customId: `endVote|${game.uuid}`,
                            label: "End Vote",
                            emoji: "⏳",
                            style: ButtonStyle.Danger,
                        }),
                    ],
                }),
            ],
            fetchReply: true,
        });

        const vote = new Vote({
            msg: voteMsg,
            game,
            accusedIds: accusedPlayers.map(
                (player) => `${player.id}|${player.originalNickname}`
            ),
        });
        if (corbeauedPlayer) {
            vote.votes[
                `${corbeauedPlayer.id}|${corbeauedPlayer.originalNickname}`
            ] = 2;
            vote.log.push(
                `* **Corbeau** voted against ${corbeauedUser} (2 votes)`
            );
        }
        game.vote = vote;
    },
};
