export class DefenceRollDialogV2 extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static PARTS = {
    form: {
      template: "systems/Alternityd100/templates/dialogs/defence-roll-dialog-v2.hbs",
    },
  };

  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(
      super.DEFAULT_OPTIONS,
      {
        tag: "form",
        window: {
          title: "Defence Roll",
          contentClasses: ["Alternityd100", "dialog", "die-roll", "defence-roll-dialog-v2"],
          resizable: true,
        },
        position: {
          width: 520,
          height: "auto",
        },
        actions: {
          defend: DefenceRollDialogV2._onDefend,
          cancel: DefenceRollDialogV2._onCancel,
        },
      },
      { inplace: false, overwrite: true }
    );
  }

  /**
   * @param {object} options
   * @param {string} [options.title]
   * @param {number|string} [options.damage]
   * @param {string|number} [options.type]
   * @param {string|number} [options.dmgtype]
   * @param {string|number} [options.firepower]
   * @param {object} [options.rollModes]
   * @param {string} [options.rollMode]
   * @param {object} [options.d100A]
   * @param {object} [options.defenceData]
   * @param {object} [options.tokenData]
   */
  constructor(options = {}) {
    super(options);
    this._resolve = null;
    this._result = null;

    this._title = options.title ?? "Defence Roll";

    this._damage = String(options.damage ?? "0");
    this._type = String(options.type ?? "stu");
    this._dmgtype = String(options.dmgtype ?? "stu");
    this._firepower = String(options.firepower ?? "O");

    this._rollModes = options.rollModes ?? CONFIG.Dice.rollModes;
    this._rollMode = options.rollMode ?? game.settings.get("core", "rollMode");

    this._d100A = options.d100A ?? CONFIG.d100A;
    this._defenceData = options.defenceData ?? {};
    this._tokenData = options.tokenData ?? null;
  }

  async _prepareContext(options) {
    const context = (await super._prepareContext?.(options)) ?? {};
    return foundry.utils.mergeObject(context, {
      damage: this._damage,
      type: this._type,
      dmgtype: this._dmgtype,
      firepower: this._firepower,

      rollModes: this._rollModes,
      rollMode: this._rollMode,

      d100A: this._d100A,
      defenceData: this._defenceData,
      tokenData: this._tokenData,
    });
  }

  async _onRender(_context, _options) {
    await super._onRender?.(_context, _options);
    this.window.title = this._title;
  }

  _readForm() {
    const form = this.element instanceof HTMLFormElement ? this.element : this.element?.querySelector?.("form");
    const fd = form ? new FormData(form) : null;

    const damage = fd ? String(fd.get("damage") ?? this._damage) : this._damage;
    const type = fd ? String(fd.get("type") ?? this._type) : this._type;
    const dmgtype = fd ? String(fd.get("dmgtype") ?? this._dmgtype) : this._dmgtype;
    const firepower = fd ? String(fd.get("firepower") ?? this._firepower) : this._firepower;
    const rollMode = fd ? String(fd.get("rollMode") ?? this._rollMode) : this._rollMode;

    return { damage, type, dmgtype, firepower, rollMode };
  }

  static async prompt(options = {}) {
    const app = new DefenceRollDialogV2(options);
    return new Promise((resolve) => {
      app._resolve = resolve;
      app.render(true);
    });
  }

  static async _onDefend(event, _target) {
    event?.preventDefault?.();
    const result = this._readForm();
    this._result = { cancelled: false, ...result };
    this._resolve?.(this._result);
    return this.close();
  }

  static async _onCancel(event, _target) {
    event?.preventDefault?.();
    this._result = { cancelled: true };
    this._resolve?.(this._result);
    return this.close();
  }

  async close(options = {}) {
    if (!this._result) {
      this._result = { cancelled: true };
      this._resolve?.(this._result);
    }
    return super.close(options);
  }
}
