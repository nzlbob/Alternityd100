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

export class Combatd100A extends Combat {
    static HiddenTurn = 0;
    // defaultOptions;
    // This is hew we get here from foundty

    /***
     * 
    
       * Handle new Combat creation request
       * @param {Event} event
       * @private
       
      async _onCombatCreate(event) {
        event.preventDefault();
        let scene = game.scenes.current;
        const cls = getDocumentClass("Combat");
        const combat = await cls.create({scene: scene?.id});
        await combat.activate({render: false});
      }
     * 
     *  CONFIG.Combat.documentClass = Combatd100A;
     */

    /**
     * Toggle Token combat state
     * @private
     */
    /**
    async _onToggleCombat(event) {
      event.preventDefault();
      console.log("xcvbxcv")
      await this.object.toggleCombat();
      event.currentTarget.classList.toggle("active", this.object.inCombat);
    }
  */


    async _onCreate(data = {}, options = {}, userId = {}) {

        super._onCreate(data, options, userId);

        //console.log(this.scene.isStarship)

        if (this.scene.isStarship) {
            this.isSpace = true
            this.test = false
            const update = {
                "flags.sfrpg.combatType": "starship", "flags.lastuserAct": false
            };
            await this.update(update);
        }
        if (!this.scene.isStarship) {
            this.isSpace = false
            this.test = false
            const update = {
                "flags.sfrpg.combatType": "normal", "flags.lastuserAct": false
            };
            await this.update(update);
        }
        //console.log(data, options,userId,this)



        await this.activate({ render: true });
    }

    async _onCreateDescendantDocuments(type, documents, result, options, userId) {
        await super._onCreateDescendantDocuments(type, documents, result, options, userId);
        //   const current = this.combatant;
        //   console.log(this,type, documents, result, options, userId,current)
        console.log("\n_onCreateEmbeddedDocuments\n")

        /* This did nothing
        
            const updates = this.combatants.map(c => { 
                let crewRole = "";           
               if (this.flags.sfrpg.combatType == "starship" ){
                   
                   crewRole = c.token.actor.findCrewJob(c.actorID) 
               }     
        
                           return {
                           _id: c.id,
                         //  initiative: null,
                         //  flags: {degree: null, canAct:false,crewRole : crewRole}
                         flags: {crewRole : crewRole}  
                       }});
                       console.log("updates",updates)
                       await this.updateEmbeddedDocuments("Combatant", updates);
                   
        */
        const updates = this.combatants.map(c => {
            let crewRole = "";
            /* if (this.flags.sfrpg.combatType == "starship" ){
                 
                 crewRole = c.token.actor.findCrewJob(c.actorID) 
             }     
          */
            console.log("-----------THIS ONCE!!!------------THIS ONCE!!!-----------------THIS ONCE!!!---------------------THIS ONCE!!!")
            return {
                _id: c.id,
                flags: { actions: { total: c.apr, remaining: c.apr }, delayed: null },
                actions: { total: c.apr },
                //  initiative: null,
                //  flags: {degree: null, canAct:false,crewRole : crewRole}

            }
        });
        console.log("updates", updates)
        await this.updateEmbeddedDocuments("Combatant", updates);
        console.log(this)

        //this.collections.

        //Hooks.callAll("renderCombatTracker");
        //   FOUNDRY 37225 combat.createEmbeddedDocuments("Combatant", createData);
        if (this.active && (options.render !== false)) this.collection.render();
        //await this.update({test:true})
        // await ui.combat.getData()

        // Hooks.callAll("onAfterUpdateCombat");

        await ui.combat._render(false);
    }

    async _onUpdateDescendantDocuments(name, documents, result, options, userId) {
        super._onUpdateDescendantDocuments(name, documents, result, options, userId)
        //   const current = this.combatant;
        // console.log(this,name, documents, result, options, userId, current)

        console.log("\n_onUpdateEmbeddedDocuments\n")
        //this.collections.

        //  Hooks.callAll("renderCombatTracker");
        //   FOUNDRY 37225 combat.createEmbeddedDocuments("Combatant", createData);


        //FOUNDRY.JS 18904 interesting Code
        //   if ( this.active && (options.render !== false) ) this.collection.render();
    }



    async begin() {
        const update = {
            "flags.sfrpg.combatType": this.getCombatType(),
            "flags.sfrpg.phase": 0,
            "flags.sfrpg.subPhase": 0
        };

        await this.update(update);

        const currentPhase = this.getCurrentPhase();
        const currentSubPhase = this.getCurrentSubPhase();
        const superIterateTurns = currentPhase.iterateTurns && currentSubPhase.iterateTurns;
        const eventData = {
            combat: this,
            isNewRound: true,
            isNewPhase: true,
            isNewSubPhase: true,
            isNewTurn: superIterateTurns,
            oldRound: this.round,
            newRound: this.round,
            oldPhase: currentPhase,
            newPhase: currentPhase,
            oldSubPhase: currentSubPhase,
            newSubPhase: currentSubPhase,
            oldCombatant: superIterateTurns ? this.turns[this.turn] : null,
            newCombatant: superIterateTurns ? this.turns[this.turn] : null,
        };

        if (eventData.isNewPhase) {
            if (this.round.resetInitiative) {
                const updates = this.combatants.map(c => {
                    return {
                        _id: c.id,
                        initiative: null,
                        flags: { degree: null, canAct: false, delayed: null, actions: { total: c.apr, remaining: c.apr } }
                    }
                });
                console.log("updates", updates)
                await this.updateEmbeddedDocuments("Combatant", updates);
                console.log("this.combatants", this.combatants[0].flags)
            }
        }


        Hooks.callAll("onBeginCombat", eventData);

        await this._notifyAfterUpdate(eventData);
        console.log("\n<--End of async begin() - ", eventData.isNewTurn,)
        await this.rollAll();


        await ui.combat._render(false)
    }

    async delete(options = {}) {
        Hooks.callAll("onBeforeCombatEnd", this);
        super.delete(options);
    }

    setupTurns() {
        let sortMethod = "desc";
        switch (this.getCombatType()) {
            default:
            case "normal":
                sortMethod = Combatd100A.normalCombat.initiativeSorting;
                break;
            case "starship":
                sortMethod = Combatd100A.starshipCombat.initiativeSorting;
                break;
            case "vehicleChase":
                sortMethod = Combatd100A.vehicleChase.initiativeSorting;
                break;
        }

        const combatants = this.combatants;

        const scene = game.scenes.get(this.scene);
        const players = game.users.players;
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);
        const turns = this.combatants.contents.sort(sortMethod === "asc" ? this._sortCombatantsAsc : this._sortCombatants);
        this.turn = Math.clamped(this.turn, Combatd100A.HiddenTurn, turns.length - 1);

        return this.turns = turns;
    }

    async previousTurn() {


        /*
        if (this.isEveryCombatantDefeated()) {
            return;
        }
        console.log("previousTurn")
        let nextRound = this.round;
        let nextPhase = this.flags.sfrpg.phase;
        let nextTurn = this.turn - 1;

        const currentPhase = this.getCurrentPhase();
        const currentSubPhase = this.getCurrentSubPhase();
        if (currentPhase.resetInitiative) {
            ui.notifications.error(game.i18n.format(Combatd100A.errors.historyLimitedResetInitiative), {permanent: false});
            return;
        }

        if (currentSubPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                const turnEntries = Array.from(new Set(this.turns.entries())).reverse();
                nextTurn = -1;
                for (let [index, combatant] of turnEntries) {
                    if (index >= this.turn) continue;
                    if (!combatant.defeated) {
                        nextTurn = index;
                        break;
                    }
                }
            }
        }
        
        if (nextTurn < 0) {
            if (this.settings.skipDefeated) {
                nextTurn = this.getIndexOfFirstUndefeatedCombatant();;
            } else {
                nextTurn = 0;
            }
            nextPhase = nextPhase - 1;
            if (nextPhase < 0) {
                nextPhase = this.getPhases().length - 1;
                nextRound -= 1;
                if (nextRound <= 0) {
                    ui.notifications.error(game.i18n.format(Combatd100A.errors.historyLimitedStartOfEncounter), {permanent: false});
                    return;
                }
            }
        }

        if (nextPhase !== this.flags.sfrpg.phase || nextRound !== this.round) {
            const newPhase = this.getPhases()[nextPhase];
            if (newPhase.iterateTurns) {
                if (this.settings.skipDefeated) {
                    nextTurn = this.getIndexOfLastUndefeatedCombatant();
                } else {
                    nextTurn = this.turns.length - 1;
                }
            }
        }

        await this._handleUpdate(nextRound, nextPhase, nextTurn);

        */
    }
    //---------------------------------------------------------------------------------
    async delayTurn() {

        //console.log("Delay")
        let turn = this.turn;
        const oldCombatant = this.turns[turn]
        /*
        console.log (oldCombatant,oldCombatant.initiative)
        
        const updates = [ {
                       _id: oldCombatant.id,
                       initiative: 111,
                       flags: {delayed:oldCombatant.initiative}
                       
                   }];
                   console.log("updates",updates)
                   await this.updateEmbeddedDocuments("Combatant", updates);
          */
        this.nextTurn(false)








    }


    //---------------------------------------------------------------------------------
    async nextTurn(useAction = true) {

        
        if (this.isEveryCombatantDefeated()) {
            return;
        }
        console.log("Turn", this)
        let nextRound = this.round;
        let nextPhase = this.flags.sfrpg.phase;
        let nextSubPhase = this.flags.sfrpg.subPhase;
        let turn = this.turn;
        let newround = false


        console.log("Turn", this.combatant?.flags.delayed)
        if ((turn == (this.turns.length - 1)) && !game.users.current.isGM) {
            console.log("Turn", this.combatant?.flags.delayed)
            //combatant.flags.delayed
            const update = {
                "flags.delayed": useAction,
            };

            await this.combatant.update(update);
            useAction ? ui.notifications.info("Turn Complete - Acted - GM to end phase") : ui.notifications.info("Turn Complete - Delayed - GM to end phase")
            //
            //

            const isKosh = (Math.random() < 0.02)
            let sound = "systems/Alternityd100/sounds/oet.wav"
            isKosh ? sound = "systems/Alternityd100/sounds/Kosh-Pebbles.wav" : sound = "systems/Alternityd100/sounds/oet.wav"
            const chatData2 = [{
                flavor: "DM End Phase",
                speaker: ChatMessage.getSpeaker({ actor: this.combatant.actor }),
                sound: sound  // //sounds/notify.wav CONFIG.sounds.dice
            }];
            await CONFIG.ChatMessage.documentClass.create(chatData2);

            return
        }
        if ((turn == (this.turns.length - 1)) && game.users.current.isGM && !(this.combatant.flags.delayed === null)) {
            useAction = this.combatant.flags.delayed;
            console.log("Turn", this.combatant?.flags.delayed)

            const update = {
                "flags.delayed": null,
            };

            await this.combatant.update(update);


            console.log("Turn", this.combatant?.flags.delayed)

        }
        console.log("Turn", this.combatant?.flags.delayed)

        if (nextRound > 0 &&
            nextPhase == 0 &&
            nextSubPhase == 0 &&
            turn == null
        ) {
            newround = true
        }




        let thisTurn = {
            round: this.round,
            phase: this.flags.sfrpg.phase,
            subPhase: this.flags.sfrpg.subPhase,
            turn: this.turn,
            maintainCombat: true,
            newround: newround
        }
        const oldCombatant = this.turns[turn]

        if (!!oldCombatant) {
            console.log("oldCombatant", turn)
            console.log("oldCombatant", this.turns)
            console.log("oldCombatant", oldCombatant)
            console.log("oldCombatant", oldCombatant.flags)
            console.log("oldCombatant", oldCombatant.flags.delayed)


            console.log(useAction, !!oldCombatant, (oldCombatant?.flags?.delayed !== null), useAction && !!oldCombatant && (oldCombatant?.flags?.delayed !== null))
        }
        // this was commented out

        //has acted, was a combatant, reduce the turns remaining

        if (useAction && !!oldCombatant) {
            const remaining = oldCombatant.flags.actions.remaining - 1


            const updates = [{
                _id: oldCombatant.id,

                flags: { canAct: !(remaining < 0), actions: { total: oldCombatant.apr, remaining: remaining }, dragRuler:{passedWaypoints: [] ,trackedRound:(this.round-2)} }

            }];
            console.log("updates", updates)
            await this.updateEmbeddedDocuments("Combatant", updates);

        }

        /*
        
         if( useAction && !!oldCombatant && (oldCombatant?.flags?.delayed !== null)){
        const updates = [ {
                        _id: oldCombatant.id,
                        initiative: oldCombatant.flags.delayed,
                        flags: {acted:true,canAct:false,delayed:null}
                        
                    }];
                    console.log("updates",updates)
                    await this.updateEmbeddedDocuments("Combatant", updates);
                 }
 
 */
        const phases = this.getPhases();
        const subPhases = this.getSubPhases();
        const currentPhase = phases[thisTurn.phase];
        const currentSubPhase = subPhases[thisTurn.subPhase];
        if (currentPhase.resetInitiative && currentSubPhase.resetInitiative && this.hasCombatantsWithoutInitiative()) {
            ui.notifications.error(game.i18n.format(Combatd100A.errors.missingInitiative), { permanent: false });
            return;
        }
        console.log("\n nextRound", thisTurn.round, "\n nextPhase", thisTurn.phase, "\n nextSubPhase", thisTurn.subPhase,
            "\n nextTurn", thisTurn.turn, this.turn, "\n Start?", thisTurn.newround, '--')

        //nextTurn = 0; //this.turns.length + 1; ;
        let nextTurn = await this.getIndexOfFirstValidCombatant(thisTurn);




        //   if(this.turn == null) nextTurn = 0;

        //   if(!(this.turn == null)) 


        // if (nextPhase!=this.flags.sfrpg.phase) await this.setActiveCombatants(true);

        console.log("\nnextTurn:", nextTurn, nextSubPhase, nextPhase, nextRound)//1


        // nextTurn = 0 
        // if (nextRound != this.round) nextTurn = this.getIndexOfFirstValidCombatant(nextSubPhase,nextPhase,nextRound,nextTurn);

        //  console.log("\nnextTurn:",nextTurn)//1

        /*
        
                console.log("\n nextRound",nextRound)//2
                console.log("\n nextPhase\n",nextPhase)//0
                console.log("\n nextSubPhase\n",nextSubPhase)//0
               
                console.log("\n phases\n",currentPhase,phases, )
                console.log("\n subPhases\n",currentSubPhase,subPhases,"\n -----This-----\n" ,this)
                */
        this.setActiveCombatants(nextTurn);

        /*
                if (currentSubPhase.iterateTurns) {// true
                    if (this.settings.skipDefeated) {  //true
                        for (let [index, combatant] of this.turns.entries()) {
                            if (index < nextTurn) continue;   // Skip to next index if before nextTurn
                            if (currentSubPhase.piloting) {  // For Pilots in pilot Phase
                                console.log("\nPilot - ",currentSubPhase.whoCanAct, combatant.flags.crewRole, combatant.actor.name)
                                if ((!combatant.defeated) && currentSubPhase.whoCanAct.includes(combatant.flags.crewRole)  ) {
                                    console.log("\nPilot - ",combatant.actor.name)
                                    nextTurn = index;
                                    break;
                                }
                            }
                            if (!currentSubPhase.piloting) {// for normal actions
                            
                                if ((!combatant.defeated) && combatant.flags.canAct) {
                                    console.log(!combatant.defeated)
                                    nextTurn = index;
                                    break;
                                }
                            }    
                        if((index+1) == this.turns.length)  nextTurn = this.turns.length
                        }
                    }
                }
        
        /*
                console.log("\n nextTurn - ",nextTurn)
                // this triggers if we don't find a valid combatant
                if (nextTurn  == this.turns.length) {
                    console.log("\nend - ",nextTurn)
                    //nextSubPhase += 1;
                    nextTurn = 0; //this.turns.length + 1; ;
                    
        
                    nextSubPhase = (nextSubPhase + 1) % subPhases.length
                    nextPhase = (nextSubPhase==0) ? (nextPhase + 1) % phases.length: nextPhase
                    nextRound = (nextPhase==0) ? nextRound + 1 : nextRound
                    nextTurn = this.getIndexOfFirstValidCombatant(nextSubPhase,nextPhase,nextRound)
                    
                }
        */
        // End of iterate turns

        /*
        console.log("\n nextRound",nextRound,"\n nextPhase",nextPhase,"\n nextSubPhase",nextSubPhase,
        "\n nextTurn",nextTurn,"\n phases",phases,"\n subPhases",subPhases)
        
                console.log("Flags",this.flags.sfrpg, "\n ------This----\n",this,)
                console.log("\nnextSubPhase -",nextSubPhase,"\nsubPhases.length -",subPhases.length)
        /*        //---------------------------------------------
                // Check if we have got to the end of the subphases and we need a new phase
                if (nextSubPhase >= subPhases.length) {//no
                    nextPhase += 1;
                    nextSubPhase = 0;
                    if (this.settings.skipDefeated) {
                        nextTurn = this.getIndexOfFirstValidCombatant();;
                    } else {
                        nextTurn = 0;
                    }
                }
                //---------------------------------------------
                // Check if we have got to the end of the phases and we need a new round
                if (nextPhase >= phases.length) {//no
                    nextRound += 1;
                    nextPhase = 0;
                    if (this.settings.skipDefeated) {
                        nextTurn = this.getIndexOfFirstValidCombatant();
                    } else {
                        nextTurn = 0;
                    }
                }
                //---------------------------------------------
                // If the nextSubPhase has changed then set for the next subphase
                if (nextSubPhase !== this.flags.sfrpg.subPhase) {
                    const newSubPhase = subPhases[nextSubPhase];
                    if (newSubPhase.iterateTurns) {
                        if (this.settings.skipDefeated) {
                            nextTurn = this.getIndexOfFirstValidCombatant();
                        } else {
                            nextTurn = 0;
                        }
                    }
                }
        */

        console.log("\n nextRound", nextTurn.round, "\n nextPhase", nextTurn.phase, "\n nextSubPhase", nextTurn.subPhase,
            "\n nextTurn", nextTurn.turn, "\n phases", phases, "\n subPhases", subPhases, "\nsubPhases.length -", subPhases.length)

        //   console.log("\nFlags",this.flags.sfrpg, "\n ------This----\n",this,)

        await this._handleUpdate(nextTurn.round, nextTurn.phase, nextTurn.subPhase, nextTurn.turn);
    }

    //---------------------------------------------------------------------------------------

    async previousRound() {
        /*
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        const indexOfFirstUndefeatedCombatant = this.getIndexOfFirstUndefeatedCombatant();

        let nextRound = this.round;
        let nextPhase = 0;
        let nextTurn = 0;

        if (this.flags.sfrpg.phase === 0 && this.turn <= indexOfFirstUndefeatedCombatant) {
            nextRound = Math.max(1, this.round - 1);
        }

        const phases = this.getPhases();
        const newPhase = phases[nextPhase];
        if (newPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                nextTurn = indexOfFirstUndefeatedCombatant;
            }
        }

        await this._handleUpdate(nextRound, nextPhase, nextTurn);

        */
    }

    async nextRound() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        const indexOfFirstUndefeatedCombatant = this.getIndexOfFirstUndefeatedCombatant();

        let nextRound = this.round + 1;
        let nextPhase = 0;
        let nextSubPhase = 0;
        let nextTurn = 0;
        //fsgsfgfgsfg
        const phases = this.getPhases();
        const subPhases = this.getSubPhases();
        const newPhase = phases[nextPhase];
        const newSubPhase = subPhases[nextSubPhase];
        if (newPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                nextTurn = indexOfFirstUndefeatedCombatant;
            }
        }

        await this._handleUpdate(nextRound, nextPhase, nextSubPhase, nextTurn);
    }

    async _handleUpdate(nextRound, nextPhase, nextSubPhase, nextTurn) {
        const phases = this.getPhases();
        const subPhases = this.getSubPhases();
        const currentPhase = phases[this.flags.sfrpg.phase];
        const currentSubPhase = subPhases[this.flags.sfrpg.subPhase];
        const newPhase = phases[nextPhase];
        const newSubPhase = subPhases[nextSubPhase];

        console.log("\n------_handleUpdate----\n", this)
        const eventData = {
            combat: this,
            isNewRound: nextRound != this.round,
            isNewPhase: nextRound != this.round || nextPhase != this.flags.sfrpg.phase,
            isNewSubPhase: nextRound != this.round || nextSubPhase != this.flags.sfrpg.subPhase,
            // 
            isNewTurn: (nextRound != this.round && phases[nextPhase].iterateTurns) || nextTurn != this.turn,
            oldRound: this.round,
            newRound: nextRound,
            oldPhase: currentPhase,
            newPhase: newPhase,
            newSubPhase: newSubPhase,
            oldCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null,
            //newCombatant: null
            newCombatant: (newPhase.iterateTurns && (nextRound == this.round)) ? this.turns[nextTurn] : null,
            //newCombatant: newPhase.iterateTurns ? this.turns[nextTurn] : null,
        };
        console.log("\nnewCombatant", newPhase.iterateTurns, (nextRound == this.round))
        console.log("\nnewCombatant", (newPhase.iterateTurns && (nextRound != this.round)), eventData.newCombatant)
        if (!eventData.isNewRound && !eventData.isNewPhase && !eventData.isNewSubPhase && !eventData.isNewTurn) {
            return;
        }


        await this._notifyBeforeUpdate(eventData);

        if (!newPhase.iterateTurns) {
            nextTurn = Combatd100A.HiddenTurn;
        }
        if (nextRound != this.round) {
            nextTurn = null;
        }

        const updateData = {
            round: nextRound,
            "flags.sfrpg.phase": nextPhase,
            "flags.sfrpg.subPhase": nextSubPhase,
            turn: nextTurn
        };

        const advanceTime = CONFIG.time.turnTime;
        await this.update(updateData, { advanceTime });

        if (eventData.isNewPhase) {
            // Update delayed Characters
            // console.log(this)
            const actedUpdate = []

            for (let c of this.combatants) {
                console.log(c)
                let flagdown = false




                if ((this.flags.sfrpg.combatType == "normal")) {
                   flagdown =  c.actor.sheet._onApplyPendingDamage()
                }
                //         _id: c.id,
                //         initiative: c.flags.delayed,
                //         flags: {acted: null,delayed:null}

                console.log(flagdown, this.round,c)

                if (c.flags?.acted) {
                    actedUpdate.push({ _id: c.id, flags: { downround :flagdown? this.round : "-" ,canAct: true, acted: null, delayed: null } });
                }



            }


            console.log("updates", actedUpdate, this.combatants)
             this.updateEmbeddedDocuments("Combatant", actedUpdate);




            if (newPhase.resetInitiative) {
                const updates = this.combatants.map(c => {
                    let crewRole = "";
                    if (this.flags.sfrpg.combatType == "starship") {
                        if (!(c.flags.npcCrew == true)) {
                            crewRole = c.token.actor.findCrewJob(c.actorId)
                            console.log(crewRole)
                        }
                        if (c.flags.npcCrew == true) {
                            crewRole = c.flags.crewRole
                        }
                    }

                    return {
                        _id: c.id,
                        initiative: null,
                        flags: { degree: null, canAct: false, crewRole: crewRole, actions: { total: c.apr, remaining: c.apr } }

                    }
                });
                console.log("updates", updates)
                await this.updateEmbeddedDocuments("Combatant", updates);
            }



        }
        //this.setActiveCombatants()
        if (!(this.flags.sfrpg.combatType == "normal")) {
            console.log(game.scenes.active.tokens)
            for (const [key, token] of Object.entries(game.scenes.active.tokens.contents)) {
                console.log(key)
                console.log(token)
                token.actor.sheet._onApplyPendingDamage()
            }


        }

        console.log("\n---this.combatants---\n", this.combatants)
        console.log("\n------_handleUpdate----\n", this)
        await this._notifyAfterUpdate(eventData);
    }

    async _notifyBeforeUpdate(eventData) {
        //console.log(["_notifyBeforeUpdate", eventData]);
        //console.log([isNewRound, isNewPhase, isNewTurn]);
        //console.log([this.round, this.flags.sfrpg.phase, this.turn]);

        Hooks.callAll("onBeforeUpdateCombat", eventData);
    }

    async _notifyAfterUpdate(eventData) {
        //console.log(["_notifyAfterUpdate", eventData]);
        console.log("\n------_notifyAfterUpdate----\n", eventData)
        //console.log([isNewRound, isNewPhase, isNewTurn]);
        //console.log([this.round, this.flags.sfrpg.phase, this.turn]);

        const combatType = this.getCombatType();
        const combatChatSetting = game.settings.get('Alternityd100', `${combatType}ChatCards`);

        if (eventData.isNewRound && (combatChatSetting !== "disabled" || combatChatSetting === "roundsTurns")) {
            //console.log(`Starting new round! New phase is ${eventData.newPhase.name}, it is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewRoundChatCard(eventData)

        }

        if ((eventData.isNewPhase || eventData.isNewSubPhase) && (combatChatSetting === "enabled" || combatChatSetting === "roundsPhases")) {
            //console.log(`Starting ${eventData.newPhase.name} phase! It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            //const subPhase = false
            await this._printNewPhaseChatCard(eventData);
        }

        if (eventData.newCombatant && (combatChatSetting === "enabled" || combatChatSetting === "roundsTurns")) {
            //console.log(`[${eventData.newPhase.name}] It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewTurnChatCard(eventData);
        }

        Hooks.callAll("onAfterUpdateCombat", eventData);
        await ui.combat._render(false);
    }

    async _printNewRoundChatCard(eventData) {
        const localizedCombatName = this.getCombatName();
        const localizedPhaseName = game.i18n.format(eventData.newPhase.name);
        let actionImage = 'systems/Alternityd100/icons/roles/dice.png'
        // Basic template rendering data
        const speakerName = game.i18n.format(Combatd100A.chatCardsText.speaker.GM);
        const templateData = {
            header: {
                image: actionImage,
                name: game.i18n.format(Combatd100A.chatCardsText.round.headerName, { round: this.round })
            },
            body: {
                header: game.i18n.format(Combatd100A.chatCardsText.round.bodyHeader),
                headerColor: Combatd100A.colors.round
            },
            footer: {
                content: game.i18n.format(Combatd100A.chatCardsText.footer, { combatType: localizedCombatName, combatPhase: localizedPhaseName })
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
        const speakerName = game.i18n.format(Combatd100A.chatCardsText.speaker.GM);
        const templateData = {
            header: {
                image: actionImage,
                name: game.i18n.format(Combatd100A.chatCardsText.phase.headerName, { phase: localizedPhaseName })
            },
            body: {
                header: localizedPhaseName,
                headerColor: Combatd100A.colors.phase,
                message: {
                    title: game.i18n.format(Combatd100A.chatCardsText.phase.messageTitle),
                    body: game.i18n.format(eventData.newPhase.description || "")
                }
            },
            footer: {
                content: game.i18n.format(Combatd100A.chatCardsText.footer, { combatType: localizedCombatName, combatPhase: localizedPhaseName })
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
        let characterName = game.i18n.format(Combatd100A.chatCardsText.turn.headerName, { combatant: eventData.newCombatant.name })
        if (eventData.combat.flags.sfrpg.combatType == "starship") {
            characterName = game.i18n.format(Combatd100A.chatCardsText.turn.headerName, { combatant: eventData.newCombatant.actor.name })
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
                headerColor: Combatd100A.colors.turn,
                message: {
                    title: localizedPhaseName,
                    body: game.i18n.format(eventData.newPhase.description || "")
                }
            },
            footer: {
                content: game.i18n.format(Combatd100A.chatCardsText.footer, { combatType: localizedCombatName, combatPhase: localizedPhaseName })
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

        return this.flags?.sfrpg?.combatType || "normal";
    }

    getCombatName() {
        switch (this.getCombatType()) {
            default:
            case "normal":
                return game.i18n.format(Combatd100A.normalCombat.name);
            case "starship":
                return game.i18n.format(Combatd100A.starshipCombat.name);
            case "vehicleChase":
                return game.i18n.format(Combatd100A.vehicleChase.name);
        }
    }

    getPhases() {
        switch (this.getCombatType()) {
            default:
            case "normal":
                return Combatd100A.normalCombat.phases;
            case "starship":
                return Combatd100A.starshipCombat.phases;
            case "vehicleChase":
                return Combatd100A.vehicleChase.phases;
        }
    }

    getSubPhases() {
        switch (this.getCombatType()) {
            default:
            case "normal":
                return Combatd100A.normalCombat.subPhases;
            case "starship":
                return Combatd100A.starshipCombat.subPhases;
            case "vehicleChase":
                return Combatd100A.vehicleChase.subPhases;
        }
    }

    getCurrentPhase() {
        return this.getPhases()[this.flags?.sfrpg?.phase || 0];
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

        thisTurn.maintainCombat = true;
        //this.setActiveCombatants(thisTurn)
        const phases = this.getPhases();
        const subPhases = this.getSubPhases();
        // console.log("\nnextTurn:",thisTurn,thisSubPhase,thisPhase,thisRound)//1
        let nextTurn = duplicate(thisTurn)
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

    async setActiveCombatants(thisTurn) {
        let phase = thisTurn?.phase || this.flags.sfrpg.phase
        //if (nextphase) (phase ++) % 4;
        console.log("\nPhase sent/ cur", phase, this.flags.sfrpg.phase)
        const updates = this.combatants.map(c => {
            //  console.log(c.flags.crewRole)
            let crewRole = "";
            if (this.flags.sfrpg.combatType == "starship") {


                if (!(c.flags.npcCrew == true)) {
                    crewRole = c.token.actor.findCrewJob(c.actorId)
                    //   console.log(crewRole,c)
                }
                if (c.flags.npcCrew == true) {
                    crewRole = c.flags.crewRole
                }


            }

            //  console.log(c)
            return {
                _id: c.id,
                flags: { canAct: this.isThisActive(c, phase), crewRole: crewRole },

            }
        });
        //  console.log("setActiveCombatants()  updates",updates)
        await this.updateEmbeddedDocuments("Combatant", updates);
        // if (reset) combatant.active = false            
        //    console.log("\n---this.combatants---\n",this.combatants)
        await ui.combat.getData()
        await ui.combat._render(false)

    }
    isThisActive(c, phase) {
        // console.log(c)

        if (c.flags.acted) return false;
        if (!c.initiative) return true;
        if (phase == 0 && ["amazing"].includes(c.flags.degree)) return true
        if (phase == 1 && ["amazing", "good"].includes(c.flags.degree)) return true
        if (phase == 2 && ["amazing", "good", "ordinary"].includes(c.flags.degree)) return true
        if (phase == 3 && ["amazing", "good", "ordinary", "marginal"].includes(c.flags.degree)) return true
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

            const combatant = this.combatants.get(id);

            const actionCheck = combatant.actor.system.attributes.actchk
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

            const actionRoll = fullactionRoll.message
            console.log("\nDiced100.actionRoll({\n", actionRoll)


            if (options.chatMessage) {
                if (!actionRoll) {
                    continue;
                }
                let degree = "marginal"
                if (actionRoll.rolls[0].total <= actionCheck.ordinary) degree = "ordinary";
                if (actionRoll.rolls[0].total <= actionCheck.good) degree = "good";
                if (actionRoll.rolls[0].total <= actionCheck.amazing) degree = "amazing";
                if (actionRoll.rolls[0].dice[0].total == 1) degree = "amazing";
                updates.push({ _id: id, initiative: actionRoll.rolls[0].total, flags: { degree: degree, canAct: false } });
            }
            if (!options.chatMessage) {
                if (!actionRoll) {
                    continue;
                }
                let degree = "marginal"
                if (actionRoll.total <= actionCheck.ordinary) degree = "ordinary";
                if (actionRoll.total <= actionCheck.good) degree = "good";
                if (actionRoll.total <= actionCheck.amazing) degree = "amazing";
                if (actionRoll.dice[0].total == 1) degree = "amazing";
                let initiative = actionRoll.total
                if (combatant.actor.system.type == "ordnance") {
                    initiative = 0, degree = "amazing"

                }
                updates.push({ _id: id, initiative: initiative, flags: { degree: degree, canAct: false } });
            }

        }
        //-----END OF ID Loop



        if (!updates.length) return this;

        // Update multiple combatants
        await this.updateEmbeddedDocuments("Combatant", updates);

        await this.setActiveCombatants()


        // Ensure the turn order remains with the same combatant





        if (updateTurn && currentId) {
            //await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
            await this.update({ turn: 0 });
        }

        // Create multiple chat messages
        await CONFIG.ChatMessage.documentClass.create(messages);

        // Return the updated Combat
        // await this.nextTurn()
        await this.update({ turn: null });
        console.log("\n---End of Roll Inititive --\n", this)

        return this;




    }

    async rollInitiativeold(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant?.id;
        let rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");

        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        let isFirst = true;



        for (const id of ids) {
            // Get Combatant data
            const combatant = this.combatants.get(id);
            if (!combatant?.isOwner) return results;

            // Roll initiative
            const combatantInitiativeFormula = formula || this._getInitiativeFormula(combatant);
            const roll = await this._getInitiativeRoll(combatant, combatantInitiativeFormula);
            if (!roll) {
                continue;
            }
            updates.push({ _id: id, initiative: roll.total });

            // Construct chat message data
            let messageData = mergeObject({
                speaker: {
                    scene: game.scenes.current?.id,
                    actor: combatant.actor ? combatant.actor.id : null,
                    token: combatant.token?.id,
                    alias: combatant.token?.name

                },

                flavor: `${combatant.token?.name || combatant.actor?.name} rolls an Action Check!`,
                flags: { "core.initiativeRoll": true }
            }, messageOptions);
            //console.log(roll)
            const preparedRollExplanation = "" //Diced100.formatFormula(roll.flags.sfrpg.finalFormula.formula);
            const rollContent = await roll.render();
            const insertIndex = rollContent.indexOf(`<section class="tooltip-part">`);
            const explainedRollContent = rollContent.substring(0, insertIndex) + preparedRollExplanation + rollContent.substring(insertIndex);

            const chatData = {
                flavor: messageData.flavor,
                speaker: messageData.speaker,
                flags: messageData.flags,
                content: explainedRollContent,
                rollMode: combatant.hidden && (rollMode === "roll") ? "gmroll" : rollMode,
                roll: roll,
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                sound: CONFIG.sounds.dice
            };

            if (!isFirst) {
                chatData.sound = null;   // Only play 1 sound for the whole set
            }
            isFirst = false;
            messages.push(chatData);
        }
        //-----END OF ID Loop


        if (!updates.length) return this;

        // Update multiple combatants
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Ensure the turn order remains with the same combatant
        if (updateTurn && currentId) {
            await this.update({ turn: this.turns.findIndex(t => t.id === currentId) });
        }

        // Create multiple chat messages
        await CONFIG.ChatMessage.documentClass.create(messages);

        // Return the updated Combat
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

Combatd100A.colors = {
    round: "Salmon",
    phase: "LightGreen",
    turn: null
};

Combatd100A.normalCombat = {
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

Combatd100A.starshipCombat = {
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

Combatd100A.vehicleChase = {
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

Combatd100A.errors = {
    historyLimitedResetInitiative: "SFRPG.Combat.Errors.HistoryLimitedResetInitiative",
    historyLimitedStartOfEncounter: "SFRPG.Combat.Errors.HistoryLimitedStartOfEncounter",
    missingInitiative: "SFRPG.Combat.Errors.MissingInitiative"
};

Combatd100A.chatCardsText = {
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
