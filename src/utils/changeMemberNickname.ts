import { GuildMember } from "discord.js";
import logger, { LogType } from "./Logger";

export default async function changeMemberNickname(
    member: GuildMember,
    nickname: string | null
) {
    if (nickname) {
        nickname = nickname.slice(0, 32);
    }
    try {
        await member.setNickname(nickname);
    } catch (error) {
        logger.write({
            level: LogType.Warn,
            interaction: {
                commandName: "changeMemberNickname",
                user: { username: member.user.username },
            },
            message: error as Error,
        });
    }
}
