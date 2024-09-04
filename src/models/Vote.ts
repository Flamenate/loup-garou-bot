import { Message } from "discord.js";
import Game from "./Game";

export default class Vote {
    msg: Message;
    game: Game;
    votes: Record<string, number>;
    voters: string[];
    log: string[];

    constructor({
        msg,
        game,
        accusedIds,
    }: {
        msg: Message;
        game: Game;
        accusedIds: string[];
    }) {
        this.msg = msg;
        this.game = game;
        this.votes = Object.fromEntries(accusedIds.map((id) => [id, 0]));
        this.voters = [];
        this.log = [];
    }
}
