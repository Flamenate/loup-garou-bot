import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";

const data = new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Explains the game rules to a newbie.");

module.exports = {
    data,
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: "🐺 Game Rules",
                    description:
                        "Loup Garou heya jeu sociale basée 3al déduction wel déception, temchi b système nhar w lil.\n## Teams\nEl game fiha **Narrateur**, w zouz équipet: **Les Villageois** w **Les Loups Garous**.\n* **Narrateur** mouch dekhel fel lo3ba, ya3ref kol chay 3al tor7 w mouhemtou ymachih (kima l'arbitre ma3neha).\n* **Les Loups** ya3rfou b3adhhom, w kol lila ynajmou yo9tlou chkoun. Bech yerb7ou tor7 lezem yo9tlou les villageois lkol.\n* **Les Villageois** ma ya3rfouch b3adhhom, kol we7ed ya3ref ken rou7ou, w fel nhar ysir débat w ba3d vote yo9tlou bih chkoun ychokou fih loup. Bech yerb7ou lezem yo9tlou les loups lkol.\nFama zeda 3bed yal3bou wa7adhom (selon rôle mte3hom) yetsammew **Loners**.\n## Roles\nKol joueur fel tor7 3andou role special fih pouvoir mou3ayna. Fama des pouvoirs passifs ma y9oumouch fel lil, w fama des pouvoirs actif y9oumou fel lil ya3mlou action mou3ayna. Par exemple:\n> El voyante pouvoir actif yal3ab m3a l village, kol lila 3andha l 7a9 bech tchouf role mta3 joueur mou3ayen. El narrateur fel sbe7 y9oul l voyante chefet el role hedheka.\n> El chasseur pouvoir passif yal3ab m3a l village, kif ymout ynajem yo9tel m3ah chkoun ekher.\nMa3andekch l7a9 t9oul role mte3ek lel 3bed lokhrin.\nL game fiha barcha rolet, ken makch fehem role tnajem testa3mel command `/info (esm el role)` bech ta3rfou chnowa ya3mel.\n## Bot Commands\nBech t9ayed rou7ek fel tor7 jey, tnajem testa3mel command `/join` w testanna narrateur ylanci tor7. Tnajem zeda tchouf chkoun yestanna m3ak b command `/lobby`.\nFi west l tor7, tnajem testa3mel command `/game` bech tchouf des informations 3al tor7 kima chkoun mazel 7ay wala chnowa sar kol lila.",
                    footer: {
                        text: "Bech ta3ref kifeh tnarri bel bot: /narration",
                    },
                }).setColor("White"),
            ],
        });
    },
};
