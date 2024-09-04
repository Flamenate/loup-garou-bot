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
    );

async function killPlayer({
    interaction,
    game,
    player,
}: {
    interaction: ChatInputCommandInteraction;
    game: Game;
    player: Player;
}) {
    await game.killPlayer(player);

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
        ).getString("player");
        const targetPlayer = game.alivePlayers.find(
            (player) => player.originalNickname === playerName
        );
        if (!targetPlayer)
            return await errorReply(
                interaction,
                "Please choose a player name from the list."
            );

        await killPlayer({ interaction, game, player: targetPlayer });

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
                        targetPlayer.role.name
                    }**.${
                        soulmate
                            ? `\nThey were also married to ${soulmate.mention} (**${soulmate.role.name}**) who died from grief.`
                            : ""
                    }`,
                    thumbnail: { url: targetPlayer.role.imgUrl },
                    footer: {
                        iconURL: targetPlayer.role.camp.iconUrl,
                        text: targetPlayer.role.camp.name,
                    },
                }).setColor(targetPlayer.role.camp.color),
            ],
        });
    },
};
