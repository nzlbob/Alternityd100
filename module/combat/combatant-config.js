
/**
 * The Application responsible for configuring a single Combatant document within a parent Combat.
 * @extends {DocumentSheet}
 */
export class d100ACombatantConfig extends foundry.applications.sheets.CombatantConfig {

  /** @override */
  static PARTS = {
    body: {
      root: true,
      template: "systems/Alternityd100/templates/sidebar/combatant-config.html" //"templates/sheets/combatant-config.hbs"
    }
  };

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
    const document = this.document;
    const key = document.collection?.has(document.id) ? "COMBAT.CombatantUpdateNamed" : "COMBAT.CombatantCreate";
    return game.i18n.format(key, {name: document.name});
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