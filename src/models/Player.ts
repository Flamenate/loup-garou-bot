import Role, { allRoles } from "./Role";

export type PlayerOptions = {
    id: string;
    role?: Role;
    roleName?: string;
    originalNickname: string;
    isAlive?: boolean;
};

export default class Player {
    id: string;
    role: Role;
    originalNickname: string;
    isAlive: boolean = false;
    soulmateId: string | null = null;

    constructor(options: PlayerOptions) {
        this.id = options.id;
        this.role =
            options.role ||
            allRoles.find((role) => role.name === options.roleName)!;
        this.originalNickname = options.originalNickname;
        this.isAlive = options.isAlive ?? true;
    }

    public get mention(): string {
        return `<@${this.id}>`;
    }

    public get gameNickname(): string {
        if (this.isAlive) return this.originalNickname;
        return `[Dead ${this.role.name}]`;
    }
}
