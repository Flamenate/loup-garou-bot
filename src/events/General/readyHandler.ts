import { Events } from "discord.js";
import ExtendedClient from "../../models/ExtendedClient";
import pgClient from "../../utils/pgClient";
import GuildConfig, { GuildConfigOptions } from "../../models/GuildConfig";
import { RoleOptions } from "../../models/Role";
import Game, { GameOptions } from "../../models/Game";
import Player, { PlayerOptions } from "../../models/Player";

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client: ExtendedClient) {
        const { rows }: { rows: GuildConfigOptions[] } = await pgClient.query(
            "SELECT * FROM guild_configs"
        );
        for (const config of rows) {
            let currentGame;
            if (config.current_game) {
                const {
                    rows: [game],
                }: { rows: GameOptions[] } = await pgClient.query(
                    "SELECT * FROM games WHERE uuid = $1",
                    [config.current_game]
                );
                const players = (game.players as Array<any>).map(
                    (playerFromJson: PlayerOptions & { role: RoleOptions }) =>
                        new Player({
                            ...playerFromJson,
                            roleName: playerFromJson.role.name,
                        })
                );
                currentGame = new Game({
                    ...game,
                    players,
                });
            }
            client.guildConfigs[config.guild_id] = new GuildConfig({
                ...config,
                current_game: currentGame,
            });
        }

        console.log(`Logged in as ${client.user!.username}.`);
    },
};
