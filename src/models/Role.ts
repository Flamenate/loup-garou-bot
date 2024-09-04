import { ColorResolvable, EmbedBuilder } from "discord.js";
import fuzzysort from "fuzzysort";
import fs from "node:fs";

export type CampNames = "Loups" | "Village" | "Loners";

type CampOptions = {
    name: CampNames;
    iconUrl: string;
    emoji: string;
    color: ColorResolvable;
};

class Camp {
    name: CampNames;
    iconUrl: string;
    emoji: string;
    color: ColorResolvable;

    constructor(options: CampOptions) {
        this.name = options.name;
        this.iconUrl = options.iconUrl;
        this.emoji = options.emoji;
        this.color = options.color;
    }
}

export const camps = {
    Loups: new Camp({
        name: "Loups",
        iconUrl: "https://i.servimg.com/u/f55/18/31/96/00/carte210.png",
        emoji: "🐺",
        color: "DarkRed",
    }),
    Village: new Camp({
        name: "Village",
        iconUrl:
            "https://images-ext-1.discordapp.net/external/J3vFp535CX6c5Blt2KiRDkKQliGOLNPIppl_xWTZMKI/https/i.servimg.com/u/f55/18/31/96/00/carte110.png",
        emoji: "🛖",
        color: "Gold",
    }),
    Loners: new Camp({
        name: "Loners",
        iconUrl:
            "https://static.wikia.nocookie.net/loupgaroumal/images/5/53/Carte19.png/revision/latest?cb=20240616072024&path-prefix=fr",
        emoji: "👽",
        color: 0x0000f,
    }),
};

export type RoleOptions = {
    name: string;
    aliases: string[];
    imgUrl: string;
    description: string;
    camp: "Loups" | "Village" | "Loners";
    eventQuestion?: string;
    nightPriority: number;
};

export default class Role {
    name: string;
    aliases: string[];
    imgUrl: string;
    description: string;
    camp: Camp;
    eventQuestion?: string;
    nightPriority?: number;

    constructor(options: RoleOptions) {
        this.name = options.name;
        this.aliases = options.aliases;
        this.imgUrl = options.imgUrl;
        this.description = options.description;
        this.camp = camps[options.camp];
        this.eventQuestion = options.eventQuestion;
        this.nightPriority = options.nightPriority;
    }

    public get infoEmbed(): EmbedBuilder {
        return new EmbedBuilder({
            title: this.name,
            description: this.description,
            thumbnail: { url: this.imgUrl },
            footer: { iconURL: this.camp.iconUrl, text: this.camp.name },
        }).setColor(this.camp.color);
    }
}

const rawRoles: Record<string, RoleOptions> = JSON.parse(
    fs.readFileSync("./src/roles.json").toString()
);

export const allRoles = Object.entries(rawRoles).map(
    ([roleName, roleData]) =>
        new Role({
            name: roleName,
            aliases: roleData.aliases,
            camp: roleData.camp,
            description: roleData.description,
            imgUrl: roleData.imgUrl,
            eventQuestion: roleData.eventQuestion,
            nightPriority: roleData.nightPriority,
        })
);

export const preparedRoleNames = allRoles.map((role) =>
    fuzzysort.prepare(role.name)
);
