import pgClient from "../utils/pgClient";
import Game, { GameOptions } from "./Game";

type Lobby = {
    waitingIds: string[];
    isLocked: boolean;
};

export type GuildConfigOptions = {
    guild_id: string;
    narrator_id?: string;
    mod_role_id?: string;
    blacklisted_ids?: string[];
    lobby_ids?: string[];
    lobby_islocked?: boolean;
    current_game?: Game;
};

export default class GuildConfig {
    guildId: string;
    narratorId?: string;
    modRoleId?: string;
    blacklistedIds: string[];
    lobby: Lobby;
    currentGame?: Game;

    constructor(options: GuildConfigOptions) {
        this.guildId = options.guild_id;
        this.narratorId = options.narrator_id;
        this.modRoleId = options.mod_role_id;
        this.blacklistedIds = options.blacklisted_ids || [];
        this.lobby = {
            waitingIds: options.lobby_ids || [],
            isLocked: options.lobby_islocked || false,
        };
        this.currentGame = options.current_game;
    }

    public async updateNarratorId(newNarratorId: string) {
        await pgClient.query(
            "UPDATE guild_configs SET narrator_id = $2 WHERE guild_id = $1",
            [this.guildId, newNarratorId]
        );
        this.narratorId = newNarratorId;
    }

    public async updateModRoleId(newRoleId: string) {
        await pgClient.query(
            "UPDATE guild_configs SET mod_role_id = $2 WHERE guild_id = $1",
            [this.guildId, newRoleId]
        );
        this.modRoleId = newRoleId;
    }

    public async updateBlacklistedIds(newBlacklist: string[]) {
        await pgClient.query(
            "UPDATE guild_configs SET blacklisted_ids = $2 WHERE guild_id = $1",
            [this.guildId, newBlacklist]
        );
        this.blacklistedIds = newBlacklist;
    }

    public async lockLobby() {
        await pgClient.query(
            "UPDATE guild_configs SET lobby_islocked = TRUE WHERE guild_id = $1",
            [this.guildId]
        );
        this.lobby.isLocked = true;
    }

    public async unlockLobby() {
        await pgClient.query(
            "UPDATE guild_configs SET lobby_islocked = FALSE WHERE guild_id = $1",
            [this.guildId]
        );
        this.lobby.isLocked = false;
    }

    public async updateLobby(newLobbyIds: string[]) {
        await pgClient.query(
            "UPDATE guild_configs SET lobby_ids = $2 WHERE guild_id = $1",
            [this.guildId, newLobbyIds]
        );
        this.lobby.waitingIds = newLobbyIds;
    }

    public async initGame(gameOptions: Omit<GameOptions, "uuid">) {
        const uuid = crypto.randomUUID();
        await pgClient.query(
            `INSERT INTO games(uuid, guild_id, narrator_id, text_channel_id, vc_id, narrator_thread_id, game_thread_id, loup_thread_id, start_timestamp, players, time_cycle) VALUES ($1, ${gameOptions.guild_id}, ${gameOptions.narrator_id}, ${gameOptions.text_channel_id}, ${gameOptions.vc_id}, ${gameOptions.narrator_thread_id}, ${gameOptions.game_thread_id}, ${gameOptions.loup_thread_id}, $2, $3, $4)`,
            [uuid, new Date(), gameOptions.players, gameOptions.time_cycle]
        );
        await pgClient.query(
            "UPDATE guild_configs SET current_game = $2 WHERE guild_id = $1",
            [this.guildId, uuid]
        );
        this.currentGame = new Game({
            uuid,
            ...gameOptions,
        });
        return this.currentGame;
    }

    public async endGame(winners: string) {
        await this.currentGame!.terminate(winners);
        this.currentGame = undefined;
        this.lobby.waitingIds = [];
        await pgClient.query(
            "UPDATE guild_configs SET current_game = null, lobby_ids = $2 WHERE guild_id = $1",
            [this.guildId, this.lobby.waitingIds]
        );
    }

    public async getGameHistory() {
        return;
    }
}
