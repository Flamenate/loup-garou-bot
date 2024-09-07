import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import Game from "../../models/Game";

const data = new SlashCommandBuilder()
    .setName("narration")
    .setDescription("A brief tutorial on how to use the bot for narration.");

module.exports = {
    data,
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "🐺 Narration Tutorial",
                    description: `*Disclaimer: l bot ma y3awadhech el narrateur complétement, mais y3awnou.*\n## Lobby\n* Bech tchouf chkoun fel lobby: \`/lobby\`\n* Bech tsaker wala t7el el lobby: \`/lock\` | \`/unlock\`\n* Bech tkharej chkoun mel lobby: \`/unjoin @person\`\nUne fois fama 3alla9al ${Game.MinimumPlayerCount} 3bed fel lobby, tnajem tlanci el tor7 b command \`/start\`.\n## Game\n* Bech t3adi el wa9t mabin nhar w lil: \`/next\`\n * Kif tet3ada mel nhar lel lil, lbot ytala3lek popup yes2lek fiha chnowa sar fel lila li t3adet.\n* Bech to9tel chkoun: \`/kill @person\`\n * Idha ken t7eb lbot may9oulech 3la role ljoueur li met (khater fama servante mathalan), fama option fel command tkhalik tspecifi el bot chnowa y9oul (\`/kill @player esm role\`) \n* Bech t7ot el vote: \`/vote @person1 @person2 @person3...\`\n * Fama zeda option mta3 corbeau mawjouda fel command.\n * L vote youfa wa7dou kif ness kol tvoti, ama ken t7eb toufeh bekri fama bouton End Vote yatla3lek tnajem testa3mlou.\n* Ken fama chkoun lezmou yokhrej fi west el tor7 w bech tbadlou b chkoun, tnajem testa3mel command \`/exchange @person1 @person2\`.\n* Bech tkamel el tor7: \`/end\`\n### __Important Note__\nL'bot hedha yesta3mel el private threads barcha (narration, groupe loupet, etc.), donc:\n1. Make sure eli enti comme étant le narrateur 3andek permission \`Manage Threads\` bech tnajem tzid w tna9es l 3bed mel threads, sinon tnajem testa3mel command \`/add @player\` fi thread bech lbot yzidlek el joueur ghadi.\n1. Keep in mind eli li 3andou permission \`Manage Threads\` (modérateur par exemple) ynajem ychouf el threads lkol (including thread mta3 narration mte3ek).`,
                    footer: { text: "Bech ta3ref kifeh tal3ab l game: /rules" },
                }).setColor("White"),
            ],
        });
    },
};
