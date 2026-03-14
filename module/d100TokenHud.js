//import { EntitySheetHelper } from "./helper.js";
//import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {TokenHUD}
 */

export class d100ATokenHUD extends foundry.applications.hud.TokenHUD {
  /** @override */

  static get DEFAULT_OPTIONS() {
    const parent = super.DEFAULT_OPTIONS;
    const parentActions = parent?.actions ?? {};
    return foundry.utils.mergeObject(parent, {
      actions: {
        ...parentActions,
        // Status effects
        effect: { handler: d100ATokenHUD._onToggled100Effect, buttons: [0, 2] },
        removeAll: d100ATokenHUD._onRemoveAllConditions,

        // System-specific
        d100combat: d100ATokenHUD._onToggled100ACombat,

        // Space movement
        rotateL: d100ATokenHUD._onRotateL,
        rotateR: d100ATokenHUD._onRotateR
      },
      form: {
        ...(parent?.form ?? {}),
        closeOnSubmit: false
      }
    }, { inplace: false, overwrite: true });
  }

  static PARTS = {
    hud: {
      //root: true,
      template: "systems/Alternityd100/templates/hud/token-hud.html"
    }
  };



  /* -------------------------------------------- */

  /**
   * Handle toggling a token status effect icon.
   * @this {TokenHUD}
   * @param {PointerEvent} event
   * @param {HTMLButtonElement} target
   * @returns {Promise<void>}
   */
  static async _onToggled100Effect(event, target) {
    console.log("onToggled100Effect", event, target, this.object)
    if (!this.actor) {
      ui.notifications.warn("HUD.WarningEffectNoActor", { localize: true });
      return;
    }
    const statusId = target.dataset.statusId;
    await this.actor.toggleStatusEffect(statusId, {
      active: !target.classList.contains("active"),
      overlay: event.button === 2
    });
  }


  /**
   * Track whether the status effects control palette is currently expanded or hidden
   * @type {boolean}
   * @private
   */
  // _statusEffects = false;

  /* -------------------------------------------- */

  /* -------------------------------------------- */

  /* -------------------------------------------- */

  /**
   * BB06/09/25
   * Toggle the combat state of all controlled Tokens.
   * @this {TokenHUD}
   * @param {PointerEvent} event
   * @param {HTMLButtonElement} target
   * @returns {Promise<void>}
   */
  static async _onToggled100ACombat(event, target) {
    console.log("onToggled100ACombat", event, target, this.object)
    const tokens = canvas.tokens.controlled.map(t => t.document);
    if (!this.object.controlled) tokens.push(this.document);
    try {
      if (this.document.inCombat) await TokenDocument.implementation.deleteCombatants(tokens);
      else await TokenDocument.implementation.createCombatants(tokens);
    } catch (err) {
      ui.notifications.warn(err.message);
    }
  }

  /* -------------------------------------------- */

  static async _onRotateL(event, target) {
    return this._onRotateStep(event, -1);
  }

  static async _onRotateR(event, target) {
    return this._onRotateStep(event, 1);
  }

  async _onRotateStep(event, direction) {
    event.preventDefault();
    const doc = this.document ?? this.object?.document;
    if (!doc) return;
    if (doc.lockRotation) return;

    const normalizeDegreesInt = (deg) => {
      const d = Number.isFinite(deg) ? deg : 0;
      const n = (typeof Math.normalizeDegrees === "function")
        ? Math.normalizeDegrees(d)
        : (foundry?.utils?.normalizeDegrees ? foundry.utils.normalizeDegrees(d) : ((d % 360) + 360) % 360);
      return Math.round(n);
    };

    const isHexagonal = canvas?.grid?.isHexagonal ?? canvas?.grid?.isHex ?? false;
    // Align to grid lines: hex facings are 60°, square facings are 90°.
    const step = isHexagonal ? 60 : 90;

    const current = normalizeDegreesInt(Number(doc.rotation ?? 0));
    const remainder = ((current % step) + step) % step;
    const next = remainder === 0
      ? normalizeDegreesInt(current + (direction * step))
      : normalizeDegreesInt(direction > 0 ? (current + (step - remainder)) : (current - remainder));
    await doc.update({ rotation: next });
    this.clear();
  }



  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @override */
  _getMovementActionChoices() {
    const actorType = this.object?.actor?.type;

    // Spacecraft don't need a movement option.
    if (["starship", "ordnance"].includes(actorType)) return [];

    const actions = CONFIG?.Token?.movement?.actions ?? {};
    const tokenDoc = this.document;
    const currentAction = tokenDoc?.movementAction ?? CONFIG?.Token?.movement?.defaultAction;

    const selectable = Object.entries(actions)
      .map(([id, cfg]) => ({ id, cfg }))
      .filter(({ cfg }) => {
        const canSelect = typeof cfg?.canSelect === "function" ? cfg.canSelect : (() => true);
        try {
          return !!canSelect(tokenDoc);
        } catch {
          return false;
        }
      })
      .sort((a, b) => Number(a.cfg?.order ?? 0) - Number(b.cfg?.order ?? 0))
      .map(({ id, cfg }) => {
        const rawLabel = cfg?.label ?? id;
        let label = (typeof rawLabel === "string")
          ? (game?.i18n?.localize?.(rawLabel) ?? rawLabel)
          : String(rawLabel);
        if (actorType === "vehicle" && id === "walk") {
          label = game?.i18n?.localize?.("Alternityd100.Movement.Drive") ?? "Drive";
        }
        return {
          id,
          label,
          icon: cfg?.icon,
          img: cfg?.img,
          cssClass: id === currentAction ? "active" : ""
        };
      });

    return selectable;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    console.log(context);
    context.isSpaceActor = this.object.actor.system.isSpaceActor;

    //const context = await super._prepareContext(options);
    const bar1 = this.document.getBarAttribute("bar1");
    const bar2 = this.document.getBarAttribute("bar2");
    const movementActions = this._getMovementActionChoices();
    const currentAction = this.document?.movementAction ?? CONFIG?.Token?.movement?.defaultAction;
    const movementActionsConfig = CONFIG?.Token?.movement?.actions?.[currentAction]
      ?? CONFIG?.Token?.movement?.actions?.[CONFIG?.Token?.movement?.defaultAction];

    return foundry.utils.mergeObject(context, {

      isSpaceActor: this.object.actor.system.isSpaceActor,
      d100ARotation: this.document?.d100ARotation ?? this.document?.rotation ?? 0,

      canConfigure: game.user.can("TOKEN_CONFIGURE"),
      canToggleCombat: ui.combat !== null,
      displayBar1: bar1 && (bar1.type !== "none"),
      bar1Data: bar1,
      displayBar2: bar2 && (bar2.type !== "none"),
      bar2Data: bar2,
      combatClass: this.object.inCombat ? "active" : "",
      targetClass: this.object.targeted.has(game.user) ? "active" : "",
      //  statusEffects: this._getStatusEffectChoices(),
      movementActions,
      movementActionsConfig,
      showMovementActions: (movementActions?.length ?? 0) > 0
    });



    return context;
  }

  /*
  /* -------------------------------------------- */

  /** @override */
  bind(object) {
    this._statusEffects = false;
    return super.bind(object);
  }


  /* -------------------------------------------- */


  // Refresh the currently active state of all status effect icons in the Token HUD selector.

  xxrefreshStatusIcons() {
    // const effects = this.element.find(".status-effects")[0];
    // const statuses = this._getStatusEffectChoices();
    // for ( let img of effects.children ) {
    //   const status = statuses[img.getAttribute("src")] || {};
    //  img.classList.toggle("overlay", !!status.isOverlay);
    //  img.classList.toggle("active", !!status.isActive);
    // }
  }

  /* -------------------------------------------- */
  //SEEMS FAULTY< NO HUD IS CREATED
  /** @override 
  setPosition(_position) {
    console.log("setPosition",this)
    const td = this.object;
    const ratio = canvas.dimensions.size / 100;
    const position = {
      width: td.width * 100,
      height: td.height * 100,
      left: td.x,
      top: td.y,
    };
    if ( ratio !== 1 ) position.transform = `scale(${ratio})`;
    this.element.css(position);
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    //console.log("getData")
    let data = super.getData(options);
    const bar1 = this.object.document.getBarAttribute("bar1");
    const bar2 = this.object.document.getBarAttribute("bar2");
    //console.log(this.object.document)
    //const bar3 = this.object.document.getBarAttribute("bar3");
    //const bar4 = this.object.document.getBarAttribute("bar4");
    /*
    bar1:{attribute: 'health'}
    object.document.bar1.attribute
    bar2:{attribute: 'power'}
    object.document.bar2.attribute
    */

    data = foundry.utils.mergeObject(data, {
      canConfigure: game.user.can("TOKEN_CONFIGURE"),
      canToggleCombat: ui.combat !== null,
      displayBar1: bar1 && (bar1.type !== "none"),
      bar1Data: bar1,
      displayBar2: bar2 && (bar2.type !== "none"),
      bar2Data: bar2,
      visibilityClass: data.hidden ? "active" : "",
      effectsClass: this._statusEffects ? "active" : "",
      combatClass: this.object.inCombat ? "active" : "",
      targetClass: this.object.targeted.has(game.user) ? "active" : "",
      isSpaceActor: this.object.actor.system.isSpaceActor,
      isVehicle: this.object.actor.type == "vehicle",
      speed: this.object.actor.system.attributes.speed?.value,
      accel: this.object.actor.system.attributes.accel?.value,
      d100ARotation: this.object?.document?.d100ARotation ?? this.object?.document?.rotation ?? 0,
      lightAngle: 0 //this.object.light.data.rotation
    });
    // data.statusEffects =this._getStatusEffectChoices(data);
    //  console.log("getData",data,"\nThis\n", this,"\noptions\n",options,"\nCONFIG\n",CONFIG,"\n\nCONFIG.statusEffects \n ",CONFIG.d100A.statusEffects,"\nactor\n",this.object.actor,"\neffects\n",this.object.actor.effects)
    return data;
  }


  /* -------------------------------------------- */

  /**
   * Get an array of icon paths which represent valid status effect choices
   * @private
   */

  _xxxgetStatusEffectChoices() {
    /*   const token = this.object;
   
       // Get statuses which are active for the token actor
       const actor = token.actor || null;
       const statuses = actor ? actor.effects.reduce((obj, e) => {
         const id = e.getFlag("core", "statusId");
         if ( id ) {
           obj[id] = {
             id: id,
             overlay: !!e.getFlag("core", "overlay")
           }
         }
         return obj;
       }, {}) : {};
   
       // Prepare the list of effects from the configured defaults and any additional effects present on the Token
   
       //token.document.effects is the filtered list of everything selected on the character sheet
       //const tokenEffects = foundry.utils.deepClone(token.document.effects) || [];
       const tokenEffects =[];
       if ( token.document.overlayEffect ) tokenEffects.push(token.document.overlayEffect);
   
     //  console.log("\ntokenEffects\n",tokenEffects)
      
      
      
   
       
       const A = CONFIG.d100A.statusEffects.concat(tokenEffects).reduce((obj, e) => {
       //  console.log("e",e)
         const src = e.icon ?? e;
         if ( src in obj ) return obj;
         const status = statuses[e.id] || {};
         const isActive = !!status.id || token.document.effects.includes(src);
         const isOverlay = !!status.overlay || token.document.overlayEffect === src;
         obj[src] = {
           id: e.id ?? "",
           title: e.label ? game.i18n.localize(e.label) : null,
           src,
           isActive,
           isOverlay,
           cssClass: [
             isActive ? "active" : null,
             isOverlay ? "overlay" : null
           ].filterJoin(" ")
         };
   
         //console.log(this,obj,actor.effects)
         return obj;
       }, {});
     //  console.log("\ntokenEffects\n",A)
       return A
   
       */
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Foundry v13 ApplicationV2 can provide either a jQuery wrapper or an HTMLElement.
    const root = html?.[0] ?? html;
    if (!root?.querySelectorAll) return;

    // Attribute Bars (includes speed + d100ARotation heading input)
    for (const input of root.querySelectorAll(".attribute input")) {
      input.addEventListener("click", this._onAttributeClick.bind(this));
      input.addEventListener("keydown", this._onAttributeKeydown.bind(this));
      input.addEventListener("focusout", this._onAttributeUpdate.bind(this));
    }

    // Light angle input (if present)
    for (const input of root.querySelectorAll(".lightAngle input")) {
      input.addEventListener("click", this._onAttributeClick.bind(this));
      input.addEventListener("keydown", this._onAttributeKeydown.bind(this));
      input.addEventListener("focusout", this._onLightAngleUpdate.bind(this));
    }
  }
  async _onLightAngleUpdate(event) {
    event.preventDefault();
    if (!this.object) return;

    // Acquire string input
    const input = event.currentTarget;
    let strVal = input.value.trim();
    let isDelta = strVal.startsWith("+") || strVal.startsWith("-");
    if (strVal.startsWith("=")) strVal = strVal.slice(1);
    let value = Number(strVal);
    //console.log("event",event,"\n",strVal,this.object)

    this.object.light.data.rotation = 90
    //console.log("sdfsdf",this.object.light.data.rotation)
    //console.log("sdfsdf",this.object.light)

    //await this.object.updateLightSource()

  }




  _onRotateClick(event) {
    const button = event.currentTarget;
    const action = button?.dataset?.action;
    const direction = action === "rotateL" ? -1 : (action === "rotateR" ? 1 : 0);
    if (!direction) return;
    return this._onRotateStep(event, direction);
  }
  /* -------------------------------------------- */

  /** @inheritdoc */
  _onClickControl(event) {

    console.log("_onClickControl", event)
    super._onClickControl(event);

    if (event.defaultPrevented) return;
    const button = event.currentTarget;

    switch (button.dataset.action) {
      case "rotateL":
        return this._onRotateStep(event, -1);
      case "rotateR":
        return this._onRotateStep(event, 1);
      // case "config":
      //   return this._onTokenConfig(event);
      case "d100combat":
        return this.onToggleCombat(event); // this changed in V12
      // case "target":
      //   return this._onToggleTarget(event);
      // case "effects":
      // return this._onToggleStatusEffects(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle initial click to focus an attribute update field
   * @private*/

  _onAttributeClick(event) {
    event.currentTarget.select();
  }

  /* -------------------------------------------- */

  /**
   * Force field handling on an Enter keypress even if the value of the field did not change.
   * This is important to suppose use cases with negative number values.
   * @param {KeyboardEvent} event     The originating keydown event
   * @private
   */
  _onAttributeKeydown(event) {
    if ((event.code === "Enter") || (event.code === "NumpadEnter")) event.currentTarget.blur();
  }

  /* -------------------------------------------- */

  /**
   * Handle attribute bar update
   * @private
   */
  _onAttributeUpdate(event) {
    event.preventDefault();
    if (!this.object) return;

    // Acquire string input
    const input = event.currentTarget;
    let strVal = input.value.trim();
    let isDelta = strVal.startsWith("+") || strVal.startsWith("-");
    if (strVal.startsWith("=")) strVal = strVal.slice(1);
    let value = Number(strVal);
    console.log(value)
    // For attribute bar values, update the associated Actor
    const bar = input.dataset.bar;
    const actor = this.object?.actor;
    console.log("this", event, this, actor)
    const normalizeDegrees = (deg) => {
      const d = Number.isFinite(deg) ? deg : 0;
      const n = (typeof Math.normalizeDegrees === "function")
        ? Math.normalizeDegrees(d)
        : ((d % 360) + 360) % 360;
      return Math.round(n);
    };

    // d100A shoehorn in speed box to Token.speed
    if (input.name == "speed") {
      //console.log(this.object.document.speed)
      //    this.object.document.speed = this.object.document.speed || 0;
      const current = actor.system.attributes.speed.value;
      console.log(this.object.document.speed, this.object.type);
      if (actor.type == "starship") this.object.actor.update({ ["system.attributes.speed.value"]: isDelta ? current + value : value });
      if (actor.type == "vehicle") this.object.actor.update({ ["system.attributes.speed.value"]: isDelta ? current + value : value });
    }

    // Heading field uses Alternity-facing rotation (0 = North) but persists Foundry rotation (0 = South).
    else if (input.name === "d100ARotation") {
      const current = Number(this.object.document.rotation ?? 0);
      const nextFoundry = isDelta
        ? normalizeDegrees(current + value)
        : normalizeDegrees(value - 180);
      console.log(this.object.document.update({ rotation: Math.round(nextFoundry) }));
    }


    else if (bar && actor) {
      const attr = this.object.document.getBarAttribute(bar);
      if (isDelta || (attr.attribute !== value)) {
        actor.modifyTokenAttribute(attr.attribute, value, isDelta, attr.type === "bar");
      }
    }

    // Otherwise update the Token directly
    else {
      const current = foundry.utils.getProperty(this.object.document, input.name);
      //console.log(value,input.name,input,current,actor,this.object.document)
      console.log(this.object.document.update({ [input.name]: isDelta ? current + value : value }));
    }

    // Clear the HUD
    this.clear();
  }

  /* -------------------------------------------- */
  //  this does nothing now, gone to createCombatants d100TokenDoc
  /**
   * Toggle Token combat state
   * @private
   */
  async onToggleCombat(event) {
    event.preventDefault();
    await this.object.toggleCombat();
    console.log("combat", this)
    if (this.object)
      await event.currentTarget.classList.toggle("active", this.object.inCombat);

  }



  /* -------------------------------------------- */

  /**
   * Handle Token configuration button click
   * @private
   */
  _onTokenConfig(event) {
    event.preventDefault();
    this.object.sheet.render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle left-click events to toggle the displayed state of the status effect selection palette
   * @param {MouseEvent }event
   * @private
   
  _onToggleStatusEffects(event) {
    event.preventDefault();
    this._toggleStatusEffects(!this._statusEffects);
  }

  /* -------------------------------------------- */

  /**
   * Assign css selectors for the active state of the status effects selection palette
   * @private
   
  _toggleStatusEffects(active) {
    this._statusEffects = active;
    const button = this.element.find('.control-icon[data-action="effects"]')[0];
    button.classList.toggle("active", active);
    const palette = button.querySelector(".status-effects");
    palette.classList.toggle("active", active);
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling a token status effect icon
   * @private
   */
  async _onToggleEffect(event, { overlay = false } = {}) {
    //console.debug
    // kghfjhgf
    console.log("_onToggleEffect", event)
    event.preventDefault();
    event.stopPropagation();
    let img = event.currentTarget;
    const effect = (img.dataset.statusId && this.object.actor) ?
      CONFIG.d100A.statusEffects.find(e => e.id === img.dataset.statusId) :
      img.getAttribute("src");

    let conditions = foundry.utils.duplicate(this.object.actor.system.conditions)
    conditions[effect.id] = !conditions[effect.id]

    await this.object.actor.setCondition(effect.id, conditions[effect.id])
    await this.object.actor.update({ 'system.conditions': conditions })
    // console.log("effect", effect,"\n\nsdf\n", this.object.actor.system.conditions[effect.id])
    // 
    await this.object.document.update()
    canvas.tokens.hud.refreshStatusIcons()
    return  //this.object.toggleEffect(effect, {overlay});
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling the target state for this Token
   * @private
  */
  _onToggleTarget(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const token = this.object;
    const targeted = !token.isTargeted;
    token.setTarget(targeted, { releaseOthers: false });
    btn.classList.toggle("active", targeted);
  }
}