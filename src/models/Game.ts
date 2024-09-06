import {
    ButtonInteraction,
    EmbedBuilder,
    StringSelectMenuInteraction,
    User,
} from "discord.js";
import Player from "./Player";
import Role, { allRoles, CampNames } from "./Role";
import pgClient from "../utils/pgClient";
import Vote from "./Vote";
import moment from "moment";

export type GameOptions = {
    uuid: string;
    guild_id: string;
    narrator_id: string;
    text_channel_id: string;
    vc_id: string;
    narrator_thread_id: string;
    game_thread_id: string;
    loup_thread_id: string;
    loner_thread_id: string | null;
    start_timestamp?: Date;
    end_timestamp?: Date;
    players: Player[];
    time_cycle: TimeCycle;
    events?: string[];
    winners?: string;
};

type TimeCycle = {
    day: number;
    night: number;
};

export default class Game {
    static MinimumPlayerCount: number = 7;
    static MaximumPlayerCount: number = 25;

    uuid: string;
    guildId: string;
    narratorId: string;
    channelIds: { text: string; vc: string };
    threadIds: {
        narrator: string;
        game: string;
        loups: string;
        loner: string | null;
    };
    startTimestamp: Date;
    endTimestamp?: Date;
    players: Player[];
    timeCycle: TimeCycle;
    events: string[];
    winners?: string;
    vote: Vote | null = null;

    constructor(options: GameOptions) {
        this.uuid = options.uuid;
        this.guildId = options.guild_id;
        this.narratorId = options.narrator_id;
        this.channelIds = { text: options.text_channel_id, vc: options.vc_id };
        this.threadIds = {
            narrator: options.narrator_thread_id,
            game: options.game_thread_id,
            loups: options.loup_thread_id,
            loner: options.loner_thread_id,
        };
        this.startTimestamp = options.start_timestamp || new Date();
        this.endTimestamp = options.end_timestamp;
        this.players = options.players;
        this.timeCycle = options.time_cycle;
        this.events = options.events || [];
        this.winners = options.winners;
    }

    public get alivePlayers(): Player[] {
        return this.players.filter((player) => player.isAlive);
    }

    public get deadPlayers(): Player[] {
        return this.players.filter((player) => !player.isAlive);
    }

    public get aliveRoles(): Role[] {
        return this.alivePlayers.map((player) => player.role);
    }

    public get playersByCampName(): Partial<Record<CampNames, Player[]>> {
        return Object.groupBy(this.players, (player) => player.role.camp.name);
    }

    public get isDaytime(): boolean {
        return this.timeCycle.day === this.timeCycle.night;
    }

    public get infoEmbed(): EmbedBuilder {
        return new EmbedBuilder({
            title: this.isDaytime
                ? `Day ${this.timeCycle.day}`
                : `Night ${this.timeCycle.night}`,
            description: this.isDaytime
                ? `**This is what happened last night:\n**${this.events.at(-1)}`
                : "Don't tuck yourself in too tight...",
            fields: this.players.map((player) => {
                return {
                    name: player.originalNickname || "Unknown",
                    value: player.isAlive
                        ? "Alive."
                        : `Dead.\n-# ${player.role.name}`,
                    inline: true,
                };
            }),
            footer: { text: `${this.alivePlayers.length} players left.` },
        }).setColor(this.isDaytime ? "Blue" : "DarkBlue");
    }

    public get narrationEmbeds(): EmbedBuilder[] {
        const playersByCamp = Object.groupBy(
            this.players,
            (player) => `${player.role.camp.emoji} ${player.role.camp.name}`
        );
        const marriedCouple = this.players
            .filter((player) => player.soulmateId)
            .map((player) => player.mention);

        const expectedEvents = this.aliveRoles.reduce((events, role) => {
            if (role.eventQuestion) events.push(`* ${role.eventQuestion}`);
            return events;
        }, new Array<string>());
        const nightRolesByPriority = this.aliveRoles
            .reduce((priorityRoles, role) => {
                if (role.nightPriority && role.name !== "Loup Garou")
                    priorityRoles.push(role);
                return priorityRoles;
            }, new Array<Role>(allRoles.find((role) => role.name === "Loup Garou")!))
            .toSorted((a, b) => a.nightPriority! - b.nightPriority!);

        return [
            new EmbedBuilder({
                title: "📜 Narrator Tasks",
                fields: [
                    {
                        name: "Role Priority (Night)",
                        value: nightRolesByPriority
                            .map((role) => `1. ${role.name}`)
                            .join("\n"),
                        inline: true,
                    },
                    {
                        name: "Daily Events",
                        value:
                            expectedEvents.length > 0
                                ? expectedEvents.join("\n")
                                : "None.",
                        inline: true,
                    },
                ],
            }).setColor("White"),
            new EmbedBuilder({
                title: "🐺 Game",
                description: `Narrator: <@${
                    this.narratorId
                }>.\nMarried Couple: ${
                    marriedCouple.length === 0
                        ? "`None`."
                        : marriedCouple.join(" & ")
                }\n${
                    this.endTimestamp
                        ? `This game lasted **${moment
                              .duration(
                                  moment(this.endTimestamp).diff(
                                      this.startTimestamp
                                  )
                              )
                              .humanize()}**`
                        : `Game was started <t:${moment(
                              this.startTimestamp
                          ).unix()}:R>`
                }.`,
                fields: Object.entries(playersByCamp).map(
                    ([campName, campPlayers]) => {
                        return {
                            name: campName,
                            value: campPlayers!
                                .map(
                                    (player) =>
                                        `${player.mention}: ${player.role.name}`
                                )
                                .join("\n"),
                            inline: true,
                        };
                    }
                ),
                footer: { text: "Starting Time" },
                timestamp: this.startTimestamp,
            }).setColor("White"),
        ];
    }

    public async advanceToDay(lastNightEvents: string) {
        this.timeCycle.day++;
        this.events.push(lastNightEvents);
        await pgClient.query(
            "UPDATE games SET time_cycle = $2, events = $3 WHERE uuid = $1",
            [this.uuid, this.timeCycle, this.events]
        );
    }

    public async advanceToNight() {
        this.timeCycle.night++;
        await pgClient.query(
            "UPDATE games SET time_cycle = $2 WHERE uuid = $1",
            [this.uuid, this.timeCycle]
        );
    }

    public async killPlayer(player: Player, displayedRoleName?: string | null) {
        player.isAlive = false;
        if (displayedRoleName) {
            player.displayedRoleName = displayedRoleName;
        }
        await pgClient.query("UPDATE games SET players = $2 WHERE uuid = $1", [
            this.uuid,
            this.players,
        ]);
    }

    public async exchangePlayers(oldPlayerUser: User, newPlayerUser: User) {
        const oldPlayerIndex = this.players.findIndex(
            (player) => player.id === oldPlayerUser.id
        );
        const oldPlayer = this.players[oldPlayerIndex];
        this.players[oldPlayerIndex] = new Player({
            ...oldPlayer,
            id: newPlayerUser.id,
            role: allRoles.find((role) => role.name === oldPlayer.role.name),
        });
        await pgClient.query("UPDATE games SET players = $2 WHERE uuid = $1", [
            this.uuid,
            this.players,
        ]);
        return this.players[oldPlayerIndex];
    }

    public async setMarriedCouple(firstPlayer: Player, secondPlayer: Player) {
        firstPlayer.soulmateId = secondPlayer.id;
        secondPlayer.soulmateId = firstPlayer.id;
        await pgClient.query("UPDATE games SET players = $2 WHERE uuid = $1", [
            this.uuid,
            this.players,
        ]);
    }

    public async endVote({
        interaction,
    }: {
        interaction: ButtonInteraction | StringSelectMenuInteraction;
    }) {
        const results = Object.entries(this.vote!.votes).sort(
            ([, a], [, b]) => b - a
        );
        this.vote = null;

        const maxVotes = results[0][1];
        const highestVoted = results
            .filter(([, votes]) => votes === maxVotes)
            .map(([idAndName]) => `<@${idAndName.split("|", 2)[0]}>`);

        await interaction.message.edit({
            components: [],
        });

        const resultEmbed = new EmbedBuilder({
            title: "📝 Vote Results",
            description:
                highestVoted.length === 1
                    ? `${highestVoted[0]} has been voted out of the village.`
                    : `It's a tie between ${highestVoted
                          .slice(0, -1)
                          .join(", ")} and ${highestVoted.at(
                          -1
                      )}.\nThe village chief has to decide who dies.`,
            fields: results.map(([choice, voteCount]) => {
                return {
                    name: choice.split("|", 2)[1],
                    value: voteCount.toString(),
                    inline: true,
                };
            }),
        }).setColor("DarkOrange");
        if (interaction.replied)
            await interaction.followUp({
                embeds: [resultEmbed],
            });
        else await interaction.reply({ embeds: [resultEmbed] });
    }

    public async terminate(winners: string) {
        this.winners = winners;
        this.endTimestamp = new Date();
        await pgClient.query(
            "UPDATE games SET winners = $2, end_timestamp = $3 WHERE uuid = $1",
            [this.uuid, this.winners, this.endTimestamp]
        );
    }
}
