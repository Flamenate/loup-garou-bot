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
    const newNarrator = (
        interaction.options as CommandInteractionOptionResolver
    ).getUser("new_narrator", true);

    if (newNarrator.id === guildConfig.narratorId)
        return await errorReply(
            interaction,
            `${newNarrator} is already the narrator.`
        );

    const game = guildConfig.currentGame;

    if (
        game &&
        game.players.map((player) => player.id).includes(newNarrator.id)
    )
        return await errorReply(
            interaction,
            "You cannot change the narrator to a player in an ongoing game.\nPlease exchange them out of the game first."
        );

    await guildConfig.updateNarratorId(newNarrator.id);

    if (guildConfig.lobby.waitingIds.includes(newNarrator.id))
        await guildConfig.updateLobby(
            guildConfig.lobby.waitingIds.filter((id) => id !== newNarrator.id)
        );

    await successReply(
        interaction,
        `Narrator has been set to ${newNarrator}.\n${
            game
                ? "Please make sure to add them to all ongoing game threads by mentioning them or using `/add`."
                : ""
        }`
    );
}
