import { REST, RESTPutAPIApplicationCommandsResult, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import * as dotenv from "dotenv";
dotenv.config();

const commands = [];
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command)
            commands.push(command.data.toJSON());
        else
            console.warn(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
    }
}

const rest = new REST().setToken(process.env.BOT_TOKEN!);

(async () => {
    try {
        console.log(
            `Started refreshing ${commands.length} application (/) commands.`
        );

        let data: RESTPutAPIApplicationCommandsResult;
        if (process.env.ENVIRONMENT === "PRODUCTION")
            data = (await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commands }
            )) as RESTPutAPIApplicationCommandsResult;
        else
            data = (await rest.put(
                Routes.applicationGuildCommands(
                    process.env.CLIENT_ID!,
                    process.env.MAIN_GUILD_ID!
                ),
                { body: commands }
            )) as RESTPutAPIApplicationCommandsResult;

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
        );
    } catch (error) {
        console.error(error);
    }
})();
