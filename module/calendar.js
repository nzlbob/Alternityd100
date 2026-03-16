const MODULE_ID = "Alternityd100";
const CURRENT_DATE_SETTING = "currentGameDate";
const CURRENT_ERA_SETTING = "currentGameDateEra";
const PLAYER_TAB_CONTROL_ID = "alternityd100-game-date";
const PLAYER_TAB_INPUT_ID = "alternityd100-game-date-input";

const DEFAULT_GAME_DATE = Object.freeze({
  year: 2510,
  month: 1,
  day: 1
});

const DEFAULT_ERA = "AD";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function normalizeGameDate(date = {}) {
  const yearValue = Number(date.year);
  const monthValue = Number(date.month);
  const dayValue = Number(date.day);

  const year = Number.isFinite(yearValue) ? Math.max(1, Math.round(yearValue)) : DEFAULT_GAME_DATE.year;
  const month = Number.isFinite(monthValue) ? clamp(Math.round(monthValue), 1, 12) : DEFAULT_GAME_DATE.month;
  const maxDay = getDaysInMonth(year, month);
  const day = Number.isFinite(dayValue) ? clamp(Math.round(dayValue), 1, maxDay) : DEFAULT_GAME_DATE.day;

  return { year, month, day };
}

function parseGameDateString(value) {
  if (typeof value !== "string") return { ...DEFAULT_GAME_DATE };

  const match = value.trim().match(/^(\d{1,6})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return { ...DEFAULT_GAME_DATE };

  return normalizeGameDate({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  });
}

function serializeGameDate(date) {
  const normalized = normalizeGameDate(date);
  return `${String(normalized.year).padStart(4, "0")}-${String(normalized.month).padStart(2, "0")}-${String(normalized.day).padStart(2, "0")}`;
}

function shiftGameDate(date, deltaDays) {
  const normalized = normalizeGameDate(date);
  const utcDate = new Date(Date.UTC(normalized.year, normalized.month - 1, normalized.day));
  utcDate.setUTCDate(utcDate.getUTCDate() + Number(deltaDays || 0));

  return normalizeGameDate({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate()
  });
}

function getCurrentGameDate() {
  return parseGameDateString(game.settings.get(MODULE_ID, CURRENT_DATE_SETTING));
}

function getCurrentGameEra() {
  const stored = game.settings.get(MODULE_ID, CURRENT_ERA_SETTING);
  const era = typeof stored === "string" ? stored.trim() : "";
  return era || DEFAULT_ERA;
}

function formatGameDate(date = getCurrentGameDate(), era = getCurrentGameEra()) {
  const normalized = normalizeGameDate(date);
  const formatted = `${String(normalized.day).padStart(2, "0")}/${String(normalized.month).padStart(2, "0")}/${normalized.year}`;
  return era ? `${formatted} ${era}` : formatted;
}

async function setCurrentGameDate(date, era = getCurrentGameEra()) {
  const normalized = normalizeGameDate(date);
  const cleanedEra = typeof era === "string" && era.trim() ? era.trim() : DEFAULT_ERA;

  await game.settings.set(MODULE_ID, CURRENT_DATE_SETTING, serializeGameDate(normalized));
  await game.settings.set(MODULE_ID, CURRENT_ERA_SETTING, cleanedEra);
  return { ...normalized, era: cleanedEra };
}

function updateExistingGameDateWidgets() {
  const isoValue = serializeGameDate(getCurrentGameDate());
  const canConfigure = game.user?.isGM ?? false;

  for (const widget of document.querySelectorAll(".alternityd100-game-date-widget")) {
    const input = widget.querySelector(".alternityd100-game-date-input");

    if (input) {
      input.value = isoValue;
      input.disabled = !canConfigure;
      if (canConfigure) input.removeAttribute("disabled");
      input.removeAttribute("data-tooltip");
      input.title = game.i18n.localize("d100A.Calendar.Open");
    }
  }
}

function syncGameDateWidgetWidth(container, widget) {
  if (!(container instanceof HTMLElement) || !(widget instanceof HTMLElement)) return;

  const width = Math.ceil(container.getBoundingClientRect().width);
  if (width > 0) widget.style.width = `${width}px`;
}

function renderPlayerListGameDate(html) {
  const root = html?.[0] ?? html?.element?.[0] ?? html ?? document;
  const container = root?.querySelector?.("#players-active") ?? document.getElementById("players-active");
  if (!(container instanceof HTMLElement)) return false;
  const host = container.parentElement ?? container;

  let widget = document.getElementById(PLAYER_TAB_CONTROL_ID);
  if (!widget) {
    widget = document.createElement("section");
    widget.id = PLAYER_TAB_CONTROL_ID;
    widget.className = "alternityd100-game-date-widget";
    widget.innerHTML = `
      <input id="${PLAYER_TAB_INPUT_ID}" type="date" class="alternityd100-game-date-input" name="Alternityd100.currentGameDate" autocomplete="off">
    `;

    const input = widget.querySelector(".alternityd100-game-date-input");
    input?.addEventListener("click", (event) => {
      const field = event.currentTarget;
      if (typeof field?.showPicker !== "function" || field.disabled) return;

      try {
        field.showPicker();
      } catch (_err) {
        // Ignore browsers/electron shells that reject programmatic picker opening.
      }
    });

    input?.addEventListener("change", async (event) => {
      if (!game.user?.isGM) return;

      const value = event.currentTarget?.value;
      if (!value) return;

      try {
        await setCurrentGameDate(parseGameDateString(value), getCurrentGameEra());
      } catch (err) {
        console.error("[Alternityd100] Failed to update currentGameDate", err);
      }
    });
  }

  if (widget.parentElement !== host || widget.previousElementSibling !== container) {
    container.insertAdjacentElement("afterend", widget);
  }

  syncGameDateWidgetWidth(container, widget);

  updateExistingGameDateWidgets();
  return true;
}

export class GameDateConfigApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static PARTS = {
    form: {
      template: "systems/Alternityd100/templates/dialogs/game-date-config.hbs"
    }
  };

  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      window: {
        title: "d100A.Calendar.Title",
        contentClasses: ["Alternityd100", "dialog", "game-date-config"],
        resizable: false
      },
      position: {
        width: 360,
        height: "auto"
      },
      actions: {
        previousDay: GameDateConfigApp._onShiftDay,
        nextDay: GameDateConfigApp._onShiftDay,
        save: GameDateConfigApp._onSave,
        cancel: GameDateConfigApp._onCancel
      }
    }, { inplace: false, overwrite: true });
  }

  constructor(options = {}) {
    super(options);
    this._workingDate = getCurrentGameDate();
    this._workingEra = getCurrentGameEra();
  }

  static show(options = {}) {
    const app = new GameDateConfigApp(options);
    app.render(true);
    return app;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext?.(options) ?? {};
    return foundry.utils.mergeObject(context, {
      canConfigure: game.user?.isGM ?? false,
      isoDate: serializeGameDate(this._workingDate),
      era: this._workingEra,
      formattedDate: formatGameDate(this._workingDate, this._workingEra)
    });
  }

  async _onRender(context, options) {
    await super._onRender?.(context, options);
    this.window.title = game.i18n.localize("d100A.Calendar.Title");
  }

  _readForm() {
    const form = this.element instanceof HTMLFormElement ? this.element : this.element?.querySelector?.("form");
    const formData = form ? new FormData(form) : null;

    const isoDate = formData ? String(formData.get("isoDate") ?? serializeGameDate(this._workingDate)) : serializeGameDate(this._workingDate);
    const nextDate = parseGameDateString(isoDate);

    const nextEraRaw = formData ? String(formData.get("era") ?? this._workingEra) : this._workingEra;
    const nextEra = nextEraRaw.trim() || DEFAULT_ERA;

    return { date: nextDate, era: nextEra };
  }

  static async _onShiftDay(event, target) {
    event?.preventDefault?.();
    const delta = Number(target?.dataset?.delta ?? 0);
    const { date, era } = this._readForm();
    this._workingDate = shiftGameDate(date, delta);
    this._workingEra = era;
    return this.render();
  }

  static async _onSave(event) {
    event?.preventDefault?.();
    if (!game.user?.isGM) return this.close();

    const { date, era } = this._readForm();
    await setCurrentGameDate(date, era);
    return this.close();
  }

  static async _onCancel(event) {
    event?.preventDefault?.();
    return this.close();
  }
}

export function registerGameDateSettings() {
  game.settings.registerMenu(MODULE_ID, "gameDateConfigMenu", {
    name: "SETTINGS.GameDateMenuName",
    label: "SETTINGS.GameDateMenuLabel",
    hint: "SETTINGS.GameDateMenuHint",
    icon: "fas fa-calendar-alt",
    type: GameDateConfigApp,
    restricted: true
  });

  game.settings.register(MODULE_ID, CURRENT_DATE_SETTING, {
    name: "Current Game Date",
    hint: "Internal Alternityd100 setting storing the current in-game date.",
    scope: "world",
    config: false,
    restricted: true,
    type: String,
    default: serializeGameDate(DEFAULT_GAME_DATE),
    onChange: () => updateExistingGameDateWidgets()
  });

  game.settings.register(MODULE_ID, CURRENT_ERA_SETTING, {
    name: "Current Game Date Era",
    hint: "Internal Alternityd100 setting storing the current in-game era label.",
    scope: "world",
    config: false,
    restricted: true,
    type: String,
    default: DEFAULT_ERA,
    onChange: () => updateExistingGameDateWidgets()
  });
}

export function initializeGameDateApi() {
  game.Alternityd100 = game.Alternityd100 ?? {};
  game.Alternityd100.calendar = {
    show: (options = {}) => GameDateConfigApp.show(options),
    getCurrentDate: () => ({ ...getCurrentGameDate(), era: getCurrentGameEra() }),
    getCurrentDateString: () => formatGameDate(),
    serialize: serializeGameDate,
    parse: parseGameDateString,
    format: formatGameDate,
    shift: shiftGameDate,
    setCurrentDate: setCurrentGameDate
  };
}

export function registerGameDateHooks() {
  Hooks.on("renderPlayerList", (_app, html) => renderPlayerListGameDate(html));
  Hooks.on("renderPlayers", (_app, html) => renderPlayerListGameDate(html));
  Hooks.once("ready", () => {
    const ensureControl = () => renderPlayerListGameDate(document);

    if (ensureControl()) {
      updateExistingGameDateWidgets();
      return;
    }

    let tries = 0;
    const retry = () => {
      tries += 1;
      if (ensureControl()) {
        updateExistingGameDateWidgets();
        return;
      }
      if (tries >= 10) return;
      setTimeout(retry, 200);
    };

    retry();
  });
}