export class RollDialogV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static PARTS = {
    form: {
      template: "systems/Alternityd100/templates/dialogs/roll-dialog-v2.hbs",
    }
  };

  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      window: {
        title: "Roll",
        contentClasses: ["Alternityd100", "dialog", "die-roll", "roll-dialog-v2"],
        resizable: false
      },
      position: {
        width: 360,
        height: "auto"
      },
      actions: {
        roll: RollDialogV2._onRoll,
        cancel: RollDialogV2._onCancel
      }
    }, { inplace: false, overwrite: true });
  }

  /**
   * @param {object} options
   * @param {string} [options.title]
   * @param {string} [options.stepflavor]
   * @param {string} [options.formula]
   * @param {object} [options.difficultySteps]
   * @param {string} [options.dstep]
   * @param {object} [options.rollModes]
   * @param {string} [options.rollMode]
   */
  constructor(options = {}) {
    super(options);
    this._resolve = null;
    this._result = null;

    this._title = options.title ?? "Roll";
    this._formula = options.formula ?? "";
    this._stepflavor = options.stepflavor ?? "";

    this._difficultySteps = options.difficultySteps ?? {};
    this._dstep = String(options.dstep ?? "0");

    this._rollModes = options.rollModes ?? CONFIG.Dice.rollModes;
    this._rollMode = options.rollMode ?? game.settings.get("core", "rollMode");
  }

  async _prepareContext(options) {
    const context = await super._prepareContext?.(options) ?? {};
    return foundry.utils.mergeObject(context, {
      stepflavor: this._stepflavor,
      formula: this._formula,
      difficultySteps: this._difficultySteps,
      dstep: this._dstep,
      rollModes: this._rollModes,
      rollMode: this._rollMode
    });
  }

  async _onRender(_context, _options) {
    await super._onRender?.(_context, _options);
    // Ensure the window title reflects the requested dialog title
    this.window.title = this._title;
  }

  _readForm() {
    const form = this.element instanceof HTMLFormElement ? this.element : this.element?.querySelector?.("form");
    const fd = form ? new FormData(form) : null;
    const dstep = fd ? String(fd.get("dstep") ?? this._dstep) : this._dstep;
    const rollMode = fd ? String(fd.get("rollMode") ?? this._rollMode) : this._rollMode;
    return { dstep, rollMode };
  }

  static async prompt(options = {}) {
    const app = new RollDialogV2(options);
    return new Promise((resolve) => {
      app._resolve = resolve;
      app.render(true);
    });
  }

  static async _onRoll(event, target) {
    event?.preventDefault?.();
    const result = this._readForm();
    this._result = { cancelled: false, ...result };
    this._resolve?.(this._result);
    return this.close();
  }

  static async _onCancel(event, target) {
    event?.preventDefault?.();
    this._result = { cancelled: true, dstep: this._dstep, rollMode: this._rollMode };
    this._resolve?.(this._result);
    return this.close();
  }

  async close(options = {}) {
    // If the user closes the window without clicking a button, treat as cancel.
    if (!this._result) {
      this._result = { cancelled: true, dstep: this._dstep, rollMode: this._rollMode };
      this._resolve?.(this._result);
    }
    return super.close(options);
  }
}
