import { Client, ClientOptions, Collection } from "discord.js";
import GuildConfig from "./GuildConfig";

export default class ExtendedClient extends Client {
    commands: Collection<string, any> = new Collection<string, any>();
    guildConfigs: Record<string, GuildConfig> = {};
    spectatorNicknames: Record<string, Record<string, string>> = {};

    constructor(options: ClientOptions & { logPath: string }) {
        super(options);
    }
}
