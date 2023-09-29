export default function (engine) {
    engine.closures.add("calculateCMD", (fact, context) => {
        const cmd = fact.actor.system.attributes.cmd;
        const kac = fact.actor.system.attributes.kac;
/*
        cmd.value = 8 + kac.value;
        cmd.tooltip.push(game.i18n.localize("SFRPG.CMDBaseTooltip"));
        cmd.tooltip.push(game.i18n.format("SFRPG.CMDKACModTooltip", { kac: kac.value.signedString() }));
*/
        return fact;
    });
}