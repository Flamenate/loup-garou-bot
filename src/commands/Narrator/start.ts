import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    EmbedBuilder,
    TextChannel,
    ChannelType,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import Game from "../../models/Game";
import moment from "moment";
import { randomSelect, shuffleArray } from "../../utils/random";
import fuzzysort from "fuzzysort";
import Role, { allRoles } from "../../models/Role";
import Player from "../../models/Player";
import logger, { LogType } from "../../utils/Logger";
import { errorReply, SuccessEmbed } from "../../utils/replies";
import changeMemberNickname from "../../utils/changeMemberNickname";

const data = new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start the game.");

const timeoutDurationInSeconds = 30;

module.exports = {
    narratorOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        if (guildConfig.currentGame)
            return await errorReply(
                interaction,
                `There's already a game in progress in <#${guildConfig.currentGame.threadIds.game}>.`
            );

        const vcId = (interaction.member as GuildMember).voice.channelId;
        if (!vcId)
            return await errorReply(
                interaction,
                "You need to be in a voice chat to start a game."
            );

        if (guildConfig.lobby.waitingIds.length < Game.MinimumPlayerCount)
            return await errorReply(
                interaction,
                `You need at least ${Game.MinimumPlayerCount} players in the lobby to start a game.`
            );

        const playerCount = guildConfig.lobby.waitingIds.length;
        const initialReply = await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "New Game",
                    description: `Please reply with **${playerCount} roles** separated by newlines. Expires <t:${moment()
                        .add(timeoutDurationInSeconds, "seconds")
                        .unix()}:R>`,
                    fields: [
                        {
                            name: "Narrator",
                            value: `<@${guildConfig.narratorId}>`,
                            inline: true,
                        },
                        {
                            name: "Text Channel",
                            value: interaction.channel!.toString(),
                            inline: true,
                        },
                        {
                            name: "Voice Channel",
                            value: `<#${vcId}>`,
                            inline: true,
                        },
                        {
                            name: "Players",
                            value: guildConfig.lobby.waitingIds
                                .map((id) => `<@${id}>`)
                                .join(" "),
                        },
                    ],
                    thumbnail: {
                        url: interaction.client.user.avatarURL() || "",
                    },
                    timestamp: new Date(),
                }).setColor("White"),
            ],
            fetchReply: true,
        });

        const messageCollector = (
            interaction.channel as TextChannel
        ).createMessageCollector({
            filter: (msg) => msg.author.id === interaction.user.id,
            max: 1,
            time: timeoutDurationInSeconds * 1000,
        });
        let timedOut = true;
        messageCollector?.on("collect", async (msg) => {
            timedOut = false;

            await msg.delete();

            await (interaction.channel as TextChannel).sendTyping();
            const providedRoleNames = msg.content.split("\n");
            if (providedRoleNames.length !== playerCount)
                return await errorReply(
                    interaction,
                    `You did not specify **exactly** ${playerCount} roles.`
                );
            const shuffledRoles: Role[] = [];
            const campCounts = { Loups: 0, Village: 0, Loners: 0 };
            for (const roleName of shuffleArray(providedRoleNames)) {
                const closestRole = fuzzysort.go(roleName, allRoles, {
                    limit: 1,
                    threshold: 0.5,
                    key: "name",
                })[0];
                if (!closestRole)
                    return await errorReply(
                        interaction,
                        `I could not recognize this role: \`${roleName}\`.`
                    );
                shuffledRoles.push(closestRole.obj);
                campCounts[closestRole.obj.camp.name]++;
            }

            if (campCounts.Loups === 0 || campCounts.Village === 0)
                return await errorReply(
                    interaction,
                    "Please make sure you provide at least **one loup role** and **one village role**."
                );

            let narrationThread, gameThread, loupThread, lonerThread;
            try {
                narrationThread = await (
                    interaction.channel as TextChannel
                ).threads.create({
                    name: "Narration",
                    type: ChannelType.PrivateThread,
                    invitable: false,
                });

                gameThread = await (
                    interaction.channel as TextChannel
                ).threads.create({
                    name: "Tor7 Loup",
                    startMessage: initialReply,
                });

                loupThread = await (
                    interaction.channel as TextChannel
                ).threads.create({
                    name: "Les Loups",
                    type: ChannelType.PrivateThread,
                    invitable: false,
                });

                if (campCounts.Loners > 0)
                    lonerThread = await (
                        interaction.channel as TextChannel
                    ).threads.create({
                        name: "Loner Group",
                        type: ChannelType.PrivateThread,
                        invitable: false,
                    });
            } catch (error) {
                logger.write({
                    level: LogType.Warn,
                    interaction,
                    message: error as Error,
                });
                return await errorReply(
                    interaction,
                    "Something went wrong while trying to create game threads, please try again."
                );
            }

            const gamePlayerIds = shuffleArray(guildConfig.lobby.waitingIds);
            const gamePlayers: Player[] = [];
            const nonNotifiedPlayers: string[] = [];
            for (let i = 0; i < providedRoleNames.length; i++) {
                const role = shuffledRoles[i];
                const playerMember = await interaction.guild!.members.fetch(
                    gamePlayerIds[i]
                );
                gamePlayers[i] = new Player({
                    id: gamePlayerIds[i],
                    role,
                    originalNickname: playerMember.displayName,
                });
                playerMember
                    .send({
                        content: `The game has started in <#${vcId}>.`,
                        embeds: [role.infoEmbed],
                    })
                    .catch((error) => {
                        logger.write({
                            level: LogType.Warn,
                            interaction,
                            message: error,
                        });
                        nonNotifiedPlayers.push(
                            `* <@${playerMember.id}> (${playerMember.displayName}): **${role.name}**`
                        );
                    });
            }

            const game = await guildConfig.initGame({
                guild_id: interaction.guildId!,
                narrator_id: guildConfig.narratorId!,
                text_channel_id: interaction.channelId,
                vc_id: vcId,
                narrator_thread_id: narrationThread.id,
                game_thread_id: gameThread.id,
                loup_thread_id: loupThread.id,
                loner_thread_id: lonerThread ? lonerThread.id : null,
                players: gamePlayers,
                time_cycle: { day: 0, night: 1 },
            });

            const updateButtonActionRow = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        customId: `updateNarration|${game.uuid}`,
                        label: "Update Information",
                        style: ButtonStyle.Success,
                        emoji: "ℹ️",
                    }),
                ],
            });
            try {
                const narratorMessageComponents = game.aliveRoles
                    .map((role) => role.name)
                    .includes("Cupidon")
                    ? [
                          new ActionRowBuilder<StringSelectMenuBuilder>({
                              components: [
                                  new StringSelectMenuBuilder({
                                      customId: `marry|${game.uuid}`,
                                      minValues: 2,
                                      maxValues: 2,
                                      placeholder:
                                          "Select 2 people to marry...",
                                      options: game.players.map((player) => {
                                          return {
                                              label: player.originalNickname,
                                              value: player.id,
                                              emoji: player.role.camp.emoji,
                                          };
                                      }),
                                  }),
                              ],
                          }),
                          updateButtonActionRow,
                      ]
                    : [updateButtonActionRow];
                await narrationThread.send({
                    content: interaction.user.toString(),
                    embeds: [
                        ...(nonNotifiedPlayers.length > 0
                            ? [
                                  new EmbedBuilder({
                                      title: "🔕 Non-Notified Players",
                                      description: `These players have not received their roles because their DMs are disabled, please notify them yourself:\n${nonNotifiedPlayers.join(
                                          "\n"
                                      )}`,
                                  }).setColor("Gold"),
                              ]
                            : []),
                        ...game.narrationEmbeds,
                    ],
                    components: narratorMessageComponents,
                });

                await loupThread.send(
                    `${interaction.user} ${game.playersByCampName
                        .Loups!.map((player) => player.mention)
                        .join(" ")}`
                );

                if (lonerThread)
                    await lonerThread.send({
                        content: interaction.user.toString(),
                        embeds: [
                            new SuccessEmbed(
                                "You can use this thread for any loner related groups (pyromane victims, joueur de flute charmed, etc.).\nYou can also rename it as needed."
                            ),
                        ],
                    });

                await gameThread.send(
                    `<@${game.narratorId}> ` +
                        game.players.map((player) => player.mention).join(" ")
                );

                await initialReply.edit({
                    content: `Village chief: <@${
                        randomSelect(gamePlayers).id
                    }>`,
                    embeds: [game.infoEmbed],
                });

                await changeMemberNickname(
                    interaction.member as GuildMember,
                    "(Narrateur)"
                );
            } catch (error) {
                logger.write({
                    level: LogType.Warn,
                    interaction,
                    message: error as Error,
                });
            }
        });

        messageCollector?.on("end", async () => {
            if (!timedOut) return;
            await errorReply(
                interaction,
                "You took too long to provide the roles."
            );
        });
    },
};
