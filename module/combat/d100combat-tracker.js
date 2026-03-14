
// ui.combat combat.viewed

import { d100ACombatantConfig } from "./combatant-config.js";

export class d100CombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    window: {
      title: "Alternity Combat Tracker"
    },
    actions: {
      rollPhysire: d100CombatTracker.prototype._onD100CombatantControl,
      pilotThing: d100CombatTracker.prototype._onD100CombatantControl
    }
  });

  /** @override */
  static tabName = "combat";

  /** @override */
  static PARTS = {
    header: {
      template: "systems/Alternityd100/templates/sidebar/header.hbs"
    },
    tracker: {
      // template: "systems/Alternityd100/templates/sidebar/d100combat-tracker.html",
      template: "systems/Alternityd100/templates/sidebar/tracker.hbs",
      scrollable: [""]
    },
    footer: {
      template: "systems/Alternityd100/templates/sidebar/footer.hbs"
    }
  };

  _onD100CombatantControl(...args) {
    //    console.log("d100A_d100combat-tracker onCombatantControl",...args);
    const result = this._onCombatantControl(...args);
    console.log("Result", result);
    return result;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      // classes: ["Alternityd100", "sheet", "item"],
      id: "combat",
      template: "systems/Alternityd100/templates/sidebar/d100combat-tracker.html",
      title: "Alternity Combat Tracker",
      scrollY: [".directory-list"]
    });
  }


  /* -------------------------------------------- */

  /**
   * Prepare render context for the header then footer part.
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * partId - The id of the part being prepared ("combat-header" or "combat-footer")
   * @returns {Promise<void>}
   * @protected
   */

  async _prepareCombatContext(context, options) {
    const combat = this.viewed;
    const hasCombat = combat !== null;
    const combats = this.combats;
    const currentIdx = combats.indexOf(combat);
    const previousId = combats[currentIdx - 1]?.id;
    const nextId = combats[currentIdx + 1]?.id;
    const isPlayerTurn = combat?.combatant?.players?.includes(game.user);
    const canControl = combat?.turn && combat.turn.between(1, combat.turns.length - 2)
      ? combat.canUserModify(game.user, "update", { turn: 0 })
      : combat?.canUserModify(game.user, "update", { round: 0 });
    
    // New Stuff V13
    const combatName = await combat?.getCombatName();
    const phaseName = this.viewed?.getCurrentPhase().name
    const subPhaseName = this.viewed?.getCurrentSubPhase().name
    //    const hasDecimals = hasDecimals;
    const notBegun = (context.combat?.round === 0) && !context.combat?.turn;
    const endOfAction = ((!(context.combat?.round === 0)) && (context.combat?.turn === null))
    const inTurns = ((!(context.combat?.round === 0)) && (!(context.combat?.turn === null)))
    const vehicleCombat = (["vehicle", "starship"].includes(combat?.flags?.d100A?.combatType))


   // if ((context.round === 0) && !context.turn) context.notBegun = true
   // if ((!(context.round === 0)) && (context.turn === null)) context.endOfAction = true
   // if ((!(context.round === 0)) && (!(context.turn === null))) context.inTurns = true

   // console.log("prepareCombatContext", context, options, this,"endOfAction",context.round,context.turn,endOfAction,"notBegun",notBegun,"inTurns",inTurns)

    Object.assign(context, {
      combat, hasCombat, nextId, previousId,
      combats: combats.map(({ id }, i) => ({ id, label: i + 1, active: i === currentIdx })),
      control: isPlayerTurn && canControl,
      css: combats.length > 7 ? "cycle" : combats.length ? "tabbed" : "",
      currentIndex: currentIdx + 1,
      displayCycle: combats.length > 7,
      initiativeIcon: CONFIG.Combat.initiativeIcon,
      linked: combat?.scene !== null,
      labels: {
        scope: game.i18n.localize(`COMBAT.${combat?.scene ? "Linked" : "Unlinked"}`)
      },
      // new stuff
      combatName: combatName,
      phaseName: phaseName,
      subPhaseName: subPhaseName,
      notBegun: notBegun,
      endOfAction: endOfAction,
      inTurns: inTurns,
      vehicleCombat: vehicleCombat

    });
  }

  /* -------------------------------------------- */

  /**
   * Prepare render context for the tracker part.
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<void>}
   * @protected
   */
  async _prepareTrackerContext(context, options) {
    const combat = this.viewed;
    if (!combat) return;
    let hasDecimals = false;
    const turns = context.turns = [];
    for (const [i, combatant] of combat.turns.entries()) {
      if (!combatant.visible) continue;
      const turn = await this._prepareTurnContext(combat, combatant, i);
      if (turn.hasDecimals) hasDecimals = true;
      turns.push(turn);
    }
   
    // Format initiative numeric precision.
    const precision = CONFIG.Combat.initiative.decimals;
    turns.forEach(t => {
      if (Number.isFinite(t.initiative)) t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
    });
    context.hasDecimals = hasDecimals;
    context.endOfAction = false
    context.notBegun = false
    context.inTurns = false
    context.phaseName = this.viewed?.getCurrentPhase().name
    context.subPhaseName = this.viewed?.getCurrentSubPhase().name
    context.combatName = await combat.getCombatName()
    const piloting = ["vehicle", "starship"].includes(combat.flags.d100A.combatType) && (combat.flags.d100A.action == 0)
    context.canskip = (!["vehicle", "starship"].includes(combat.flags.d100A.combatType) || !piloting)
    if ((context.combat?.round === 0) && !context.combat?.turn) context.notBegun = true
    if ((!(context.combat?.round === 0)) && (context.combat?.turn === null)) context.endOfAction = true
    if ((!(context.combat?.round === 0)) && (!(context.combat?.turn === null))) context.inTurns = true
  //  console.log("prepareTrackerContext", context, options, this,"endOfAction",context.combat?.round,context.combat?.turn,context.endOfAction,"notBegun",context.notBegun,"inTurns",context.inTurns)


  }

  /* -------------------------------------------- */

  /**
   * Prepare render context for a single entry in the combat tracker.
   * @param {Combat} combat        The active combat.
   * @param {Combatant} combatant  The Combatant whose turn is being prepared.
   * @param {number} index         The index of this entry in the turn order.
   * @returns {Promise<object>}
   * @protected
   */
  async _prepareTurnContext(combat, combatant, index) {
    const { id, name, isOwner, isDefeated, hidden, initiative, permission } = combatant;
    const resource = permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resource : null;
    const hasDecimals = Number.isFinite(initiative) && !Number.isInteger(initiative);
    const turn = {
      hasDecimals, hidden, id, isDefeated, initiative, isOwner, name, resource,
      active: index === combat.turn,
      canPing: (combatant.sceneId === canvas.scene?.id) && game.user.hasPermission("PING_CANVAS"),
      img: await this._getCombatantThumbnail(combatant)
      

    };
    turn.css = [
      turn.active ? "active" : null,
      hidden ? "hide" : null,
      isDefeated ? "defeated" : null
    ].filterJoin(" ");
    const effects = [];
    for (const effect of combatant.actor?.temporaryEffects ?? []) {
      if (effect.statuses.has(CONFIG.specialStatusEffects.DEFEATED)) turn.isDefeated = true;
      else if (effect.img) effects.push({ img: effect.img, name: effect.name });
    }
    turn.effects = {
      icons: effects,
      tooltip: this._formatEffectsTooltip(effects)
    };

    if (["starship"].includes(combat?.flags?.d100A?.combatType)) {


     // console.log("currentCombatant", combatant)
      turn.crewmember = { "name": combatant.actor?.name || combatant.npcActor?.name }
      turn.canAct = combatant.canAct
      turn.actedThisPhase = combatant.flags?.d100A?.actions?.actedThisPhase
      const flagRoleRaw = combatant.flags?.d100A?.crewRole;
      const flagRole = flagRoleRaw != null ? String(flagRoleRaw).trim() : "";
      turn.crewRole = (flagRole ? flagRole : null) ?? combatant.crewRole
      turn.isPilot = false;
      turn.image = "";
      turn.actions = combatant.flags.d100A?.actions?.remaining
      turn.apr = combatant.apr
      const crewRoleNormalized = turn.crewRole != null ? String(turn.crewRole).toLowerCase() : "";
      if (["pilot", "copilot", "ordnance"].includes(crewRoleNormalized)) {
        turn.isPilot = true
        turn.image = "systems/Alternityd100/icons/roles/pilot.png"
      }

      //console.log( "currentTurn.crewmember.name", currentTurn.crewmember.name)

    }

    if (["normal"].includes(combat?.flags?.d100A?.combatType)) {


      //      console.log( "currentCombatant", currentCombatant)
      //currentTurn.crewmember = {"name" : currentCombatant.actor.name}
      turn.canAct = combatant.canAct
      turn.actions = combatant.flags?.d100A?.actions?.remaining
      turn.apr = combatant.apr
      turn.down = !(combatant.flags?.d100A?.downround == "-")
      turn.downround = combatant.flags?.d100A?.downround
      turn.actedThisPhase = combatant.flags?.d100A?.actions?.actedThisPhase
      // currentTurn.currentCombatant = currentCombatant
      if (combatant.token.actor.type == "vehicle") {
        turn.crewmember = { "name": combatant.actor?.name || combatant.npcActor?.name }
        turn.crewRole = combatant.flags?.d100A?.crewRole ?? combatant.crewRole
      }
      //currentTurn.crewRole = currentCombatant.flags.crewRole
      //currentTurn.isPilot = false;
      //currentTurn.image = "";
      //  if (["Pilot","Copilot"].includes(currentTurn.crewRole)){
      //    currentTurn.isPilot = true
      //    currentTurn.image = "systems/Alternityd100/icons/roles/pilot.png"
      //  }
      //console.log( "currentTurn.crewmember.name", currentTurn.crewmember.name)

    }





    return turn;
  }
  /* -------------------------------------------- */
  /*  Event Listeners & Handlers                  */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _attachFrameListeners() {
    super._attachFrameListeners();
    console.log("d100A_d100combat-tracker _attachFrameListeners", this)
    this.element.addEventListener("pointerover", this._onCombatantHoverIn.bind(this), { passive: true });
    this.element.addEventListener("pointerout", this._onCombatantHoverOut.bind(this), { passive: true });
    this.element.addEventListener("change", this._onChangeInput.bind(this), { passive: true });
    this.element.addEventListener("focusin", event => {
      if (event.target instanceof HTMLInputElement) event.target.select();
    }, { passive: true });
  }

  /** @inheritDoc */
  _onCombatantMouseDown(event, target) {
    const combat = this.viewed;
    if (!combat) return;

    const actionTarget = target?.closest("[data-action]") ?? target;
    const action = actionTarget?.dataset?.action;
    if (action && action !== "activateCombatant") {
      return this._onCombatantControl(event, actionTarget);
    }

    const listItem = target?.closest("[data-combatant-id]");
    const combatantId = listItem?.dataset?.combatantId;
    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;

    if (event.type === "dblclick" || event.detail === 2) {
      console.log("d100A_d100combat-tracker _onCombatantMouseDown double click", event, target, combatant)
      const actor = combatant.token?.actor;
      if (!actor?.testUserPermission(game.user, "OBSERVER")) return;
      if (actor.sheet?.render) actor.sheet.render(true);
      return;
    }

    // Single-click: pan to the combatant token. Do NOT change the active turn.
    const token = combatant.token?.object
      ?? canvas?.tokens?.get?.(combatant.tokenId)
      ?? canvas?.scene?.tokens?.get?.(combatant.tokenId)?.object;
    if (!token) return;
    if (combatant.sceneId !== canvas.scene?.id) return;

    // Respect token visibility/permissions (avoid leaking hidden positions).
    const actor = combatant.token?.actor;
    if (!actor?.testUserPermission(game.user, "OBSERVER")) return;

    canvas.animatePan({ x: token.center.x, y: token.center.y, duration: 250 });
  }

  /*
     
      
      //console.log("contect", context)
      context.endOfAction = false
      context.notBegun = false
      context.inTurns = false
      context.phaseName = this.viewed?.getCurrentPhase().name
      context.subPhaseName = this.viewed?.getCurrentSubPhase().name
      context.combatName = this.viewed?.getCombatName()
  
      if ((context.round === 0) && !context.turn) context.notBegun = true
      if ((!(context.round === 0)) && (context.turn === null)) context.endOfAction = true
      if ((!(context.round === 0)) && (!(context.turn === null))) context.inTurns = true
  
      console.log("context", context.combat ?? "no combat", context.combat)
  
      if (["starship"].includes(context.combat?.flags?.d100A?.combatType)) {
        for (let currentTurn of context.turns) {
          const currentCombatant = context.combat.combatants.get(currentTurn.id)
            console.log( "currentCombatant", currentCombatant)
          currentTurn.crewmember = { "name": currentCombatant.actor?.name || currentCombatant.npcActor?.name }
          currentTurn.canAct = currentCombatant.canAct
          currentTurn.actedThisPhase = currentCombatant.flags?.d100A?.actions?.actedThisPhase
          currentTurn.crewRole = currentCombatant.flags.crewRole
          currentTurn.isPilot = false;
          currentTurn.image = "";
          currentTurn.actions = currentCombatant.flags.d100A?.actions?.remaining
          currentTurn.apr = currentCombatant.apr
          if (["Pilot", "Copilot", "pilot", "copilot"].includes(currentTurn.crewRole)) {
            currentTurn.isPilot = true
            currentTurn.image = "systems/Alternityd100/icons/roles/pilot.png"
  
  
  
          }
          //console.log( "currentTurn.crewmember.name", currentTurn.crewmember.name)
        }
      }
  
      if (["normal"].includes(context.combat?.flags?.d100A?.combatType)) {
        for (let currentTurn of context.turns) {
          const currentCombatant = context.combat.combatants.get(currentTurn.id)
          //      console.log( "currentCombatant", currentCombatant)
          //currentTurn.crewmember = {"name" : currentCombatant.actor.name}
          currentTurn.canAct = currentCombatant.canAct
          currentTurn.actions = currentCombatant.flags?.d100A?.actions?.remaining
          currentTurn.apr = currentCombatant.apr
          currentTurn.down = !(currentCombatant.flags?.d100A?.downround == "-")
          currentTurn.downround = currentCombatant.flags?.d100A?.downround
          currentTurn.actedThisPhase = currentCombatant.flags?.d100A?.actions?.actedThisPhase
          // currentTurn.currentCombatant = currentCombatant
          if (currentCombatant.token.actor.type == "vehicle") {
            currentTurn.crewmember = { "name": currentCombatant.actor?.name || currentCombatant.npcActor?.name }
            currentTurn.crewRole = currentCombatant.flags?.crewRole
          }
          //currentTurn.crewRole = currentCombatant.flags.crewRole
          //currentTurn.isPilot = false;
          //currentTurn.image = "";
          //  if (["Pilot","Copilot"].includes(currentTurn.crewRole)){
          //    currentTurn.isPilot = true
          //    currentTurn.image = "systems/Alternityd100/icons/roles/pilot.png"
          //  }
          //console.log( "currentTurn.crewmember.name", currentTurn.crewmember.name)
        }
      }
      /* which turn state are we in? */
  // context.playerTurn = context.combat?.isPlayerTurn() ?? false;
  // context.playerStyle = context.playerTurn ? 'active-turn' : 'inactive-turn';
  // context.gmStyle = !context.playerTurn ? 'active-turn' : 'inactive-turn';

  /* add in the ended turn flag
   * and other combatant specific
   * info
   */
  //  context.turns = context.turns.reduce( (acc, turn) => {
  //   const combatant = context.combat.combatants.get(turn.id);

  /* super does not look at unlinked effects, do that here */
  //   turn.effects = new Set();
  //   if ( combatant.token ) {
  //     combatant.token.actor.effects.forEach(e => turn.effects.add(e));
  //    if ( combatant.token.overlayEffect ) turn.effects.add(combatant.token.overlayEffect);
  //   }

  //   turn.css = "";
  //   turn.ended = combatant?.turnEnded ?? true;
  //   turn.zeroHp = combatant.actor.system.health.value === 0 ? true : false;
  //   acc[combatant.actor.type].push(turn);

  //  return acc;
  // },{spark: [], npc: []});
  // console.log("\n---async getData() context---\n",context)
  // console.log("\nRound:",context.combat?.round," Phase:",context.combat?.flags.sfrpg?.phase,
  // "\nTurn:",context.combat?.turn," subPhase:",context.combat?.flags.sfrpg?.subPhase
  // )

  //    return context;
  //  }


  /* -------------------------------------------- */

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onClickAction(event, target) {
 


    if (!event.target.closest(".combat-control")) return;
    const combat = this.viewed;
    console.log("d100A_d100combat-tracker _onClickAction", event, target, combat, this)
    target.disabled = true;
    try { await combat[target.dataset.action]?.(); }
    finally { target.disabled = false; }
  }



  /* -------------------------------------------- */

  /**
   * Handle performing some action for an individual combatant.
   * @param {PointerEvent} event  The triggering event.
   * @param {HTMLElement} target  The action target element.
   * @protected
   */
  _onCombatantControl(event, target) {
    event.preventDefault();
    //    console.log("d100A_d100combat-tracker _onCombatantControl", event, target, this.actions);
    const { combatantId } = target.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);
    if (!combatant) return;
    console.log("Combatant", combatantId, combatant, target.dataset.action)
    switch (target.dataset.action) {
      case "pingCombatant": return this._onPingCombatant(combatant);
      case "panToCombatant": return this._onPanToCombatant(combatant);
      case "rollInitiative": return this._onRollInitiative(combatant);
      case "toggleDefeated": return this._onToggleDefeatedStatus(combatant);
      case "toggleHidden": return this._onToggleHidden(combatant);
      case "rollPhysire": return this._onRollPhysire(combatant);
    }
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    const tracker = html.find("#combat-tracker");
    const combatants = tracker.find(".combatant");
    console.log("Tracker", tracker)
    // Create new Combat encounter
    html.find(".combat-control-skip").click(ev => this._delayTurn(ev));

    html.find(".combat-control-update").click(ev => this._update(ev));

  }
  async _update(event) {
    const combat = this.viewed;
    const btn = event.currentTarget;
    const control = btn.dataset.control

    await combat.GMUpdate()
    //  console.log("Button",combat,btn,control)

  }


  async _delayTurn(event) {
    const combat = this.viewed;
    const btn = event.currentTarget;

    // console.log(btn.dataset.control)

    switch (btn.dataset.control) {

      case "delayTurn": await combat.nextTurn(true)
    }
  }


  async _onRollPhysire(combatant) {
    console.log("d100A_d100combat-tracker _onRollPhysire", combatant);
    const diceresults = await combatant.actor.rollSkill("physire");
    const rollData = diceresults.roll;
    let basedamage = -2;
    if (rollData.degree == "Good") basedamage -= 2;
    if (rollData.degree == "Amazing!") basedamage -= 4;
    rollData.defence = [{ armor: { img: "systems/Alternityd100/icons/conditions/physical_resolve_b.webp" }, damage: { stu: {value : basedamage, base : 0} , wou:  {value : 0, base : 0}, mor: {value : 0, base : 0} } }];
    const templateData = {
      actor: combatant.actor,
      tokenId: combatant.actor.token?.id,
      action: "Heals",
      rollData: rollData,
      toughnessMap: CONFIG.d100A?.toughness
    };
    const template = `systems/Alternityd100/templates/chat/item-defend-card.html`;
    const renderPromise = foundry.applications.handlebars.renderTemplate(template, templateData);
    renderPromise.then((html) => {
      const chatData = {
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: html,
        sound: true ? CONFIG.sounds.dice : null
      };
      ChatMessage.create(chatData, { displaySheet: false });
    });
    return true;
  }

  // console.log("Pinged",c)




  /**
   * Taken from 'CombatTracker._onCombatantControl
   * Handle a Combatant control toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async x_onCombatantControl(event) {
    console.log("d100A_d100combat-tracker _onCombatantControl", event)
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest(".combatant");
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);
    // console.log(btn)
    // Switch control action
    switch (btn.dataset.control) {

      // Toggle combatant visibility
      case "toggleHidden":
        // console.log("toggleHidden")
        await c.update({ hidden: !c.hidden });
        break



      // Toggle combatant defeated flag
      case "toggleDefeated":
        await this._onToggleDefeatedStatus(c);
        break
      // Roll combatant initiative
      case "rollInitiative":

        await combat.rollInitiative([c.id]);
        break
      // Actively ping the Combatant
      case "pingCombatant":
        return this._onPingCombatant(c);

      case "actedThisPhase":
        let actionRemaining = c.flags.d100A.actions.remaining
        c.flags.d100A.actions.actedThisPhase ? actionRemaining += 1 : actionRemaining -= 1
        const update = {
          "flags.d100A.actions.actedThisPhase": !c.flags.d100A.actions.actedThisPhase,
          "flags.d100A.actions.remaining": actionRemaining

        }
        c.update(update)
        return console.log("Here", c)

      case "rollPhysire":

        // console.log("Pinged",c)

        const diceresults = await c.actor.rollSkill("physire")
        // console.log(diceresults.roll)
        const rollData = diceresults.roll
        let basedamage = -2
        if (rollData.degree == "Good") basedamage -= 2
        if (rollData.degree == "Amazing!") basedamage -= 4
        rollData.defence = [{ armor: { img: "systems/Alternityd100/icons/conditions/physical_resolve.webp" }, damage: { stu: {value : basedamage, base : 0} , wou:  {value : 0, base : 0}, mor: {value : 0, base : 0} } }]
        const templateData = {
          actor: c.actor,
          //item: this,
          tokenId: c.actor.token?.id,
          action: "Heals",
          rollData: rollData,
          toughnessMap: CONFIG.d100A?.toughness

        };
        //console.log(rollData)
        const template = `systems/Alternityd100/templates/chat/item-defend-card.html`;
        const renderPromise = foundry.applications.handlebars.renderTemplate(template, templateData);
        renderPromise.then((html) => {
          // Create the chat message
          const chatData = {
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: html,
            sound: true ? CONFIG.sounds.dice : null,
          };

          ChatMessage.create(chatData, { displaySheet: false });
        });



        return true

      case "endTurn":
        /* only allow players to end their turn
         * if combat is running
         */
        if (combat.started) {
          await c.endTurn();
        } else {
          ui.notifications.error('Combat must begin before your turn can be ended.');
          return;
        }
        break
      case "resetTurn":
        if (combat.started) {
          await c.startTurn();
        } else {
          ui.notifications.error('Combat must begin before your turn can be reset.');
          return;
        }
        break
    }
    this.render(false)
    // console.log("Here")
  }




  /* -------------------------------------------- */

  /**
   * Handle pinging a combatant Token
   * @param {Combatant} combatant     The combatant data
   * @returns {Promise}
   * @protected
   */
  async _onPingCombatant(combatant) {
    //  console.log("d100A_onPingCombatant")
    if (!canvas.ready || (combatant.sceneId !== canvas.scene.id)) return;
    if (!combatant.token.object.visible) return ui.notifications.warn(game.i18n.localize("COMBAT.PingInvisibleToken"));
    await canvas.ping(combatant.token.object.center);
  }
  /* -------------------------------------------- */

  /** @inheritdoc */
  _contextMenu(html) {
    const ContextMenuImpl = foundry?.applications?.ux?.ContextMenu?.implementation;
    if (!ContextMenuImpl?.create) return;
    ContextMenuImpl.create(this, html, ".directory-item", this._getEntryContextOptions());
  }

  /* -------------------------------------------- */

  /**
   * Get the Combatant entry context options
   * @returns {object[]}   The Combatant entry context options
   * @private
   */
  _getEntryContextOptions() {
    const getCombatant = li => this.viewed.combatants.get(li.dataset.combatantId);
    return [{
      name: "COMBAT.CombatantUpdate",
      icon: '<i class="fa-solid fa-pen-to-square"></i>',
      condition: () => game.user.isGM,
      callback: li => this._onConfigureCombatant($(li))
    }, {
      name: "COMBAT.CombatantClear",
      icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
      condition: li => game.user.isGM && Number.isFinite(getCombatant(li)?.initiative),
      callback: li => getCombatant(li)?.update({ initiative: null })
    }, {
      name: "COMBAT.CombatantReroll",
      icon: '<i class="fa-solid fa-dice-d20"></i>',
      condition: () => game.user.isGM,
      callback: li => {
        const combatant = getCombatant(li);
        if (combatant) return this.viewed.rollInitiative([combatant.id]);
      }
    }, {
      name: "COMBAT.CombatantClearMovementHistory",
      icon: '<i class="fa-solid fa-shoe-prints"></i>',
      condition: li => game.user.isGM && (getCombatant(li)?.token?.movementHistory.length > 0),
      callback: async li => {
        const combatant = getCombatant(li);
        if (!combatant) return;
        await combatant.clearMovementHistory();
        ui.notifications.info("COMBAT.CombatantMovementHistoryCleared", { format: { name: combatant.token.name } });
      }
    }, {
      name: "COMBAT.CombatantRemove",
      icon: '<i class="fa-solid fa-trash"></i>',
      condition: () => game.user.isGM,
      callback: li => getCombatant(li)?.delete()
    }];
  }

  /**
   * Display a dialog which prompts the user to enter a new initiative value for a Combatant
   * @param {jQuery} li
   * @private
   */
  _onConfigureCombatant(li) {

    const combatant = this.viewed.combatants.get(li.data("combatant-id"));
    new d100ACombatantConfig({
      document: combatant,
      position: {
        top: Math.min(li[0].offsetTop, window.innerHeight - 350),
        left: window.innerWidth - 720
      },
      width: 400
    }).render(true);
  }



}

