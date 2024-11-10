
// ui.combat combat.viewed

import { d100ACombatantConfig } from "./combatant-config.js";

export class d100BCombatTracker extends CombatTracker {
	static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
           // classes: ["Alternityd100", "sheet", "item"],
            id: "combat",
          template: "systems/Alternityd100/templates/sidebar/combat-trackerB.html",
          title: "Alternity Combat Tracker",
          scrollY: [".directory-list"]
      });
    }

  async getData() {
    let context = await super.getData();

//console.log("contect", context)
context.endOfAction = false
context.notBegun = false
context.inTurns = false

if ((context.round === 0) && !context.turn) context.notBegun = true
if ((!(context.round === 0)) && (context.turn === null)) context.endOfAction = true
if ((!(context.round === 0)) && (!(context.turn === null))) context.inTurns = true

if  (["starship"].includes(context.combat?.flags?.d100A?.combatType)){
for(let currentTurn of context.turns){
    const currentCombatant = context.combat.combatants.get(currentTurn.id)
    //  console.log( "currentCombatant", currentCombatant)
    currentTurn.crewmember = {"name" : currentCombatant.actor?.name || currentCombatant.npcActor?.name}
    currentTurn.canAct = currentCombatant.canAct 
    currentTurn.actedThisPhase = currentCombatant.flags?.d100A?.actions?.actedThisPhase
    currentTurn.crewRole = currentCombatant.flags.crewRole 
    currentTurn.isPilot = false;
    currentTurn.image = "";
    currentTurn.actions = currentCombatant.flags.d100A?.actions?.remaining
    currentTurn.apr = currentCombatant.apr
      if (["Pilot","Copilot","pilot","copilot"].includes(currentTurn.crewRole)){
        currentTurn.isPilot = true
        currentTurn.image = "systems/Alternityd100/icons/roles/pilot.png"
        


      }
//console.log( "currentTurn.crewmember.name", currentTurn.crewmember.name)
    }
}

if  (["normal"].includes(context.combat?.flags?.d100A?.combatType)){
  for(let currentTurn of context.turns){
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
      if (currentCombatant.token.actor.type == "vehicle"){
        currentTurn.crewmember = {"name" : currentCombatant.actor?.name || currentCombatant.npcActor?.name}
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
  
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    const tracker = html.find("#combat-tracker");
    const combatants = tracker.find(".combatant");
 //console.log("Tracker", tracker)
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

  /**
   * Taken from 'CombatTracker._onCombatantControl
   * Handle a Combatant control toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _onCombatantControl(event) {
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
        await c.update({hidden: !c.hidden});
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
        c.flags.d100A.actions.actedThisPhase?  actionRemaining+=1 :actionRemaining-=1
        const update = {
          "flags.d100A.actions.actedThisPhase": !c.flags.d100A.actions.actedThisPhase,
          "flags.d100A.actions.remaining": actionRemaining

        }
      c.update(update)
        return console.log("Here",c)

        case "rollPhysire":
         
        // console.log("Pinged",c)

        const diceresults = await c.actor.rollSkill("physire")
        // console.log(diceresults.roll)
        const rollData = diceresults.roll
        let basedamage = -2
        if (rollData.degree == "Good") basedamage -= 2
        if (rollData.degree == "Amazing!") basedamage -= 4
        rollData.defence = [{armor : {img:"systems/Alternityd100/icons/conditions/physical_resolve.webp"},damage:{stu:basedamage,wou:0,mor:0}}]
        const templateData = {
            actor: c.actor,
            //item: this,
            tokenId: c.actor.token?.id,
            action: "Heals",
            rollData: rollData

        };
        //console.log(rollData)
        const template = `systems/Alternityd100/templates/chat/item-defend-card.html`;
        const renderPromise = renderTemplate(template, templateData);
        renderPromise.then((html) => {
            // Create the chat message
            const chatData = {
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
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



  
  /**
   * Handle mouse-down event on a combatant name in the tracker
   * @param {Event} event   The originating mousedown event
   * @return {Promise}      A Promise that resolves once the pan is complete
   * @private
   */
  async x_onCombatantMouseDown(event) {
    event.preventDefault();

    const li = event.currentTarget;
    const combatant = this.viewed.combatants.get(li.dataset.combatantId);
    const token = combatant.token;
    if ( (token === null) || !combatant.actor?.testUserPermission(game.user, "OBSERVED") ) return;
    const now = Date.now();

    // Handle double-left click to open sheet
    const dt = now - this._clickTime;
    this._clickTime = now;
    if ( dt <= 250 ) return token?.actor?.sheet.render(true);

    // If the Token does not exist in this scene
    // TODO: This is a temporary workaround until we persist sceneId as part of the Combatant data model
    if ( token === undefined ) {
      return ui.notifications.warn(game.i18n.format("COMBAT.CombatantNotInScene", {name: combatant.name}));
    }
    
    // Control and pan to Token object or Roll Drop depending
    if ( combatant.category.dropNpc) {
      return this.viewed.handleRollDrop(combatant);
    } else if ( token.object ) {
      token.object?.control({releaseOthers: true});
      return canvas.animatePan({x: token.x, y: token.y});
    }
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
    if ( !canvas.ready || (combatant.sceneId !== canvas.scene.id) ) return;
    if ( !combatant.token.object.visible ) return ui.notifications.warn(game.i18n.localize("COMBAT.PingInvisibleToken"));
    await canvas.ping(combatant.token.object.center);
  }
/* -------------------------------------------- */

  /** @inheritdoc */
  _contextMenu(html) {
    ContextMenu.create(this, html, ".directory-item", this._getEntryContextOptions());
  }

  /* -------------------------------------------- */

  /**
   * Get the Combatant entry context options
   * @returns {object[]}   The Combatant entry context options
   * @private
   */
  _getEntryContextOptions() {
    return [
      {
        name: "COMBAT.CombatantUpdate",
        icon: '<i class="fas fa-edit"></i>',
        callback: this._onConfigureCombatant.bind(this)
      },
      {
        name: "COMBAT.CombatantClear",
        icon: '<i class="fas fa-undo"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          return Number.isNumeric(combatant?.initiative);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant.update({initiative: null});
        }
      },
      {
        name: "COMBAT.CombatantReroll",
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return this.viewed.rollInitiative([combatant.id]);
        }
      },
      {
        name: "COMBAT.CombatantRemove",
        icon: '<i class="fas fa-trash"></i>',
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant.delete();
        }
      }
    ];
  }

  /**
   * Display a dialog which prompts the user to enter a new initiative value for a Combatant
   * @param {jQuery} li
   * @private
   */
  _onConfigureCombatant(li) {
  
    const combatant = this.viewed.combatants.get(li.data("combatant-id"));
    new d100ACombatantConfig(combatant, {
      top: Math.min(li[0].offsetTop, window.innerHeight - 350),
      left: window.innerWidth - 720,
      width: 400
    }).render(true);
  }



}

