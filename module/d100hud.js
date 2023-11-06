//import { EntitySheetHelper } from "./helper.js";
//import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {TokenHUD}
 */

 export class d100ATokenHUD extends TokenHUD {

  /**
   * Track whether the status effects control palette is currently expanded or hidden
   * @type {boolean}
   * @private
   */
 // _statusEffects = false;

  /* -------------------------------------------- */

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "token-hud",
      template: "systems/Alternityd100/templates/hud/token-hud.html"
    });
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
   
  refreshStatusIcons() {
    const effects = this.element.find(".status-effects")[0];
    const statuses = this._getStatusEffectChoices();
    for ( let img of effects.children ) {
      const status = statuses[img.getAttribute("src")] || {};
      img.classList.toggle("overlay", !!status.isOverlay);
      img.classList.toggle("active", !!status.isActive);
    }
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
    console.log(this.object.document)
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
      isSpaceActor:this.object.actor.system.isSpaceActor,
      speed:this.object.actor.system.attributes.speed?.value,
      accel:this.object.actor.system.attributes.accel?.value,
      lightAngle: this.object.light.data.rotation
    });
    data.statusEffects =this._getStatusEffectChoices(data);
    console.log("getData",data,"\nThis\n", this,"\noptions\n",options,"\nCONFIG\n",CONFIG,"\n\nCONFIG.statusEffects \n ",CONFIG.d100A.statusEffects,"\nactor\n",this.object.actor,"\neffects\n",this.object.actor.effects)
    return data;
  }


  /* -------------------------------------------- */

  /**
   * Get an array of icon paths which represent valid status effect choices
   * @private
   */

  _getStatusEffectChoices() {
    const token = this.object;

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

    console.log("\ntokenEffects\n",tokenEffects)
    return CONFIG.d100A.statusEffects.concat(tokenEffects).reduce((obj, e) => {
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
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
console.log("HERE--",html)
    super.activateListeners(html);
    console.log("Rotate",html)
    // Attribute Bars
    //kjhg
    html.find(".attribute input")
      .click(this._onAttributeClick)
      .keydown(this._onAttributeKeydown.bind(this))
      .focusout(this._onAttributeUpdate.bind(this))

    // Status Effects Controls
    this._toggleStatusEffects(this._statusEffects);
    html.find(".status-effects")
     // .on("click", ".effect-control", this._onToggleEffect.bind(this))
     // .on("contextmenu", ".effect-control", event => this._onToggleEffect(event, {overlay: true}));
    
     html.find(".lightAngle input")
     .click(this._onAttributeClick)
     .keydown(this._onAttributeKeydown.bind(this))
     .focusout(this._onLightAngleUpdate.bind(this))


     html.find("control-icon2")
     .click(this._onRotateClick)
     //.keydown(this._onAttributeKeydown.bind(this))
     //.focusout(this._onAttributeUpdate.bind(this))


  }
 async _onLightAngleUpdate(event) {
    event.preventDefault();
    if ( !this.object ) return;

    // Acquire string input
    const input = event.currentTarget;
    let strVal = input.value.trim();
    let isDelta = strVal.startsWith("+") || strVal.startsWith("-");
    if (strVal.startsWith("=")) strVal = strVal.slice(1);
    let value = Number(strVal);
console.log("event",event,"\n",strVal,this.object)

this.object.light.data.rotation = 90  
console.log("sdfsdf",this.object.light.data.rotation)
console.log("sdfsdf",this.object.light)

//await this.object.updateLightSource()

  }




  _onRotateClick(event) {
    const button = event.currentTarget;
    let newangle  = 0
    //console.log("Here-",button.dataset.action)
    switch ( button.dataset.action ) {
       case "rotateL":
        //console.log("Rotate Left", this.object.document.rotation)
        newangle  = (this.object.document.rotation + 300) % 360 ;
        break
        case "rotateR":{
          //console.log("Rotate Right", this.object.document.rotation)
          newangle  = (this.object.document.rotation + 60) % 360;
          break
        }
    }    
    this.object.document.update({rotation:newangle})
//console.log("Rotate", newangle, this.object.document.rotation)
  }
	/* -------------------------------------------- */

  /** @inheritdoc */
  _onClickControl(event) {
    
    super._onClickControl(event);
    
    if ( event.defaultPrevented ) return;
    const button = event.currentTarget;
    
    switch ( button.dataset.action ) {
       case "rotateL":
        return this._onRotateClick(event);
      case "rotateR":
        return this._onRotateClick(event);
     // case "config":
     //   return this._onTokenConfig(event);
     // case "combat":
     //   return this._onToggleCombat(event);
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
    if ( (event.code === "Enter") || (event.code === "NumpadEnter") ) event.currentTarget.blur();
  }

  /* -------------------------------------------- */

  /**
   * Handle attribute bar update
   * @private
   */
  _onAttributeUpdate(event) {
    event.preventDefault();
    if ( !this.object ) return;

    // Acquire string input
    const input = event.currentTarget;
    let strVal = input.value.trim();
    let isDelta = strVal.startsWith("+") || strVal.startsWith("-");
    if (strVal.startsWith("=")) strVal = strVal.slice(1);
    let value = Number(strVal);
//console.log(value)
    // For attribute bar values, update the associated Actor
    const bar = input.dataset.bar;
    const actor = this.object?.actor;
    
    // d100A shoehorn in speed box to Token.speed
    if (input.name == "speed"){
//console.log(this.object.document.speed)
      this.object.document.speed = this.object.document.speed || 0;
//console.log(this.object.document.speed);
      this.object.actor.update({["system.attributes.speed.value"]: isDelta ? current + value : value});
    }


    else if ( bar && actor ) {
      const attr = this.object.document.getBarAttribute(bar);
      if ( isDelta || (attr.attribute !== value) ) {
        actor.modifyTokenAttribute(attr.attribute, value, isDelta, attr.type === "bar");
      }
    }

    // Otherwise update the Token directly
    else {
      const current = foundry.utils.getProperty(this.object.document, input.name);
//console.log(value,input.name,input,current,actor,this.object.document)
//console.log(this.object.document.update({[input.name]: isDelta ? current + value : value}));
    }

    // Clear the HUD
    this.clear();
  }

  /* -------------------------------------------- */

  /**
   * Toggle Token combat state
   * @private
   */
  async _onToggleCombat(event) {
    event.preventDefault();
    await this.object.toggleCombat();
    console.log("combat",this)
    if(this.object)
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
  _onToggleEffect(event, {overlay=false}={}) {
    //console.debug
   // kghfjhgf
    console.log("_onToggleEffect",event)
    event.preventDefault();
    event.stopPropagation();
    let img = event.currentTarget;
    const effect = ( img.dataset.statusId && this.object.actor ) ?
    CONFIG.d100A.statusEffects.find(e => e.id === img.dataset.statusId) :
      img.getAttribute("src");
      
      let conditions = duplicate(this.object.actor.system.conditions)
      conditions[effect.id]=!conditions[effect.id]
      this.object.actor.update({'system.conditions': conditions})
      console.log("effect", effect,"\n\nsdf\n", this.object.actor.system.conditions[effect.id])
    return this.object.toggleEffect(effect, {overlay});
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
    token.setTarget(targeted, {releaseOthers: false});
    btn.classList.toggle("active", targeted);
  }
 }