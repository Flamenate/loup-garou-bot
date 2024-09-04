import { Events, GuildMember } from "discord.js";
import getGuildConfig from "../../utils/getGuildConfig";
import changeMemberNickname from "../../utils/changeMemberNickname";

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember: GuildMember, newMember: GuildMember) {
        if (oldMember.nickname === newMember.nickname) return;

        const guildConfig = getGuildConfig(newMember);
        const game = guildConfig.currentGame;
        if (
            !game ||
            newMember.voice.channelId !== game.channelIds.vc ||
            newMember.id === game.narratorId
        )
            return;

        const player = game.players.find(
            (player) => player.id === newMember.id
        );
        if (!player) {
            if (newMember.displayName.startsWith(".")) return;
            return await changeMemberNickname(
                newMember,
                `.${newMember.displayName}`
            );
        }

        await changeMemberNickname(newMember, player.gameNickname);
    },
};
