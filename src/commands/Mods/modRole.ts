import {
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { errorReply, successReply } from "../../utils/replies";

export async function execute(
    interaction: ChatInputCommandInteraction,
    guildConfig: GuildConfig
) {
    const role = (
        interaction.options as CommandInteractionOptionResolver
    ).getRole("role", true);

    if (guildConfig.modRoleId === role.id)
        return await errorReply(
            interaction,
            `${role} is already the minimum moderation role.`
        );

    await guildConfig.updateModRoleId(role.id);

    await successReply(
        interaction,
        `Minimum moderation role has been set to ${role}.`
    );
}
