import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
} from "discord.js";
import * as narrator from "./narrator";
import * as mod_role from "./modRole";
import GuildConfig from "../../models/GuildConfig";

const data = new SlashCommandBuilder()
    .setName("set")
    .setDescription("Set a value in the server's config (mods only).")
    .addSubcommand((command) =>
        command
            .setName("narrator")
            .setDescription("Set the current narrator.")
            .addUserOption((opt) =>
                opt
                    .setName("new_narrator")
                    .setDescription("The new narrator.")
                    .setRequired(true)
            )
    )
    .addSubcommand((command) =>
        command
            .setName("mod_role")
            .setDescription("Set the minimum role for moderation commands.")
            .addRoleOption((opt) =>
                opt
                    .setName("role")
                    .setDescription("The moderation role.")
                    .setRequired(true)
            )
    );

const subcommands = {
    narrator,
    mod_role,
};

module.exports = {
    modOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const command = (
            interaction.options as CommandInteractionOptionResolver
        ).getSubcommand();
        await subcommands[command as "narrator" | "mod_role"].execute(
            interaction,
            guildConfig
        );
    },
};
