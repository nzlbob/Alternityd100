export class AttackRollDialogV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static PARTS = {
    form: {
      template: "systems/Alternityd100/templates/dialogs/attack-roll-dialog-v2.hbs",
    }
  };

  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      window: {
        title: "Attack Roll",
        contentClasses: ["Alternityd100", "dialog", "die-roll", "attack-roll-dialog-v2"],
        resizable: true
      },
      position: {
        width: 560,
        height: "auto"
      },
      actions: {
        roll: AttackRollDialogV2._onRoll,
        cancel: AttackRollDialogV2._onCancel
      }
    }, { inplace: false, overwrite: true });
  }

  /**
   * @param {object} options
   * @param {string} [options.title]
   * @param {string} [options.formula]
   * @param {object} [options.difficultySteps]
   * @param {string} [options.dstep]
   * @param {object} [options.rollModes]
   * @param {string} [options.rollMode]
   * @param {boolean} [options.isStarshipweapon]
   * @param {Array} [options.validgunner]
   * @param {object} [options.operatorOptions]
   * @param {string|number} [options.operator]
   * @param {object} [options.d100A]
   * @param {object} [options.skl]
   * @param {Array} [options.targetData]
   * @param {string|number} [options.movement]
   */
  constructor(options = {}) {
    super(options);
    this._resolve = null;
    this._result = null;

    this._title = options.title ?? "Attack Roll";
    this._formula = options.formula ?? "";

    this._difficultySteps = options.difficultySteps ?? {};
    this._dstep = String(options.dstep ?? "0");

    this._rollModes = options.rollModes ?? CONFIG.Dice.rollModes;
    this._rollMode = options.rollMode ?? game.settings.get("core", "rollMode");

    this._isStarshipweapon = !!options.isStarshipweapon;
    this._validgunner = options.validgunner ?? [];
    this._operatorOptions = options.operatorOptions ?? {};
    this._operator = String(options.operator ?? 0);

    this._d100A = options.d100A ?? CONFIG.d100A;
    this._skl = options.skl ?? null;

    this._targetData = options.targetData ?? [];

    // Movement default: first entry in config if present, else 0.
    const fallbackMovement = Object.keys(this._d100A?.movementType ?? {})[0] ?? 0;
    this._movement = String(options.movement ?? fallbackMovement);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext?.(options) ?? {};
    return foundry.utils.mergeObject(context, {
      formula: this._formula,
      difficultySteps: this._difficultySteps,
      dstep: this._dstep,
      rollModes: this._rollModes,
      rollMode: this._rollMode,

      isStarshipweapon: this._isStarshipweapon,
      validgunner: this._validgunner,
      operatorOptions: this._operatorOptions,
      operator: this._operator,

      d100A: this._d100A,
      skl: this._skl,
      targetData: this._targetData,
      movement: this._movement
    });
  }

  async _onRender(_context, _options) {
    await super._onRender?.(_context, _options);
    this.window.title = this._title;
  }

  _readForm() {
    const form = this.element instanceof HTMLFormElement ? this.element : this.element?.querySelector?.("form");
    const fd = form ? new FormData(form) : null;

    const dstep = fd ? String(fd.get("dstep") ?? this._dstep) : this._dstep;
    const rollMode = fd ? String(fd.get("rollMode") ?? this._rollMode) : this._rollMode;
    const movement = fd ? String(fd.get("movement") ?? this._movement) : this._movement;
    const operator = fd ? String(fd.get("operator") ?? this._operator) : this._operator;

    const targets = this._targetData.map((_t, index) => {
      const range = fd ? String(fd.get(`range${index}`) ?? "") : "";
      const resistance = fd ? String(fd.get(`resistance${index}`) ?? "") : "";
      const cover = fd ? String(fd.get(`cover${index}`) ?? "") : "";
      const dodge = fd ? String(fd.get(`dodge${index}`) ?? "") : "";
      return { range, resistance, cover, dodge };
    });

    return { dstep, rollMode, movement, operator, targets };
  }

  static async prompt(options = {}) {
    const app = new AttackRollDialogV2(options);
    return new Promise((resolve) => {
      app._resolve = resolve;
      app.render(true);
    });
  }

  static async _onRoll(event, _target) {
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
