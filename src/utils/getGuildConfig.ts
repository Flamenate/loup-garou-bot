import { Client, Guild } from "discord.js";
import ExtendedClient from "../models/ExtendedClient";

export default function getGuildConfig({
    client,
    guild,
    guildId,
}: {
    client: Client;
    guild?: Guild | null;
    guildId?: string | null;
}) {
    return (client as ExtendedClient).guildConfigs[guildId! ?? guild!.id];
}
