import { Diced100 } from "../dice.js";
import RollContext from "../rolls/rollcontext.js";

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
    const update = {

      "flags.d100A.combatType": "normal",
      "flags.d100A.lastuserAct": false,
      "flags.d100A.isPiloted": false,
      "flags.d100A.counter": 0,
      "flags.d100A.phase": 0


    };

    this.updateSource(update);
    return super._preCreate(data, options, user);
  }

  get phase() {
    return this._getCurrentState().phase
  }

  set phase(value) {
    const round = this.round
    const eaction = Math.trunc(round / 10000)
    const ephase = Math.trunc((round - (eaction * 10000)) / 1000)
    const eround = round - eaction * 10000 - ephase * 1000
    const newround = eaction * 10000 + value * 1000 + eround
    const update = {
      round: newround
    };
    console.log(value, round)
    this.update(update);
    console.log(newround)
    return this._getCurrentState().phase
  }

  get roundB() {
    return this._getCurrentState().round
  }

  set roundB(value) {
    const round = this.round
    const eaction = Math.trunc(round / 10000)
    const ephase = Math.trunc((round - (eaction * 10000)) / 1000)
    const eround = round - eaction * 10000 - ephase * 1000
    const newround = eaction * 10000 + ephase * 1000 + value
    const update = {
      round: newround
    };
    console.log(value, round)
    this.update(update);
    console.log(newround)
    return this._getCurrentState().phase
  }
  get action() {
    return this._getCurrentState().action
  }

  set action(value) {
    const round = this.round
    const eaction = Math.trunc(round / 10000)
    const ephase = Math.trunc((round - (eaction * 10000)) / 1000)
    const eround = round - eaction * 10000 - ephase * 1000
    const newround = value * 10000 + ephase * 1000 + eround
    const update = {
      round: newround
    };
    console.log(value, round)
    this.update(update);
    console.log(newround)
    return this._getCurrentState().phase
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
    };
    await this.update(update);
    this.phase = 0
    this.roundB = 1
    this.action = 0
    this.turn = null
    /**
     * {d100A:{
        actions: {
          total: this.apr,
          remaining: this.apr},
        delayed: false,
        degree: "",
        canAct: false,
        stunned: {
          isStunned: false,
          stunnedRound: -1,
          stunDur: 0 }}}
    }
     * 
     * 
     */


    const updates = this.combatants.map(c => {



      return {
        _id: c.id,
        // initiative: null,
        flags: {
          d100A: {
            actions: {
              total: c.apr,
              remaining: c.apr
            },
            delayed: false,

            canAct: false,
            stunned: {
              isStunned: false,
              stunnedRound: -1,
              stunDur: 0
            }
          }
        }


      }
    });
    console.log("updates", updates)
    await this.updateEmbeddedDocuments("Combatant", updates);
    console.log("this.combatants", this.combatants)

    //   Hooks.callAll("onBeginCombat", eventData);

    // await this._notifyAfterUpdate(eventData);
    console.log("\n<--End of async begin() - ")
    //        await this.rollAll();


    //    await ui.combat._render(false)




    this._playCombatSound("startEncounter");
    const updateData = { round: 1, turn: null };
    Hooks.callAll("combatStart", this, updateData);
    return this.update(updateData);
  }

  nextTurnStatus() {
    const turnstatus = {
      moreValidTurns: false,
      thisTurn: this.turn,
      nextTurn: -1
    }
    let turn = this.turn ?? -1;
    let skip = this.settings.skipDefeated;
    skip = true

    for (let [i, t] of this.turns.entries()) {
      console.log("t ", t)
      if (i <= turn) continue;
      if (skip && t.isDefeated) continue;
      if (!t.flags.d100A.canAct) continue;// Alt
      if (t.isInitStunned) console.log("here");
      if (t.isInitStunned) continue;
      turnstatus.moreValidTurns = true // flag if this is a valid round
      turnstatus.nextTurn = i;
      break;

    }


    //if (nextTurn == -1)  // Means there are no more turns left this phase

    return turnstatus

  }



  async nextTurn() {
    console.log("hi ", this.turn, this.phase, this.action)

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
    const nextTurnStatus = this.nextTurnStatus()
    console.log("nextTurnStatus - ", nextTurnStatus)
    const updateOptions = {};
    /**
     * Run this if there are more valid turns this phase / action
     */
    if (nextTurnStatus.moreValidTurns) {
      const advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
      updateOptions.advanceTime = advanceTime + CONFIG.time.roundTime;
      updateOptions.direction = 1;
      await this._handleUpdate(this.roundB, this.phase, this.action, nextTurnStatus.nextTurn, updateOptions);
      //this.updateCombatantActors() 
      return
    }

    /************************************************************************* */

    /***
     * This is the last turn of the action phase. GM to click throu to do updates
     * first click will finishing the first players turn TURN = NULL
     * second click will be the end of phase / action update
     */
if (this.turn > 0) {
  await this._handleUpdate(this.roundB, this.phase, this.action, null, updateOptions);
  return

}
    const phases = this.getPhases();
    const actions = this.getSubPhases();

    console.log("\nphases", phases)
    console.log("\nactions", actions)

    const newAction = (this.action + 1) % actions.length
    const newPhase = (this.phase + Math.floor((this.action + 1) / actions.length) ) % phases.length
    const newRound = (this.roundB + Math.floor((this.phase + 1) / phases.length) ) 
    console.log("\nactions", actions, newAction, newPhase,newRound)
    // Jump to the GM Update

    const advanceTime = CONFIG.time.turnTime;
    updateOptions.advanceTime = advanceTime + CONFIG.time.roundTime;
    updateOptions.direction = 1;
    await this._handleUpdate(newRound, newPhase, newAction, null, updateOptions);
    await this.setActiveCombatants()

    await this._handleUpdate(newRound, newPhase, newAction, null, updateOptions);
    return
    // this.updateCombatantActors() 
    // Determine the next turn number
    let next = null;

    //this.phase = this.phase + 1

    // Maybe advance to the next round
    //  let round = this.round;
    if ((this.round === 0) || (next === null) || (next >= this.turns.length)) {
      return this.nextRound();
    }

    //   this.phase = this.phase + 1
    //    round = this.round;

    //   const advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;

    //   updateOptions.advanceTime = advanceTime + CONFIG.time.roundTime;
    //   updateOptions.direction = 1;

    //  await this._handleUpdate(nextRound, nextPhase, nextTurn, updateOptions);

    // Update the document, passing data through a hook first
    // const updateData = { round, turn: next } //,flags:goB};// , flags:oldflags};

    //Hooks.callAll("combatTurn", this, updateData, updateOptions);
    //const a = await this.update(updateData, updateOptions);

  }

  async _handleUpdate(nextRound, nextPhase, nextAction, nextTurn, updateOptions = {}) {
    const newround = nextAction * 10000 + nextPhase * 1000 + nextRound
    const update = {
      round: newround,
      turn:nextTurn
    };
    console.log("round ", newround)

    await this.update(update, updateOptions);

    //  const phases = this.getPhases();
    //  const currentPhase = phases[this.flags.sfrpg.phase];
    //  const newPhase = phases[nextPhase];
    /*
      const eventData = {
          combat: this,
          isNewRound: nextRound !== this.round,
          isNewPhase: nextRound !== this.round || nextPhase !== this.flags.sfrpg.phase,
          isNewTurn: (nextRound !== this.round && phases[nextPhase].iterateTurns) || nextTurn !== this.turn,
          oldTurn: this.turn,
          newTurn: nextTurn,
          oldRound: this.round,
          newRound: nextRound,
          oldPhase: currentPhase,
          newPhase: newPhase,
          oldCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null,
          newCombatant: newPhase.iterateTurns ? this.turns[nextTurn] : null,
          direction: updateOptions.direction || nextRound - this.round || nextTurn - this.turn
      };
    */
    /*
    
      if (!eventData.isNewRound && !eventData.isNewPhase && !eventData.isNewTurn) {
          return;
      }
    */
    //  await this._notifyBeforeUpdate(eventData);

    /*
    
      if (!newPhase.iterateTurns) {
          nextTurn = CombatSFRPG.HiddenTurn;
      }
    */

    // const updateOptions = { direction: 1, worldTime: { delta: CONFIG.time.turnTime } };
    const updateData = {
      round: nextRound,
      // "flags.d100A.phase": nextPhase,
      turn: nextTurn
    };

    //await this.update(update, updateOptions);

    /*
    if (eventData.isNewPhase) {
        if (newPhase.resetInitiative) {
            const updates = this.combatants.map(c => {
                return {
                    _id: c.id,
                    initiative: null
                };
            });
            await this.updateEmbeddedDocuments("Combatant", updates);
        }
    }
  */
    //  await this._notifyAfterUpdate(eventData);
    // this._handleTimedEffects(eventData);
  }

  async _notifyBeforeUpdate(eventData) {
    // console.log(["_notifyBeforeUpdate", eventData]);
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
    const round = this.round
    combatant ||= this.combatant;
    const naction = Math.trunc(round / 10000)
    const nphase = Math.trunc((round - (naction * 10000)) / 1000)
    const nround = round - naction * 10000 - nphase * 1000
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
    if (eventData.combat.flags.sfrpg.combatType == "starship") {
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
    return this.getSubPhases()[this.flags?.sfrpg?.subPhase || 0];
  }

  hasCombatantsWithoutInitiative() {
    for (let [index, combatant] of this.turns.entries()) {
      if ((!this.settings.skipDefeated || !combatant.defeated) && !combatant.initiative) {
        return true;
      }
    }
    return false;
  }

  getIndexOfFirstUndefeatedCombatant() {
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

  async getIndexOfFirstValidCombatant(thisTurn) {
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

  async setActiveCombatants() { //thisTurn
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
  isThisActive(c, phase) {
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

  getIndexOfLastUndefeatedCombatant() {
    const turnEntries = Array.from(new Set(this.turns.entries())).reverse();
    for (let [index, combatant] of turnEntries) {
      if (!combatant.defeated && combatant.active) {
        console.log("getIndexOfLastUndefeatedCombatant -", index)
        return index;
      }
    }
    return null;
  }

  isEveryCombatantDefeated() {
    let A = this.getIndexOfFirstUndefeatedCombatant() === false;

    if (A) ui.notifications.error(game.i18n.format("He's dead, Dave. Everybody is dead. Everybody is dead, Dave."), { permanent: false });
    // console.log("\nisEveryCombatantDefeated - ", A)


    return A
  }

  _getInitiativeFormula(combatant) {
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
    rollResult.roll.flags = { sfrpg: { finalFormula: rollResult.formula, actionCheck: actor.actioncheck } };
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
  const combatType = combat.flags?.sfrpg?.combatType || "normal";
  const types = ["normal", "starship", "vehicleChase"];
  const indexOf = types.indexOf(combatType);
  const wrappedIndex = (types.length + indexOf + direction) % types.length;

  const update = {
    "flags.sfrpg.combatType": types[wrappedIndex], "isSpace": combatType == "starship"
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
      resetInitiative: true
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
      resetInitiative: false
    }

  ],
  subPhases: [

    {
      name: "SFRPG.Combat.Normal.SubPhases.1.Name",
      description: "SFRPG.Combat.Normal.SubPhases.1.Description",
      iterateTurns: true,
      resetInitiative: true,
      whoCanAct: ["all"],
      piloting: false
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
      resetInitiative: true
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
      resetInitiative: false
    }
  ],
  subPhases: [

    {
      name: "SFRPG.Combat.Starship.SubPhases.1.Name",
      description: "SFRPG.Combat.Starship.SubPhases.1.Description",
      iterateTurns: true,
      resetInitiative: true,
      whoCanAct: ["Pilot", "Copilot", "pilot", "copilot"],
      piloting: true
    },
    {
      name: "SFRPG.Combat.Starship.SubPhases.2.Name",
      description: "SFRPG.Combat.Starship.SubPhases.2.Description",
      iterateTurns: true,
      resetInitiative: false,
      whoCanAct: ["all"],
      piloting: false
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
      resetInitiative: true,
      whoCanAct: ["Pilot", "Copilot", "pilot", "copilot"],
      piloting: true
    },
    {
      name: "SFRPG.Combat.Starship.SubPhases.2.Name",
      description: "SFRPG.Combat.Starship.SubPhases.2.Description",
      iterateTurns: true,
      resetInitiative: false,
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


