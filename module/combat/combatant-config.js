/**
 * The Application responsible for configuring a single Combatant document within a parent Combat.
 * @extends {DocumentSheet}
 */
export class d100ACombatantConfig extends CombatantConfig {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "combatant-config",
        title: "Alternity Combatant Config", // game.i18n.localize("COMBAT.CombatantConfig"),
        classes: ["sheet", "combat-sheet"],
        template: "templates/sheets/combatant-config.html",
        width: 420
      });
    }
}