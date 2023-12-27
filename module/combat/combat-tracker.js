
// ui.combat combat.viewed


export class d100ACombatTracker extends CombatTracker {
	static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
           // classes: ["Alternityd100", "sheet", "item"],
            id: "combat",
          template: "systems/Alternityd100/templates/sidebar/combat-tracker.html",
          title: "Alternity Combat Tracker",
          scrollY: [".directory-list"]
      });
    }

  async getData() {
    let context = await super.getData();

console.log("contect", context)
 
if  (["starship"].includes(context.combat?.flags?.sfrpg?.combatType)){
for(let currentTurn of context.turns){
    const currentCombatant = context.combat.combatants.get(currentTurn.id)
    //  console.log( "currentCombatant", currentCombatant)
    currentTurn.crewmember = {"name" : currentCombatant.actor?.name || currentCombatant.npcActor?.name}
    currentTurn.canAct = currentCombatant.flags.canAct
    currentTurn.crewRole = currentCombatant.flags.crewRole 
    currentTurn.isPilot = false;
    currentTurn.image = "";
    currentTurn.actions = currentCombatant.flags.actions

      if (["Pilot","Copilot","pilot","copilot"].includes(currentTurn.crewRole)){
        currentTurn.isPilot = true
        currentTurn.image = "systems/Alternityd100/icons/roles/pilot.png"
        


      }
//console.log( "currentTurn.crewmember.name", currentTurn.crewmember.name)
    }
}

if  (["normal"].includes(context.combat?.flags?.sfrpg?.combatType)){
  for(let currentTurn of context.turns){
      const currentCombatant = context.combat.combatants.get(currentTurn.id)
  //      console.log( "currentCombatant", currentCombatant)
      //currentTurn.crewmember = {"name" : currentCombatant.actor.name}
      currentTurn.canAct = currentCombatant.flags.canAct
      currentTurn.actions = currentCombatant.flags.actions

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
 console.log("Tracker", tracker)
    // Create new Combat encounter
    html.find(".combat-controlx").click(ev => this._delayTurnx(ev));


  }

  async _delayTurnx(event) {
    const combat = this.viewed;
    const btn = event.currentTarget;

    console.log(btn.dataset.control)

    switch (btn.dataset.control) {

      case "delayTurnx": await combat.delayTurn(btn.dataset.control)
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
//console.log(btn)
    // Switch control action
    switch (btn.dataset.control) {

        // Toggle combatant visibility
      case "toggleHidden":
        console.log("toggleHidden")
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
    console.log("Here")
  }



  
  /**
   * Handle mouse-down event on a combatant name in the tracker
   * @param {Event} event   The originating mousedown event
   * @return {Promise}      A Promise that resolves once the pan is complete
   * @private
   */
  async _onCombatantMouseDown(event) {
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

}


