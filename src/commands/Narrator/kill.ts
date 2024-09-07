import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
} from "discord.js";
import GuildConfig from "../../models/GuildConfig";
import getGuildConfig from "../../utils/getGuildConfig";
import fuzzysort from "fuzzysort";
import { errorReply } from "../../utils/replies";
import Player from "../../models/Player";
import Game from "../../models/Game";
import changeMemberNickname from "../../utils/changeMemberNickname";

const data = new SlashCommandBuilder()
    .setName("kill")
    .setDescription("Kill a player.")
    .addStringOption((opt) =>
        opt
            .setName("player")
            .setDescription("Player to kill.")
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption((opt) =>
        opt
            .setName("displayed_role")
            .setDescription(
                "The role to display when the bot announces their death. Leave blank if you want their original role."
            )
    );

async function killPlayer({
    interaction,
    game,
    player,
    displayedRoleName,
}: {
    interaction: ChatInputCommandInteraction;
    game: Game;
    player: Player;
    displayedRoleName?: string | null;
}) {
    await game.killPlayer(player, displayedRoleName);

    const targetMember = await interaction.guild!.members.fetch(player.id);
    await changeMemberNickname(targetMember, player.gameNickname);
}

module.exports = {
    narratorOnly: true,
    inGame: true,
    data,
    async autocomplete(interaction: AutocompleteInteraction) {
        const { currentGame } = getGuildConfig(interaction);
        if (!currentGame) return;

        const searchResults = fuzzysort.go(
            interaction.options.getFocused(),
            currentGame.alivePlayers.map((player) => player.originalNickname),
            { all: true, threshold: 0.5, limit: 10 }
        );
        interaction.respond(
            searchResults.map((result) => {
                return { name: result.target, value: result.target };
            })
        );
    },
    async execute(
        interaction: ChatInputCommandInteraction,
        guildConfig: GuildConfig
    ) {
        const game = guildConfig.currentGame!;
        const playerName = (
            interaction.options as CommandInteractionOptionResolver
        ).getString("player", true);
        const targetPlayer = game.alivePlayers.find(
            (player) => player.originalNickname === playerName
        );
        if (!targetPlayer)
            return await errorReply(
                interaction,
                "Please choose a player name from the list."
            );

        const displayedRoleName = (
            interaction.options as CommandInteractionOptionResolver
        ).getString("displayed_role");

        await killPlayer({
            interaction,
            game,
            player: targetPlayer,
            displayedRoleName,
        });

        let soulmate: Player | undefined;
        if (targetPlayer.soulmateId) {
            soulmate = game.alivePlayers.find(
                (player) => player.id === targetPlayer.soulmateId
            );
            if (soulmate)
                await killPlayer({ interaction, game, player: soulmate });
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "🪦 R.I.P",
                    description: `**${
                        targetPlayer.mention
                    }** met their demise... They were **${
                        displayedRoleName || targetPlayer.role.name
                    }**.${
                        soulmate
                            ? `\nThey were also married to ${soulmate.mention} (**${soulmate.role.name}**) who died from grief.`
                            : ""
                    }`,
                    thumbnail: {
                        url: displayedRoleName ? "" : targetPlayer.role.imgUrl,
                    },
                    footer: displayedRoleName
                        ? { text: "?" }
                        : {
                              iconURL: targetPlayer.role.camp.iconUrl,
                              text: targetPlayer.role.camp.name,
                          },
                }).setColor(targetPlayer.role.camp.color),
            ],
        });
    },
};
