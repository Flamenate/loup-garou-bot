import {
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    EmbedData,
} from "discord.js";

export class ErrorEmbed extends EmbedBuilder {
    constructor(desc: string, data?: EmbedData) {
        super({ ...data, description: desc });
        this.setColor("Red");
    }
}

export class SuccessEmbed extends EmbedBuilder {
    constructor(desc: string, data?: EmbedData) {
        super({ ...data, description: desc, timestamp: new Date() });
        this.setColor("Green");
    }
}

export class WarnEmbed extends EmbedBuilder {
    constructor(desc: string, data?: EmbedData) {
        super({ ...data, description: desc });
        this.setColor("Gold");
    }
}

export async function errorReply(
    interaction:
        | ChatInputCommandInteraction
        | ButtonInteraction
        | AnySelectMenuInteraction,
    msg: string,
    ephemeral: boolean = true,
    data?: EmbedData
) {
    if (interaction.replied)
        await interaction.editReply({
            embeds: [new ErrorEmbed(msg, data)],
        });
    else if (interaction.deferred)
        await interaction.followUp({
            embeds: [new ErrorEmbed(msg, data)],
        });
    else
        await interaction.reply({
            embeds: [new ErrorEmbed(msg, data)],
            ephemeral,
        });
}

export async function successReply(
    interaction:
        | ChatInputCommandInteraction
        | ButtonInteraction
        | AnySelectMenuInteraction,
    msg: string,
    ephemeral: boolean = false,
    data?: EmbedData
) {
    if (interaction.replied)
        await interaction.editReply({
            embeds: [new SuccessEmbed(msg, data)],
        });
    else if (interaction.deferred)
        await interaction.followUp({
            embeds: [new SuccessEmbed(msg, data)],
        });
    else
        await interaction.reply({
            embeds: [new SuccessEmbed(msg, data)],
            ephemeral,
        });
}

export async function warnReply(
    interaction:
        | ChatInputCommandInteraction
        | ButtonInteraction
        | AnySelectMenuInteraction,
    msg: string,
    ephemeral: boolean = false,
    data?: EmbedData
) {
    if (interaction.replied)
        await interaction.editReply({
            embeds: [new WarnEmbed(msg, data)],
        });
    else if (interaction.deferred)
        await interaction.followUp({
            embeds: [new WarnEmbed(msg, data)],
        });
    else
        await interaction.reply({
            embeds: [new WarnEmbed(msg, data)],
            ephemeral,
        });
}
