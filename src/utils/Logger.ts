import fs from "fs";
import moment from "moment";

export enum LogType {
    Log = "[LOG]",
    Warn = "[WARN]",
    Error = "[ERROR]",
}

class Logger {
    private _filepath: string;
    private static _instance: Logger;

    private constructor(filepath: string) {
        fs.writeFile(filepath, "", (err) => {
            if (err) throw err;
            console.log("Logfile writable.");
        });
        this._filepath = filepath;
    }

    public static getInstance(filepath?: string) {
        if (this._instance) return this._instance;
        if (!filepath)
            throw new Error(
                "Please provide a filepath for the Logger instance."
            );
        this._instance = new this(filepath);
        return this._instance;
    }

    public write({
        level,
        interaction,
        message,
    }: {
        level: LogType;
        interaction: {
            commandName: string;
            user: { username: string };
        };
        message: string | Error;
    }) {
        const timestamp = moment().format("D/MM/YYYY, h:mm:ss A");
        const msg = typeof message === "string" ? message : message.stack;
        fs.appendFileSync(
            this._filepath,
            `${"-".repeat(25)}\n[${timestamp}] ${level} on /${
                interaction.commandName
            } by ${interaction.user.username}:\n${msg}\n\n`
        );
        if (level === LogType.Log) return;
        console.warn(
            `Logged ${level} in /${interaction.commandName} from ${interaction.user.username}.`
        );
    }
}

const logger = Logger.getInstance("./.log");

export default logger;
