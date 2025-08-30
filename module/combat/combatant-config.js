
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
      template: "systems/Alternityd100/templates/sidebar/combatant-config.html",
      width: 420
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.localize(this.object.id ? "COMBAT.CombatantUpdate" : "COMBAT.CombatantCreate");
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    if ( this.object.id ) return this.object.update(formData);
    else {
      const cls = getDocumentClass("Combatant");
      return cls.create(formData, {parent: game.combat});
    }
  }
}