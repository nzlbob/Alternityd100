export class HitLocationAdjustDialogV2 extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static PARTS = {
    form: {
      template: "systems/Alternityd100/templates/dialogs/hit-location-adjust-dialog-v2.hbs",
    },
  };

  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(
      super.DEFAULT_OPTIONS,
      {
        tag: "form",
        window: {
          title: "Hit Location Adjustment",
          contentClasses: ["Alternityd100", "dialog", "hit-location-adjust-dialog-v2"],
          resizable: false,
        },
        position: {
          width: 420,
          height: "auto",
        },
        actions: {
          pick: HitLocationAdjustDialogV2._onPick,
          cancel: HitLocationAdjustDialogV2._onCancel,
        },
      },
      { inplace: false, overwrite: true }
    );
  }

  /**
   * @param {object} options
   * @param {string} [options.title]
   * @param {string} [options.content]
   * @param {number} [options.max]
   */
  constructor(options = {}) {
    super(options);
    this._resolve = null;
    this._result = null;

    this._title = options.title ?? game.i18n.localize("Hit Location Adjustment");
    this._content = options.content ?? game.i18n.localize("Adjustment to random compartment hit location");

    const max = Number(options.max ?? 0);
    this._max = Number.isFinite(max) && max > 0 ? max : 0;

    this._choices = Array.from({ length: this._max + 1 }, (_v, i) => i);
  }

  async _prepareContext(options) {
    const context = (await super._prepareContext?.(options)) ?? {};
    return foundry.utils.mergeObject(context, {
      title: this._title,
      content: this._content,
      choices: this._choices,
    });
  }

  async _onRender(_context, _options) {
    await super._onRender?.(_context, _options);
    this.window.title = this._title;
  }

  static async prompt(options = {}) {
    const app = new HitLocationAdjustDialogV2(options);
    return new Promise((resolve) => {
      app._resolve = resolve;
      app.render(true);
    });
  }

  static async _onPick(event, target) {
    event?.preventDefault?.();
    const value = Number(target?.dataset?.value ?? target?.value ?? 0);
    this._result = { cancelled: false, value: Number.isFinite(value) ? value : 0 };
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
