import { Events, Guild } from "discord.js";
import pgClient from "../../utils/pgClient";
import ExtendedClient from "../../models/ExtendedClient";
import GuildConfig from "../../models/GuildConfig";

module.exports = {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        await pgClient.query(
            `INSERT INTO guild_configs(guild_id) VALUES ($1);`,
            [guild.id]
        );
        (guild.client as ExtendedClient).guildConfigs[guild.id] =
            new GuildConfig({
                guild_id: guild.id,
            });
    },
};
