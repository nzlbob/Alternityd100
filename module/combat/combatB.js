import { Diced100 } from "../dice.js";
import RollContext from "../rolls/rollcontext.js";
import { d100ACombatantConfig } from "./combatant-config.js";
/*
The following hooks were added:
"onBeginCombat", one argument, type object, contains all event data
"onBeforeUpdateCombat", one argument, type object, contains all event data
"onAfterUpdateCombat", one argument, type object, contains all event data
"onBeforeCombatEnd": one argument, combat object right before it is deleted

Event data is an object with the following data:
eventData: {
  combat: Reference to the combat item,
  isNewRound: Whether a new round is going to start/has started (Depends on the hook if it is about to start, or has already started),
  isNewPhase: Whether a new phase is going to start/has started,
  isNewTurn: Whether a new turn is going to start/has started,
  oldRound: Integer representing the old value for round,
  newRound: Integer representing the current value for round,
  oldPhase: Object representing the old value for phase,
  newPhase: Object representing the new value for phase,
  oldCombatant: Object representing the old value for the active combatant,
  newCombatant: Object representing the new value for the active combatant
}

Phase is an object with the following data:
phase: {
  name: Localization key of the name,
  description: Localization key of the description,
  iterateTurns: Boolean representing if this phase has combatants acting in order,
  resetInitiative: Boolean representing if this phase resets all initiative rolls
}

These are the currently supported combat types:
"normal": For normal combat.
Normal has only one phase, "Combat".

"starship": For starship combat.
Starship has the following 6 phases: "Changing Roles", "Engineering", "Piloting Check", "Helm", "Gunnery", and "Damage"

"vehicleChase": For vehicle chases
Vehicle has the following 3 phases: "Pilot Actions", "Chase Progress", and "Combat"


Counter management.js 'renderCombatTracker' 
added 
combatant.active   is the conbatant active in this phase
combatant.turnsTaken  counts how many phases the combatant acted





*/

export class d100BCombat extends Combat {
  static HiddenTurn = 0;
  /**
   * 
   * @param {*} data 
   * @param {*} options 
   * @param {*} userId 
   */

  _preCreate(data, options, user) {
    console.log(data)
    const combatType = this.scene.isStarship ? "starship" : "normal"
    const update = {
      "flags.d100A.combatType": combatType,
      //    "flags.d100A.lastuserAct": false,
      //    "flags.d100A.isPiloted": false,
      "flags.d100A.counter": 0,
      "flags.d100A.phase": 0,
      "flags.d100A.action": 0,
      "flags.d100A.resetInit": false,

    };


    this.updateSource(update);
    return super._preCreate(data, options, user);
  }

  get phase() {
    return this._getCurrentState().phase
  }

  set phase(value) {

    const update = { "flags.d100A.phase": value };
    this.update(update);
    //   console.log(newround)
    return this._getCurrentState().phase
  }

  get roundB() {
    return this._getCurrentState().round
  }

  set roundB(value) {
    const update = { "round": value };
    this.update(update);
    //  console.log(newround)
    return this._getCurrentState().round
  }
  get action() {
    return this._getCurrentState().action
  }

  get turnB() {
    return this._getCurrentState().turn
  }

  set turnB(value) {
    const update = { "turn": value };
    this.update(update);
    //  console.log(newround)
    return this._getCurrentState().turn
  }
  get action() {
    return this._getCurrentState().action
  }

  set action(value) {
    const update = { "flags.d100A.action": value };
    this.update(update);
    // console.log(newround)
    return this._getCurrentState().action
  }

  /* -------------------------------------------- */

  /**
   * Rewind the combat to the previous turn
   * @returns {Promise<Combat>}
   */
  async previousTurn() {
    const actions = this.getSubPhases()
    const numActions = actions.length
    const phases = this.getPhases()
    const numPhases = phases.length

    if ((this.turn === 0)) {
      this.turnB = null;
      if (this.action == 1) return this.action = 0;
      if (numActions === 1) {
        if(this.phase>0){
        this.phase = this.phase - 1
        }
        if(this.phase === 0){
          this.phase = numPhases - 1
          this.roundB = this.round - 1
          }
      return

      }
      if (numActions === 2){
        this.action = 1
        if(this.phase>0){
          this.phase = this.phase - 1
          }
        
      } 


    }
    if ((this.turn === null) && (this.round === 0) && (this.action === 0) && (this.phase === 0)) return this;
    if (this.turn === null) {
     this.turnB = this.combatants.size -1 
      return;
    }
    this.turnB = this.turnB - 1


  }

  /* -------------------------------------------- */

  /**
   * Begin the combat encounter, advancing to round 1 and turn 1
   * @returns {Promise<Combat>}
   */
  async startCombat() {
    //fxfgzxdfgx
  }
  async begin() {

    const update = {
      "flags.d100A.combatType": this.getCombatType(),
      "flags.d100A.firstAction": true
    };
    await this.update(update);
    this.phase = 0
    this.roundB = 1
    this.action = 0
    this.turn = null

    const updates = this.combatants.map(c => {
      const isNpcCrew = c.actor.isNpcCrew ? true : false
      return {
        _id: c.id,
        // initiative: null,
        flags: {
          d100A: {
            isNpcCrew: isNpcCrew,
            actions: {
              total: c.apr,
              remaining: c.apr
            },
            delayed: false,


            stunned: {
              isStunned: false, // This should be a look at the  get isInitStunned()
              stunnedRound: -1,
              stunDur: 0
            }
          }
        }


      }
    });
    console.log("updates", updates)
    this.updateEmbeddedDocuments("Combatant", updates);
    console.log("this.combatants", this.combatants)

    //   Hooks.callAll("onBeginCombat", eventData);

    // await this._notifyAfterUpdate(eventData);
    console.log("\n<--End of async begin() - ")
    //        await this.rollAll();


    //    await ui.combat._render(false)
    this._playCombatSound("startEncounter");
    const updateData = { round: 1, turn: null };
    Hooks.callAll("combatStart", this, updateData);
    this.update(updateData);
    const status = this.nextTurnStatus()
    /*
        if (status.moreValidTurns){
          //werertwer
          await this._handleUpdate(1, 0, 0, status.nextTurn);
        }
        else {
          this.GMUpdate()
    
        }
    */


  }

  nextTurnStatus() {
    const turnstatus = {
      moreValidTurns: false,
      thisTurn: this.turn,
      nextTurn: null,
      resetInitiative: false

    }
    let turn = this.turn ?? -1;
    //  console.log("Turn ", turn)
    let skip = this.settings.skipDefeated;
    skip = true
    //   console.log(this.getSubPhases())
    const whoCanAct = this.getSubPhases()[this.action].whoCanAct
    //   console.log(whoCanAct)
    for (let [i, t] of this.turns.entries()) {
      //     console.log("t ", t.name, t, t.flags.crewRole)
      if (whoCanAct.includes("all")) {
        //        console.log("t ", t, i, turn, i <= turn)
        if (i <= turn) continue;
        if (skip && t.isDefeated) continue;
        if (!t.canAct) continue;// Alt
        if (t.isInitStunned) console.log("here");
        if (t.isInitStunned) continue;
        if (t.flags.d100A.actions.remaining < 1) continue;
        turnstatus.moreValidTurns = true // flag if this is a valid round
        turnstatus.nextTurn = i;
        break;
      }
      else if (whoCanAct.includes(t.flags.crewRole)) {

        //      console.log("t ", t)
        if (i <= turn) continue;
        if (skip && t.isDefeated) continue;
        // if (!t.canAct) continue;// Alt
        if (t.isInitStunned) console.log("here");
        if (t.isInitStunned) continue;
        turnstatus.moreValidTurns = true // flag if this is a valid round
        turnstatus.nextTurn = i;
        break;
      }
    }
    // See if rest init
    if (turnstatus.moreValidTurns == false) {
      turnstatus.resetInitiative = this.getPhases()[this.phase].resetInitiative && this.getSubPhases()[this.action].resetInitiative

    }


    //if (nextTurn == -1)  // Means there are no more turns left this phase
    return turnstatus
  }
  async GMUpdate() {

    // when turn is null (last PC turn taken)  need to apply pending damage 
    // if this is the last action / phase / turn = null and flag is down 
    // increment to new round 
    // clear init, 
    // reset actions
    // let peple roll init / change roles
    // Raise a flag  
    // if flag is raised 
    // lower flag 
    // roll any empty init 
    const updateOptions = {};
    const phases = this.getPhases();
    const actions = this.getSubPhases();
    let oldAction = this.action
    let oldPhase = this.phase
    let oldRound = this.roundB
    const origRound = oldRound
    let newAction = this.action
    let newPhase = this.phase
    let newRound = this.roundB
    let runFirstLoop = false
    /*  if (this.flags.d100A.firstAction) {
        runFirstLoop = true
        const update = { "flags.d100A.firstAction": false };
        this.update(update);
      }*/
    const resetTime = (oldAction == (actions.length - 1)) && (oldPhase == (phases.length - 1))
    runFirstLoop = (oldAction == 0) && (oldPhase == 0) && this.flags.d100A.firstAction

    if (actions[oldAction].killActors) this.killActors()

    /*console.log("resetTime",resetTime,runTime)
   
    let resetInit = false
    const nextTurnStatus = this.nextTurnStatus()
    console.log("nextTurnStatus", nextTurnStatus)
       //this needs to run each new round otherwise it skips the first action
    if (this.flags.d100A.firstAction) {
      firstAction = true
      const update = { "flags.d100A.firstAction": false };
      await this.update(update);
    }
    if (this.flags.d100A.resetInit) {
      resetInit = true
      const update = { "flags.d100A.resetInit": false };
      await this.update(update);
    }*/
    if (resetTime) {
      this.resetActions()
      await this._handleUpdate(this.roundB + 1, 0, 0, null, {}, true);
      return

    }



    //  if ((!(this.round === 0)) && !this.turn) this.endOfAction = true
    // if ((!(this.round === 0)) && !!this.turn) this.inTurns = true
    // check Initiative  
    //await this._handleUpdate(this.roundB, this.phase, this.action, 0);
    //    console.log("Details PhaseCalc", this.turn, this.action, this.phase, this.roundB, this.nextTurnStatus())

    if (runFirstLoop) {
      await this.rollAll()
      newAction = -1
    }
    if (true) {
      let loop = 0
      do {
        oldAction = newAction
        oldPhase = newPhase
        oldRound = newRound
        newAction = (oldAction + 1) % actions.length
        newPhase = (oldPhase + Math.floor((oldAction + 1) / actions.length)) % phases.length

        newRound = (oldRound + Math.floor((oldPhase + (Math.floor((oldAction + 1) / actions.length))) / phases.length))
        //      console.log("PhaseCalc", newRound, oldRound, newPhase, oldPhase, Math.floor((oldPhase + 1) / phases.length), phases.length)
        await this._handleUpdate(newRound, newPhase, newAction);
        if (newRound > oldRound) {
          this.resetActions()
          await this._handleUpdate(newRound, 0, 0, null, {}, true);

        }

        //await this.setActiveCombatants()
        //      console.log("Details ", this.turn, this.action, this.phase, this.roundB, this.nextTurnStatus())
        loop++;
      } while (!this.nextTurnStatus().moreValidTurns && (loop < 4) && (!(newRound > oldRound)));
    }

    //   console.log("\nactions", newAction, newPhase, newRound)
    // Jump to the GM Update

    const advanceTime = CONFIG.time.turnTime;
    updateOptions.advanceTime = advanceTime + CONFIG.time.roundTime;
    updateOptions.direction = 1;
    await this._handleUpdate(newRound, newPhase, newAction, this.nextTurnStatus().nextTurn, updateOptions, false);

    // If this is a new round 

    //   console.log(!!(newRound - oldRound), newRound - oldRound, newRound, oldRound)
    // if (!!(newRound-origRound)) this.resetActions()

    //await this.setActiveCombatants()
    // await this._handleUpdate(newRound, newPhase, newAction, this.nextTurnStatus().nextTurn, updateOptions);
    //this.updateCombatantActors() 





  }

  async resetActions() {
    await this.resetAll()
    const resetInit = this.flags.d100A.resetInit
    const updates = this.combatants.map(c => {

      return {
        _id: c.id,
        flags: { d100A: { actions: { remaining: c.apr } } },
      }
    });
    //  console.log("updates", updates)
    await this.updateEmbeddedDocuments("Combatant", updates);
    //  console.log(this)
    this._handleUpdate(this.roundB, this.phase, this.action, null, {}, true);
    //  console.log(this)


  }

  async nextTurn(skip = false) {


    //   console.log("hi ", this.turn, this.phase, this.action)
    const thisCombatantID = this.current.combatantId
    const nextTurnStatus = this.nextTurnStatus()

    const oldcombatant = game.combat.combatants.get(thisCombatantID);
    //  console.log("nextTurnStatus - ", nextTurnStatus, oldcombatant)
    const updateOptions = {};

    if (!skip && !!oldcombatant) oldcombatant.actionsRemaining = oldcombatant.actionsRemaining - 1;

    if (nextTurnStatus.moreValidTurns) {
      const advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
      updateOptions.advanceTime = advanceTime + CONFIG.time.roundTime;
      updateOptions.direction = 1;
      await this._handleUpdate(this.roundB, this.phase, this.action, nextTurnStatus.nextTurn, updateOptions, this.flags.d100A.firstAction);
      return
    }



    await this._handleUpdate(this.roundB, this.phase, this.action, nextTurnStatus.nextTurn, updateOptions, this.flags.d100A.firstAction);
    return
  }

  async _handleUpdate(nextRound, nextPhase, nextAction, nextTurn, updateOptions = {}, firstAction = false) {
    //   console.log("nextTurn ", nextTurn, firstAction)
    // const newround = nextAction * 10000 + nextPhase * 1000 + nextRound
    const update = {
      round: nextRound,
      turn: nextTurn,
      "flags.d100A.phase": nextPhase,
      "flags.d100A.action": nextAction,
      "flags.d100A.firstAction": firstAction,

    };
    //   console.log("round ", newround,firstAction)
    //   console.log("update.turn ", update)
    Hooks.callAll("combatTurn", this, update, updateOptions);
    await this.update(update, updateOptions);
    //   console.log("turn ", this)
  }

  async _notifyBeforeUpdate(eventData) {
    //   console.log(["_notifyBeforeUpdate", eventData]);
    // console.log([isNewRound, isNewPhase, isNewTurn]);
    // console.log([this.round, this.flags.sfrpg.phase, this.turn]);

    Hooks.callAll("onBeforeUpdateCombat", eventData);
  }

  async _notifyAfterUpdate(eventData) {
    // console.log(["_notifyAfterUpdate", eventData]);
    // console.log([isNewRound, isNewPhase, isNewTurn]);
    // console.log([this.round, this.flags.sfrpg.phase, this.turn]);

    //  const combatType = this.getCombatType();
    // const combatChatSetting = game.settings.get('sfrpg', `${combatType}ChatCards`);

    if (eventData.isNewRound && (combatChatSetting !== "disabled" || combatChatSetting === "roundsTurns")) {
      // console.log(`Starting new round! New phase is ${eventData.newPhase.name}, it is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
      //  await this._printNewRoundChatCard(eventData);
    }

    if (eventData.isNewPhase && (combatChatSetting === "enabled" || combatChatSetting === "roundsPhases")) {
      // console.log(`Starting ${eventData.newPhase.name} phase! It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
      //  await this._printNewPhaseChatCard(eventData);
    }

    if (eventData.newCombatant && (combatChatSetting === "enabled" || combatChatSetting === "roundsTurns")) {
      // console.log(`[${eventData.newPhase.name}] It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
      //    await this._printNewTurnChatCard(eventData);
    }

    Hooks.callAll("onAfterUpdateCombat", eventData);
  }

  /**
    * Get the current history state of the Combat encounter.
    * @param {Combatant} [combatant]       The new active combatant
    * @returns {CombatHistoryData}
    * @protected
    */
  _getCurrentState(combatant) {
    console.log(this)
    const round = this.round
    combatant ||= this.combatant;
    const naction = this.flags?.d100A?.action || 0
    const nphase = this.flags?.d100A?.phase || 0
    const nround = round
    //const phase = this.round
    return {
      phase: nphase,
      action: naction,
      round: nround,
      turn: this.turn ?? null,
      combatantId: combatant?.id || null,
      tokenId: combatant?.tokenId || null
    };
  }

  async _printNewRoundChatCard(eventData) {
    const localizedCombatName = this.getCombatName();
    const localizedPhaseName = game.i18n.format(eventData.newPhase.name);
    let actionImage = 'systems/Alternityd100/icons/roles/dice.png'
    // Basic template rendering data
    const speakerName = game.i18n.format(d100BCombat.chatCardsText.speaker.GM);
    const templateData = {
      header: {
        image: actionImage,
        name: game.i18n.format(d100BCombat.chatCardsText.round.headerName, { round: this.round })
      },
      body: {
        header: game.i18n.format(d100BCombat.chatCardsText.round.bodyHeader),
        headerColor: d100BCombat.colors.round
      },
      footer: {
        content: game.i18n.format(d100BCombat.chatCardsText.footer, { combatType: localizedCombatName, combatPhase: localizedPhaseName })
      }
    };

    // Render the chat card template
    const template = `systems/Alternityd100/templates/chat/combat-card.html`;
    const html = await renderTemplate(template, templateData);

    // Create the chat message
    const chatData = {
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      speaker: ChatMessage.getSpeaker({ actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName }),
      content: html
    };

    await ChatMessage.create(chatData, { displaySheet: false });
  }

  async _printNewPhaseChatCard(eventData) {
    const localizedCombatName = this.getCombatName();
    const localizedmainPhaseName = game.i18n.format(eventData.newPhase.name);
    const localizedSubPhaseName = game.i18n.format(eventData.newSubPhase.name);
    const localizedPhaseName = localizedmainPhaseName + " " + localizedSubPhaseName;
    let actionImage = 'systems/Alternityd100/icons/roles/action.png'
    if (eventData.newSubPhase?.piloting) actionImage = 'systems/Alternityd100/icons/roles/pilotB.png'
    //if (!eventData,newSubPhase.piloting) actionImage = '/Alternityd100/icons/roles/action.png'
    //eventData.isNewSubPhase
    // Basic template rendering data
    const speakerName = game.i18n.format(d100BCombat.chatCardsText.speaker.GM);
    const templateData = {
      header: {
        image: actionImage,
        name: game.i18n.format(d100BCombat.chatCardsText.phase.headerName, { phase: localizedPhaseName })
      },
      body: {
        header: localizedPhaseName,
        headerColor: d100BCombat.colors.phase,
        message: {
          title: game.i18n.format(d100BCombat.chatCardsText.phase.messageTitle),
          body: game.i18n.format(eventData.newPhase.description || "")
        }
      },
      footer: {
        content: game.i18n.format(d100BCombat.chatCardsText.footer, { combatType: localizedCombatName, combatPhase: localizedPhaseName })
      }
    };

    // Render the chat card template
    const template = `systems/Alternityd100/templates/chat/combat-card.html`;
    const html = await renderTemplate(template, templateData);

    // Create the chat message
    const chatData = {
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      speaker: ChatMessage.getSpeaker({ actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName }),
      content: html
    };

    await ChatMessage.create(chatData, { displaySheet: false });
  }

  async _printNewTurnChatCard(eventData) {
    const localizedCombatName = this.getCombatName();
    let localizedPhaseName = game.i18n.format(eventData.newPhase.name);
    console.log("eventData", eventData)
    // Basic template rendering data
    const speakerName = eventData.newCombatant.name;
    const actorID = eventData.newCombatant.actorId;
    let characterName = game.i18n.format(d100BCombat.chatCardsText.turn.headerName, { combatant: eventData.newCombatant.name })
    if (eventData.combat.flags.d100A.combatType == "starship") {
      characterName = game.i18n.format(d100BCombat.chatCardsText.turn.headerName, { combatant: eventData.newCombatant.actor.name })
      localizedPhaseName = eventData.newCombatant.token.actor.findCrewJob(actorID)
      eventData.newPhase.description = ""
    }


    const templateData = {
      header: {
        image: eventData.newCombatant.img,
        name: characterName

      },
      body: {
        header: "",
        headerColor: d100BCombat.colors.turn,
        message: {
          title: localizedPhaseName,
          body: game.i18n.format(eventData.newPhase.description || "")
        }
      },
      footer: {
        content: game.i18n.format(d100BCombat.chatCardsText.footer, { combatType: localizedCombatName, combatPhase: localizedPhaseName })
      }
    };

    // Render the chat card template
    const template = `systems/Alternityd100/templates/chat/combat-card.html`;
    const html = await renderTemplate(template, templateData);

    // Create the chat message
    const chatData = {
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      speaker: ChatMessage.getSpeaker({ actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName }),
      content: html
    };

    await ChatMessage.create(chatData, { displaySheet: false });
  }

  getCombatType() {

    return this.flags.d100A.combatType || "normal";
  }

  getCombatName() {
    switch (this.getCombatType()) {
      default:
      case "normal":
        return game.i18n.format(d100BCombat.normalCombat.name);
      case "starship":
        return game.i18n.format(d100BCombat.starshipCombat.name);
      case "vehicleChase":
        return game.i18n.format(d100BCombat.vehicleChase.name);
    }
  }

  getPhases() {
    switch (this.getCombatType()) {
      default:
      case "normal":
        return d100BCombat.normalCombat.phases;
      case "starship":
        return d100BCombat.starshipCombat.phases;
      case "vehicleChase":
        return d100BCombat.vehicleChase.phases;
    }
  }

  getSubPhases() {
    switch (this.getCombatType()) {
      default:
      case "normal":
        return d100BCombat.normalCombat.subPhases;
      case "starship":
        return d100BCombat.starshipCombat.subPhases;
      case "vehicleChase":
        return d100BCombat.vehicleChase.subPhases;
    }
  }

  getCurrentPhase() {
    return this.getPhases()[this.phase || 0];
  }
  getCurrentSubPhase() {
    return this.getSubPhases()[this.action || 0];
  }

  hasCombatantsWithoutInitiative() {
    for (let [index, combatant] of this.turns.entries()) {
      if ((!this.settings.skipDefeated || !combatant.defeated) && !combatant.initiative) {
        return true;
      }
    }
    return false;
  }

  xxxxxgetIndexOfFirstUndefeatedCombatant() {
    let maintainCombat = false;
    for (let [index, combatant] of this.turns.entries()) {
      let activeStatus
      if (typeof combatant.flags.canAct == "undefined") activeStatus = true;
      else activeStatus = combatant.flags.canAct

      //    console.log("\nactiveStatus : ",activeStatus)
      if (!combatant.defeated && combatant.active) maintainCombat = true;
      if (!combatant.defeated && combatant.active && activeStatus) {

        return index;
      }

    }
    console.log("\ngetIndexOfFirstUndefeatedCombatant()\n - maintainCombat - ", maintainCombat)
    return maintainCombat;

  }

  async xxxgetIndexOfFirstValidCombatant(thisTurn) {
    dowecomehere
    thisTurn.maintainCombat = true;
    await this.setActiveCombatants(thisTurn)
    const phases = this.getPhases();
    const subPhases = this.getSubPhases();
    // console.log("\nnextTurn:",thisTurn,thisSubPhase,thisPhase,thisRound)//1
    let nextTurn = foundry.utils.duplicate(thisTurn)
    if (thisTurn.newround) nextTurn.turn = 0
    do {
      // console.log("\n !nextTurn.newround",!nextTurn.newround)
      if (!nextTurn.newround) {
        nextTurn.turn = (nextTurn.turn + 1) % this.turns.length
        nextTurn.subPhase = (nextTurn.turn == 0) ? (nextTurn.subPhase + 1) % subPhases.length : nextTurn.subPhase
        nextTurn.phase = (nextTurn.subPhase == 0 && nextTurn.turn == 0) ? (nextTurn.phase + 1) % phases.length : nextTurn.phase
        nextTurn.round = (nextTurn.phase == 0 && nextTurn.subPhase == 0 && nextTurn.turn == 0) ? nextTurn.round + 1 : nextTurn.round
      }
      //  console.log("\n nextRound",nextTurn.round,"\n nextPhase",nextTurn.phase,"\n nextSubPhase",nextTurn.subPhase,"\n nextTurn",nextTurn.turn,this.turn,  "\n Start?",nextTurn.newround,'--')
      await this.setActiveCombatants(nextTurn)
      const thisPhase = phases[nextTurn.phase];
      const thisSubPhase = subPhases[nextTurn.subPhase];

      for (let [index, combatant] of this.turns.entries()) {
        if (index < nextTurn.turn) continue;   // Skip to next index if before nextTurn
        if (combatant.defeated && !combatant.active) nextTurn.maintainCombat = false;
        nextTurn.turn = index
        // console.log("\nFor " ,nextTurn.turn,index,combatant)
        if (thisSubPhase.piloting) {  // For Pilots in pilot Phase
          //console.log("\nPilot - ",nextSubPhase.whoCanAct, combatant.flags.crewRole, combatant.actor.name)
          if ((!combatant.defeated) && thisSubPhase.whoCanAct.includes(combatant.flags.crewRole)) {
            //console.log("\nPilot - ",combatant.actor.name)
            return nextTurn;
          }
        }
        if (!thisSubPhase.piloting) {// for normal actions    
          if ((!combatant.defeated) && combatant.flags.canAct) {
            //console.log("\n-----ValidTurn-----:",index)
            return nextTurn;
          }
        }
      }
      nextTurn.newround = false
      // console.log("\nghf")
      if (nextTurn.round > 50) return null
    }
    while (nextTurn.maintainCombat);
    //  console.log("\ngetIndexOfFirstUndefeatedCombatant()\n - maintainCombat - ", nextTurn.maintainCombat)
    return nextTurn.maintainCombat;
  }

  async killActors() {

    for (let c of this.combatants) {
      //      console.log(c)
      let flagdown = false

      let stunned = await c.token.actor.sheet._onApplyPendingDamage()
      let downround = 0
      //    console.log("newflagdown ", c.name, stunned)
    }

  }

  async xxxxsetActiveCombatants() { //thisTurn
    let phase = this.phase
    //if (nextphase) (phase ++) % 4;
    console.log("\nPhase ", phase)
    const updates = this.combatants.map(c => {
      //  console.log(c.flags.crewRole)
      //const flags = foundry.utils.duplicate(c.flags)
      let crewRole = "";
      if (this.flags.d100A.combatType == "starship") {


        if (!(flags.npcCrew == true)) {
          c.flags.d100A.crewRole = c.token.actor.findCrewJob(c.actorId)
          //   console.log(crewRole,c)
        }
        if (flags.npcCrew == true) {
          c.flags.d100A.crewRole = flags.d100A.crewRole
        }


      }
      c.flags.d100A.canAct = this.isThisActive(c, phase)
      //  console.log(c)
      return {
        _id: c.id,
        flags: c.flags

      }
    });
    console.log("setActiveCombatants()  updates", updates)
    await this.updateEmbeddedDocuments("Combatant", updates);
    // if (reset) combatant.active = false            
    //    console.log("\n---this.combatants---\n",this.combatants)
    await ui.combat.getData()
    await ui.combat._render(false)

  }
  xxxxxisThisActive(c, phase) {
    // console.log(c)
    const degree = c.initDegree
    //if (c.flags.acted) return false;
    if (degree == "") { console.log("init"); return true };
    if (phase == 0 && ["amazing"].includes(degree)) return true
    if (phase == 1 && ["amazing", "good"].includes(degree)) return true
    if (phase == 2 && ["amazing", "good", "ordinary"].includes(degree)) return true
    if (phase == 3 && ["amazing", "good", "ordinary", "marginal"].includes(degree)) return true
    return false


  }

  xxxxxgetIndexOfLastUndefeatedCombatant() {
    const turnEntries = Array.from(new Set(this.turns.entries())).reverse();
    for (let [index, combatant] of turnEntries) {
      if (!combatant.defeated && combatant.active) {
        console.log("getIndexOfLastUndefeatedCombatant -", index)
        return index;
      }
    }
    return null;
  }

  xxxxxisEveryCombatantDefeated() {
    let A = this.getIndexOfFirstUndefeatedCombatant() === false;

    if (A) ui.notifications.error(game.i18n.format("He's dead, Dave. Everybody is dead. Everybody is dead, Dave."), { permanent: false });
    // console.log("\nisEveryCombatantDefeated - ", A)


    return A
  }

  _xxxxgetInitiativeFormula(combatant) {
    //  console.log(combatant)
    if (this.getCombatType() === "starship") {
      return "1d20 + @skills.pil.mod"
    }
    else {
      return "1d20 + @attributes.init.total";
    }
  }

  async _getInitiativeRoll(combatant, formula) {
    const rollContext = new RollContext();
    rollContext.addContext("combatant", combatant.actor);
    rollContext.setMainContext("combatant");
    //console.log("\n---combatant---------------\n",combatant)
    combatant.actor.setupRollContexts(rollContext);

    const parts = [];

    if (this.getCombatType() === "starship") {
      parts.push("@pilot.skills.pil.mod");
      rollContext.setMainContext("pilot");
    } else {
      parts.push("@combatant.attributes.init.total");
    }

    /* const rollResult = await Diced100.createRoll({
         rollContext: rollContext,
         parts: parts,
         title: game.i18n.format("SFRPG.Rolls.InitiativeRollFull", {name: combatant.actor.name})
     });*/
    const rollResult = await combatant.actor.rollActionCheck();
    rollResult.roll.flags = { d100A: { finalFormula: rollResult.formula, actionCheck: actor.actioncheck } };
    return rollResult.roll;
  }

  async rollInitiative(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}, options = { event: null, skipDialog: true, staticRoll: null, /* chatMessage: true,*/ noSound: false, dice: "1d20" }) {
    options.chatMessage = game.settings.get("Alternityd100", "initCards");


    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    const currentId = this.combatant?.id;
    let rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");
    console.log("rollMode", rollMode, messageOptions.rollMode, game.settings.get("core", "rollMode"), ids)
    // Iterate over Combatants, performing an initiative roll for each
    const updates = [];
    const messages = [];
    let isFirst = true;
    for (const id of ids) {

      const combatant = await this.combatants.get(id);

      const actionCheck = combatant.actor.system.attributes.actchk
      //console.log(combatant)
      //console.log(combatant.flags.d100A)

      if (!combatant?.isOwner) return results;
      console.log("\nactionCheck\n", combatant.actor.system.attributes, actionCheck)
      const parts = [actionCheck.step.total, " Base, "]
      let stepbonus = actionCheck.step.total;
      //  console.log("\nactionCheck\n", actionCheck)
      const props = ["something", "2.jghf"];
      // Roll initiative
      const fullactionRoll = await Diced100.skillRoll({
        event: options.event,
        fastForward: options.skipDialog === true,
        staticRoll: options.staticRoll,
        parts,
        stepbonus,
        ordinary: actionCheck.ordinary,
        good: actionCheck.good,
        amazing: actionCheck.amazing,
        dice: options.dice,
        data: combatant.actor.system,
        subject: { skill: actionCheck },
        title: actionCheck.label,
        flavor: actionCheck.label + " " + actionCheck.step.total,
        speaker: ChatMessage.getSpeaker({ actor: combatant.actor }),
        chatTemplate: "systems/Alternityd100/templates/chat/roll-ext.hbs",
        chatTemplateData: { hasProperties: props.length > 0, properties: props },
        chatMessage: options.chatMessage,
        noSound: options.noSound,
        compendiumEntry: null,
        fastForward: true

      });

      const actionRoll = fullactionRoll.roll
      console.log("\nDiced100.actionRoll({\n", actionRoll, "\nDiced100.fullactionRoll({\n", fullactionRoll)

      /*
              if (options.chatMessage) {
                  if (!actionRoll) {
                      continue;
                  }
                  let degree = "marginal"
                  if (actionRoll.total <= actionCheck.ordinary) degree = "ordinary";
                  if (actionRoll.total <= actionCheck.good) degree = "good";
                  if (actionRoll.total <= actionCheck.amazing) degree = "amazing";
                  if (actionRoll.dice[0].total == 1) degree = "amazing";
                  updates.push({ _id: id, initiative: actionRoll.rolls[0].total, flags: { degree: degree, canAct: false } });
              }
              if (!options.chatMessage) {
                  */
      if (!actionRoll) {
        continue;
      }
      /*
      let degree = "marginal"
      if (actionRoll.total <= actionCheck.ordinary) degree = "ordinary";
      if (actionRoll.total <= actionCheck.good) degree = "good";
      if (actionRoll.total <= actionCheck.amazing) degree = "amazing";
      // if (actionRoll.dice[0].total == 1) degree = "amazing";
      */
      let initiative = actionRoll.total
      if (combatant.actor.system.type == "ordnance") initiative = 0

      // console.log(actionRoll, initiative, degree)
      // const flagcopy = await foundry.utils.duplicate(combatant.flags)
      console.log(combatant /*,flagcopy*/)
      // flagcopy.d100A.degree = degree, 
      // flagcopy.d100A.canAct = false 
      updates.push({ _id: id, initiative: initiative });


    }
    //-----END OF ID Loop

    console.log(updates)

    if (!updates.length) return this;

    // Update multiple combatants
    await this.updateEmbeddedDocuments("Combatant", updates);

    //await this.setActiveCombatants()


    // Ensure the turn order remains with the same combatant





    if (updateTurn && currentId) {
      //await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
      //    await this.update({ turn: 0 });
    }

    // Create multiple chat messages
    await CONFIG.ChatMessage.documentClass.create(messages);

    // Return the updated Combat
    // await this.nextTurn()
    await this.update({ turn: null });
    console.log("\n---End of Roll Inititive --\n", this)

    return this;




  }



  _getPilotForStarship(starshipActor) {
    const pilotIds = starshipActor.getActorIdsForCrewRole("pilot");
    if (!pilotIds || pilotIds.length === 0) {
      return null;
    }

    return game.actors.entries.find(x => x.id === pilotIds[0]);
  }

  _sortCombatantsAsc(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    let ci = ia - ib;
    if (ci !== 0) return ci;
    let [an, bn] = [a.token?.name || "", b.token?.name || ""];
    let cn = an.localeCompare(bn);
    if (cn !== 0) return cn;
    return a.tokenId - b.tokenId;
  }


}


async function onConfigClicked(combat, direction) {
  const combatType = combat.flags?.d100A?.combatType || "normal";
  const types = ["normal", "starship", "vehicleChase"];
  const indexOf = types.indexOf(combatType);
  const wrappedIndex = (types.length + indexOf + direction) % types.length;

  const update = {
    "flags.d100A.combatType": types[wrappedIndex], "isSpace": combatType == "starship"
  };
  await combat.update(update);
  console.log("combat ", combat)
}

Hooks.on('renderCombatTracker', (app, html, data) => {
  // console.log(app, html, data)
  //console.trace(data)
  const activeCombat = app.viewed;
  if (!activeCombat) {
    return;
  }

  const header = html.find('.combat-tracker-header');
  //const header = html.find('#combat-round');
  const footer = html.find('.directory-footer');

  const roundHeader = header.find('h3');
  const originalHtml = roundHeader.html();

  if (activeCombat.round) {
    const phases = activeCombat.getPhases();
    if (phases.length > 1) {
      roundHeader.replaceWith(`<div>${originalHtml}<h4>${game.i18n.format(activeCombat.getCurrentPhase().name)} - ${game.i18n.format(activeCombat.getCurrentSubPhase().name)}</h4></div>`);
    }
  } else {
    // This changes the header and adds the selector for the combat type. 
    //Need to reduce font size

    const prevCombatTypeButton = `<a class="combat-type-prev" title="${game.i18n.format("SFRPG.Combat.EncounterTracker.SelectPrevType")}"><i class="fas fa-caret-left"></i></a>`;
    const nextCombatTypeButton = `<a class="combat-type-next" title="${game.i18n.format("SFRPG.Combat.EncounterTracker.SelectNextType")}"><i class="fas fa-caret-right"></i></a>`;
    roundHeader.replaceWith(`<div>${originalHtml}<h4>${prevCombatTypeButton} &nbsp; ${activeCombat.getCombatName()} &nbsp; ${nextCombatTypeButton}</h4></div>`);

    // Handle button clicks
    const configureButtonPrev = header.find('.combat-type-prev');
    configureButtonPrev.click(ev => {
      ev.preventDefault();
      onConfigClicked(activeCombat, -1);
    });

    const configureButtonNext = header.find('.combat-type-next');
    configureButtonNext.click(ev => {
      ev.preventDefault();
      onConfigClicked(activeCombat, 1);
    });

    const beginButton = footer.find('.combat-control[data-control=startCombat]');
    beginButton.click(ev => {
      ev.preventDefault();
      activeCombat.begin();
    });
  }
});

d100BCombat.colors = {
  round: "Salmon",
  phase: "LightGreen",
  turn: null
};

d100BCombat.normalCombat = {
  name: "SFRPG.Combat.Normal.Name",
  initiativeSorting: "desc",
  phases: [
    {
      name: "SFRPG.Combat.Normal.Phases.1.Name",
      iterateTurns: true,
      resetInitiative: false
    },
    {
      name: "SFRPG.Combat.Normal.Phases.2.Name",
      iterateTurns: true,
      resetInitiative: false
    },
    {
      name: "SFRPG.Combat.Normal.Phases.3.Name",
      iterateTurns: true,
      resetInitiative: false
    },
    {
      name: "SFRPG.Combat.Normal.Phases.4.Name",
      iterateTurns: true,
      resetInitiative: true
    }

  ],
  subPhases: [

    {
      name: "SFRPG.Combat.Normal.SubPhases.1.Name",
      description: "SFRPG.Combat.Normal.SubPhases.1.Description",
      iterateTurns: true,
      resetInitiative: true,
      whoCanAct: ["all"],
      piloting: false,
      killActors: true
    }
  ]
};

d100BCombat.starshipCombat = {
  name: "SFRPG.Combat.Starship.Name",
  initiativeSorting: "desc",
  phases: [
    {
      name: "SFRPG.Combat.Starship.Phases.1.Name",
      description: "SFRPG.Combat.Starship.Phases.1.Description",
      iterateTurns: true,
      resetInitiative: false
    },
    {
      name: "SFRPG.Combat.Starship.Phases.2.Name",
      description: "SFRPG.Combat.Starship.Phases.2.Description",
      iterateTurns: true,
      resetInitiative: false
    },
    {
      name: "SFRPG.Combat.Starship.Phases.3.Name",
      description: "SFRPG.Combat.Starship.Phases.3.Description",
      iterateTurns: true,
      resetInitiative: false
    },
    {
      name: "SFRPG.Combat.Starship.Phases.4.Name",
      description: "SFRPG.Combat.Starship.Phases.4.Description",
      iterateTurns: true,
      resetInitiative: true
    }
  ],
  subPhases: [

    {
      name: "SFRPG.Combat.Starship.SubPhases.1.Name",
      description: "SFRPG.Combat.Starship.SubPhases.1.Description",
      iterateTurns: true,
      resetInitiative: false,
      whoCanAct: ["Pilot", "Copilot", "pilot", "copilot"],
      piloting: true,
      killActors: false
    },
    {
      name: "SFRPG.Combat.Starship.SubPhases.2.Name",
      description: "SFRPG.Combat.Starship.SubPhases.2.Description",
      iterateTurns: true,
      resetInitiative: true,
      whoCanAct: ["all"],
      piloting: false,
      killActors: true
    }
  ]
};

d100BCombat.vehicleChase = {
  name: "SFRPG.Combat.VehicleChase.Name",
  initiativeSorting: "desc",
  phases: [
    {
      name: "SFRPG.Combat.VehicleChase.Phases.1.Name",
      description: "SFRPG.Combat.VehicleChase.Phases.1.Description",
      iterateTurns: true,
      resetInitiative: false
    },
    {
      name: "SFRPG.Combat.VehicleChase.Phases.2.Name",
      description: "SFRPG.Combat.VehicleChase.Phases.2.Description",
      iterateTurns: false,
      resetInitiative: false
    },
    {
      name: "SFRPG.Combat.VehicleChase.Phases.3.Name",
      description: "SFRPG.Combat.VehicleChase.Phases.3.Description",
      iterateTurns: true,
      resetInitiative: false
    }
  ],
  subPhases: [

    {
      name: "SFRPG.Combat.Starship.SubPhases.1.Name",
      description: "SFRPG.Combat.Starship.SubPhases.1.Description",
      iterateTurns: true,
      resetInitiative: false,
      whoCanAct: ["Pilot", "Copilot", "pilot", "copilot"],
      piloting: true
    },
    {
      name: "SFRPG.Combat.Starship.SubPhases.2.Name",
      description: "SFRPG.Combat.Starship.SubPhases.2.Description",
      iterateTurns: true,
      resetInitiative: true,
      whoCanAct: ["all"],
      piloting: false
    }
  ]
};

d100BCombat.errors = {
  historyLimitedResetInitiative: "SFRPG.Combat.Errors.HistoryLimitedResetInitiative",
  historyLimitedStartOfEncounter: "SFRPG.Combat.Errors.HistoryLimitedStartOfEncounter",
  missingInitiative: "SFRPG.Combat.Errors.MissingInitiative"
};

d100BCombat.chatCardsText = {
  round: {
    headerName: `SFRPG.Combat.ChatCards.Round.Header`,
    bodyHeader: `SFRPG.Combat.ChatCards.Round.BodyHeader`,
  },
  phase: {
    headerName: `SFRPG.Combat.ChatCards.Phase.Header`,
    messageTitle: `SFRPG.Combat.ChatCards.Phase.MessageTitle`
  },
  turn: {
    headerName: `SFRPG.Combat.ChatCards.Turn.Header`
  },
  footer: `SFRPG.Combat.ChatCards.Footer`,
  speaker: {
    GM: `SFRPG.Combat.ChatCards.Speaker.GM`
  }
};


/**
    * Is this the first turn? if so set all the combatant flags
   */
/*  if ((this.turn == null) && (this.phase = 0) && (this.action >= 0)) {
    console.log("hi ")
    await this.setActiveCombatants()
    console.log(this.combatants)
 
  }
    */
/************************************************************** */

/**
 *  Determine the turn Status are there more valid turns, and who is next   
 */