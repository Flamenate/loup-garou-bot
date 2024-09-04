import { Events, VoiceState } from "discord.js";
import getGuildConfig from "../../utils/getGuildConfig";
import changeMemberNickname from "../../utils/changeMemberNickname";

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState: VoiceState, newState: VoiceState) {
        if (oldState.channelId === newState.channelId || !newState.member)
            return;

        const guildConfig = getGuildConfig(newState);
        const game = guildConfig.currentGame;
        const gameVcId = game?.channelIds.vc;
        if (
            !game ||
            (newState.channelId !== gameVcId &&
                oldState.channelId !== gameVcId) ||
            newState.member.id === game.narratorId
        )
            return;

        const player = game.players.find(
            (player) => player.id === newState.member?.id
        );
        if (!player) {
            if (newState.channelId === gameVcId)
                await changeMemberNickname(
                    newState.member,
                    `.${newState.member.displayName}`
                );
            else if (
                oldState.channelId === gameVcId &&
                newState.member.nickname?.startsWith(".")
            )
                await changeMemberNickname(
                    newState.member,
                    newState.member.nickname.replace(/^\.+/, "")
                );
        } else if (
            newState.channelId === gameVcId &&
            newState.member.displayName !== player?.gameNickname
        )
            return await changeMemberNickname(
                newState.member,
                player.gameNickname
            );
        else if (oldState.channelId === gameVcId)
            return await changeMemberNickname(
                newState.member,
                player.originalNickname
            );
    },
};
