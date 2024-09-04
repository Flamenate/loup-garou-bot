import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import fuzzysort from "fuzzysort";
import { allRoles, camps, preparedRoleNames } from "../../models/Role";
import { errorReply } from "../../utils/replies";

const data = new SlashCommandBuilder()
    .setName("info")
    .setDescription(
        "Shows information about a specific role, or a menu of all roles."
    )
    .addStringOption((opt) =>
        opt
            .setName("role")
            .setDescription("Role to show information about.")
            .setAutocomplete(true)
    );

module.exports = {
    data,
    async autocomplete(interaction: AutocompleteInteraction) {
        const results = fuzzysort.go(
            interaction.options.getFocused(),
            preparedRoleNames,
            { limit: 10, threshold: 0.5 }
        );
        await interaction.respond(
            results.map((result) => {
                return { name: result.target, value: result.target };
            })
        );
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const roleName = (
            interaction.options as CommandInteractionOptionResolver
        ).getString("role");
        if (roleName) {
            const closestRoleNames = fuzzysort.go(roleName, allRoles, {
                limit: 1,
                threshold: 0.5,
                key: "name",
            });
            if (closestRoleNames.length === 0)
                return await errorReply(
                    interaction,
                    "❔ I could not find a role with that name."
                );

            const role = closestRoleNames[0].obj;
            return await interaction.reply({
                embeds: [role.infoEmbed],
            });
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "All Roles",
                    description:
                        "To start browsing roles, please select a **Camp** from the buttons below.",
                }).setColor("White"),
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>({
                    components: Object.values(camps).map(
                        (camp) =>
                            new ButtonBuilder({
                                customId: `roleMenu|${interaction.user.id}|${camp.name}`,
                                emoji: camp.emoji,
                                label: camp.name,
                                style: ButtonStyle.Secondary,
                            })
                    ),
                }),
            ],
        });
    },
};
