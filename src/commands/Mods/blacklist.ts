import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { errorReply } from "../../utils/replies";

const data = new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Blacklist someone from playing in this server.")
    .addUserOption((opt) =>
        opt.setName("user").setDescription("User to blacklist.")
    );

module.exports = {
    modOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const targetUser = (
            interaction.options as CommandInteractionOptionResolver
        ).getUser("user");

        if (!targetUser)
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: "⛔ Blacklist",
                        description:
                            guildConfig.blacklistedIds.length > 0
                                ? guildConfig.blacklistedIds
                                      .map((id) => `<@${id}>`)
                                      .join("\n")
                                : "No one is blacklisted.",
                        color: 0x00000f,
                    }),
                ],
            });

        if (guildConfig.blacklistedIds.includes(targetUser.id))
            return await errorReply(
                interaction,
                `${targetUser} is already blacklisted.`
            );

        const newBlacklist = guildConfig.blacklistedIds.concat(targetUser.id);
        await guildConfig.updateBlacklistedIds(newBlacklist);

        if (guildConfig.lobby.waitingIds.includes(targetUser.id))
            await guildConfig.updateLobby(
                guildConfig.lobby.waitingIds.filter(
                    (id) => id !== targetUser.id
                )
            );

        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "⛔ Blacklist",
                    description: `${targetUser} has been blacklisted from playing.`,
                    thumbnail: { url: targetUser.avatarURL() || "" },
                    color: 0x00000f,
                }),
            ],
        });
    },
};
