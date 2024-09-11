import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";

const data = new SlashCommandBuilder()
    .setName("settings")
    .setDescription("View this server's settings.");

module.exports = {
    modOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: interaction.guild!.name,
                        iconURL: interaction.guild!.iconURL() || "",
                    },
                    title: "Settings",
                    description:
                        "Anyone with the `Manage Server` permission or with a role higher than the minimum moderation role can use the `/set` command to change the settings below.",
                    fields: [
                        {
                            name: "Current Narrator",
                            value: guildConfig.narratorId
                                ? `<@${guildConfig.narratorId}>`
                                : "No one.",
                            inline: true,
                        },
                        {
                            name: "Minimum Moderation Role",
                            value: guildConfig.modRoleId
                                ? `<@&${guildConfig.modRoleId}>`
                                : "No role set.",
                            inline: true,
                        },
                        {
                            name: "Blacklisted Players",
                            value:
                                guildConfig.blacklistedIds.length !== 0
                                    ? guildConfig.blacklistedIds
                                          .map((id) => `<@${id}> (${id})`)
                                          .join("\n")
                                          .slice(0, 1024)
                                    : "No one.",
                            inline: false,
                        },
                    ],
                    thumbnail: {
                        url: interaction.client.user.avatarURL() || "",
                    },
                    timestamp: new Date(),
                }).setColor("White"),
            ],
        });
    },
};
