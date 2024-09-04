import {
    Events,
    GuildMemberRoleManager,
    Interaction,
    PermissionsBitField,
    TextChannel,
} from "discord.js";
import ExtendedClient from "../../models/ExtendedClient";
import logger, { LogType } from "../../utils/Logger";
import getGuildConfig from "../../utils/getGuildConfig";
import { errorReply } from "../../utils/replies";

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = (interaction.client as ExtendedClient).commands.get(
            interaction.commandName
        );

        if (!command)
            return console.error(
                `No command matching ${interaction.commandName} was found.`
            );

        const guildConfig = getGuildConfig(interaction);

        try {
            if (command.narratorOnly) {
                const me = await interaction.guild!.members.fetchMe();
                const myPerms = me.permissionsIn(
                    interaction.channel as TextChannel
                );
                if (
                    !myPerms.has([
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.CreatePrivateThreads,
                        PermissionsBitField.Flags.CreatePublicThreads,
                        PermissionsBitField.Flags.SendMessagesInThreads,
                        PermissionsBitField.Flags.ManageThreads,
                        PermissionsBitField.Flags.ManageNicknames,
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.UseExternalEmojis,
                    ])
                )
                    return await errorReply(
                        interaction,
                        "I'm missing some of my permissions.\nPlease make sure I have the following permissions **both in my role and in this channel** so I can function correctly:\n* View Channel\n* Read Message History\n* Send Messages\n* Embed Links\n* Attach Files\n* Use External Emojis\n* Create Private Threads\n* Create Public Threads\n* Manage Threads\n* Send Messages in Threads\n* Manage Nicknames"
                    );
            }

            const userIsMod =
                (interaction.member?.permissions as PermissionsBitField).has(
                    PermissionsBitField.Flags.ManageGuild
                ) ||
                (guildConfig.modRoleId &&
                    interaction.guild!.roles.comparePositions(
                        guildConfig.modRoleId,
                        (interaction.member!.roles as GuildMemberRoleManager)
                            .highest
                    ) <= 0);
            if (
                (command.narratorOnly &&
                    interaction.user.id !== guildConfig.narratorId &&
                    !userIsMod) ||
                (command.modOnly && !userIsMod)
            )
                return await errorReply(
                    interaction,
                    "You don't have the authority to execute this command!"
                );

            if (command.inGameOnly && !guildConfig.currentGame)
                return await errorReply(
                    interaction,
                    "You can only use that command while in game."
                );

            await command.execute(interaction, guildConfig);
        } catch (error) {
            logger.write({
                level: LogType.Error,
                interaction,
                message: error as Error,
            });
        }
    },
};
