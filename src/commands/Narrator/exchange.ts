import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    GuildMember,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import { errorReply, successReply } from "../../utils/replies";
import logger, { LogType } from "../../utils/Logger";
import changeMemberNickname from "../../utils/changeMemberNickname";

const data = new SlashCommandBuilder()
    .setName("exchange")
    .setDescription("Exchange a player with another during a game.")
    .addUserOption((opt) =>
        opt
            .setName("old_player")
            .setDescription("Player who will be replaced.")
            .setRequired(true)
    )
    .addUserOption((opt) =>
        opt
            .setName("new_player")
            .setDescription("Player who will replace the leaver.")
            .setRequired(true)
    );

module.exports = {
    narratorOnly: true,
    inGameOnly: true,
    data,
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const game = guildConfig.currentGame!;
        const oldPlayerUser = (
            interaction.options as CommandInteractionOptionResolver
        ).getUser("old_player", true);
        const newPlayerMember = (
            interaction.options as CommandInteractionOptionResolver
        ).getMember("new_player");

        if (!newPlayerMember || !(newPlayerMember instanceof GuildMember))
            return errorReply(interaction, "Something went wrong.");

        const newPlayer = await game.exchangePlayers(
            oldPlayerUser,
            newPlayerMember.user
        );

        try {
            await newPlayerMember.send({
                content: `You're replacing ${oldPlayerUser}.`,
                embeds: [newPlayer.role.infoEmbed],
            });
            await changeMemberNickname(
                newPlayerMember,
                newPlayer.originalNickname
            );
        } catch (error) {
            logger.write({
                level: LogType.Warn,
                interaction,
                message: error as Error,
            });
        }

        await successReply(
            interaction,
            `${oldPlayerUser} was exchanged with ${newPlayerMember} successfully.`
        );
    },
};
