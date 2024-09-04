import path from "node:path";
import fs from "node:fs";
import { GatewayIntentBits } from "discord.js";
import ExtendedClient from "./models/ExtendedClient";
import * as dotenv from "dotenv";
dotenv.config();

const client = new ExtendedClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    logPath: "./.log",
});

const commandsPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const categoryPath = path.join(commandsPath, folder);
    const commandFiles = fs
        .readdirSync(categoryPath)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(categoryPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command)
            client.commands.set(command.data.name, command);
    }
}

const eventsPath = path.join(__dirname, "events");
const eventFolders = fs.readdirSync(eventsPath);

for (const folder of eventFolders) {
    const categoryPath = path.join(eventsPath, folder);
    const eventFiles = fs
        .readdirSync(categoryPath)
        .filter((file) => file.endsWith(".js"));
    for (const file of eventFiles) {
        const filePath = path.join(categoryPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args: any[]) => event.execute(...args));
        } else {
            client.on(event.name, (...args: any[]) => event.execute(...args));
        }
    }
}

client.login(process.env.BOT_TOKEN);
