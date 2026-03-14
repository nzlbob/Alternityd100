/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class d100ATokenDoc extends TokenDocument {
  /** @override */

  /**
   * Alternity-facing heading in degrees.
   *
   * Foundry's token rotation treats 0° as pointing "down" (south). Alternity prefers 0° as "up" (north).
   * We expose a computed heading which is always +180° from Foundry's rotation, normalized to [0, 360).
   */
  get d100ARotation() {
    const rot = Number(this.rotation ?? 0);
    const deg = rot + 180;
    // Prefer Foundry's helper if present.
    if (typeof Math.normalizeDegrees === "function") return Math.normalizeDegrees(deg);
    return ((deg % 360) + 360) % 360;
  }


  getData() {
    let data = super.getData();
    console.log("d100ATokenDoc.getData() {\n", this, data)

    return data
  }

  /**
   * Return a reference to a Combatant that represents this Token, if one is present in the current encounter.
   * This runs when the cursor is over the token
   * @type {Combatant|null}
   */
  get combatant() {
    //this.displayBars 
    this._source.displayBars = 50
    //console.log("Hello",this)
    if (!["starship"].includes(this.actor?.type)) {

      return game.combat?.getCombatantByToken(this.id) || null;
    }
    //console.log("Hello",this.actor.name," - ",this.actor.type,this,this.displayBars,this._source.displayBars )
    return game.combat?.getCombatantByToken(this.id) || null;

    return game.combat?.getCombatantByActor(this.actor.system.crew.pilot.actorIds[0]) || null;

  }

  /* -------------------------------------------- */

  /**
   * An indicator for whether this Token is currently involved in the active combat encounter.
   * @type {boolean}
   */
  get inCombat() {
    return !!this.combatant;
  }

  /**
   * Add or remove this Token from a Combat encounter.
   * @param {object} [options={}]         Additional options passed to TokenDocument.createCombatants or
   *                                      TokenDocument.deleteCombatants
   * @param {boolean} [options.active]      Require this token to be an active Combatant or to be removed.
   *                                        Otherwise, the current combat state of the Token is toggled.
   * @returns {Promise<boolean>}          Is this Token now an active Combatant?
   */
  async toggleCombatant({ active, ...options } = {}) {
    active ??= !this.inCombat;
    if (active) await this.constructor.createCombatants([this], options);
    else await this.constructor.deleteCombatants([this], options);
    return this.inCombat;
  }
  /***
   * Modified 06/09/25
   * Create Combatants for the provided Tokens within a specific Combat encounter.
   * If no Combat is provided, the currently viewed Combat encounter is used or a new one is created.
   * @param {Token[]} tokens               An array of Token instances for which to create Combatants
   * @param {object} [options={}]         Additional options passed to Combat.createEmbeddedDocuments
   * @param {Combat} [options.combat]     A specific combat encounter to which these Tokens should be added
   * @returns {Promise<Combatant[]>}      The newly created Combatant instances
   */
  static async createCombatants(tokens, { combat } = {}) {
  //  console.log("dfsgsdfgsdfg", tokens)
    // to get here the token clicked must not have been in combat (from d100 token hud)
    // Identify the target Combat encounter
    if (["starship", "ordnance"].includes(tokens[0].actor.type)) {
      return await d100ATokenDoc.createSpaceCombatants(tokens, combat);
    }

    combat ??= game.combats.viewed;
    if (!combat) {
      if (game.user.isGM) {
        const cls = getDocumentClass("Combat");
        combat = await cls.create({ scene: canvas.scene.id, active: true }, { render: false });
      }
      else throw new Error(game.i18n.localize("COMBAT.NoneActive"));
    }

    // Add tokens to the Combat encounter
    /***
     *   This is the original
     * 
     const createData = new Set(tokens).reduce((arr, token) => {
       if ( token.inCombat ) return arr;
       arr.push({tokenId: token.id, sceneId: token.parent.id, actorId: token.actorId, hidden: token.hidden});
       return arr;
     }, []);
    */
    const alltokens = tokens[0].layer.controlled.filter(t => t.inCombat == false);
    console.log("\n\nHello\n\n", alltokens, tokens)

    const d100Flags = {
      d100A: {
        actions: {
          remaining: 0,
          total: 0,
          actedThisPhase: false
        },
        isNpcCrew: null,
        crewRole: "",
        stunned: {
          isStunned: false,
          stunDur: 0,
          stunnedRound: -1
        }
      }
    };

    const createData = []
    for (let token of alltokens) {

      if (token.actor.type == "vehicle") {
        console.log(token)
        console.log(token.actor)
        console.log(token.actor.system.crew)
        for (let [ck, cv] of Object.entries(token.actor.system.crew)) {
          // console.log(ck, cv,token)
          //if (!["npcData","useNPCCrew"].includes(ck) )
          if (!!cv.actors) {
            for (let crewactor of cv.actors) {
              d100Flags.d100A.crewRole = ck
              d100Flags.d100A.isNpcCrew = token.actor.system.crew.useNPCCrew
              createData.push({
                tokenId: token.id,
                sceneId: token.scene.id,
                ship: token.actor,
                actorId: crewactor.id,
                hidden: false,
                flags: d100Flags
              });
            }
          }
        }
      }
      if (["character", "npc", "npc2", "drone"].includes(token.actor.type)) {

        
        createData.push({
          tokenId: token.id,
          sceneId: token.scene.id,
          actorId: token.document.actorId,
          hidden: token.document.hidden,
          flags: d100Flags
        });
      }

    }

    return combat.createEmbeddedDocuments("Combatant", createData);


    // console.log("\n\nToggmed\n",this,"\n")
    return this;
  }


  static async createSpaceCombatants(tokens, combat) {
    // console.log("create Space Combatants", this, tokens, combat)
    // Process each controlled token, as well as the reference token
    //an array of tokens that are not in combat 



    const state = false
   // console.log("State", state)
    const alltokens = tokens[0].layer.controlled.filter(t => t.inCombat == state);
  //  console.log("\n\nHello\n\n", alltokens, tokens)

    // if there is a token, and but not controlled (not sure how), and not in combat, add it 
    //    if (token && !token.controlled && (token.inCombat !== state)) tokens.push(token);

    // Reference the combat encounter displayed in the Sidebar if none was provided

    combat = combat ?? game.combats.viewed;
    if (!combat) {
      if (game.user.isGM) {
        const cls = getDocumentClass("Combat");
        combat = await cls.create({ scene: canvas.scene.id, active: true }, { render: !state || !tokens.length });
        // await ui.combat._render()
        const play = new Sound("systems/Alternityd100/sounds/encounter.wav")
        await play.load()
        play.play({ volume: 0.5 })
      //  console.log("play\n\n", play)
      } else {
        ui.notifications.warn("COMBAT.NoneActive", { localize: true });
        return [];
      }
    }

    // Add crew to the Combat encounter
 const d100Flags = {
      d100A: {
        actions: {
          remaining: 0,
          total: 0,
          actedThisPhase: false
        },
        isNpcCrew: null,
        crewRole: "",
        stunned: {
          isStunned: false,
          stunDur: 0,
          stunnedRound: -1
        }
      }
    };
      const createData = []
      for (let token of alltokens) {
        if (token.actor.system.type == "ordnance") {
          createData.push({
            tokenId: token.id,
            sceneId: token.scene.id,
            actorId: token.document.actorId,
            hidden: token.document.hidden,
            flags: d100Flags
          });
          continue;
        }
        if (!token.actor.system.crew?.useNPCCrew) {
       //   console.log(token)
       //   console.log(token.actor)
      //    console.log(token.actor.system.crew)
          for (let [ck, cv] of Object.entries(token.actor.system.crew)) {
             // console.log(ck, cv,token)
            //if (!["npcData","useNPCCrew"].includes(ck) )
            if (!!cv.actors) {
              for (let crewactor of cv.actors) {
             // d100Flags.d100A.crewRole = ck
             // d100Flags.d100A.isNpcCrew = token.actor.system.crew.useNPCCrew
                createData.push({
                  tokenId: token.id,
                  sceneId: token.scene.id,
                  ship: token.actor,
                  actorId: crewactor.id,
                  hidden: false,
                  flags: { d100A: { npcCrew: false, crewRole: ck } }
                });
              }
            }
          }
        }

        if (token.actor.system.crew?.useNPCCrew) {

          for (let [ck, cv] of Object.entries(token.actor.system.crew.npcData)) {
            // console.log(ck, cv, token)
            //if (!["npcData","useNPCCrew"].includes(ck) )
            if (cv.active) {
              for (let i = 0; i < cv.number; i++) {
                createData.push({
                  tokenId: token.id,
                  sceneId: token.scene.id,
                  ship: token.actor,
                  //actorId: crewactor.id,
                  hidden: true,
                  flags: { d100A: { npcCrew: true, crewRole: ck, npcNo: i } }

                });
              }
            }
          }
        }

      }


    //  console.log("createData", createData)
      let crewman = await combat.createEmbeddedDocuments("Combatant", createData);
      for (let a; a < createData.length; a++) {

        // crewman[a].ship = createData[a].actor

        /*  if (crewman[a].flags.npcCrew){
          crewman[a].npcActor = {name: "NPC-"+ crewman[a].flags.npcJob}
          }
        */
        // console.log(a)

      }


      // console.log(crewman)
      // await ui.combat._render()
      return crewman

    

    // Remove Tokens from combat
    if (!game.user.isGM) return [];
    //const tokenIds = new Set(tokens.map(t => t.id));
    const actorIds = new Set()

    for (let token of tokens) {


      for (let [ck, cv] of Object.entries(token.actor.system.crew)) {
        // console.log(ck, cv, token)
        //if (!["npcData","useNPCCrew"].includes(ck) )
        if (!!cv.actors) {
          for (let crewactor of cv.actors) {
            actorIds.add(crewactor.id);
          }
        }
      }
    }


    const combatantIds = combat.combatants.reduce((ids, c) => {
      if (actorIds.has(c.actorId)) ids.push(c.id);
      return ids;
    }, []);
    // console.log("Set", actorIds, combatantIds, combat.combatants)
    return combat.deleteEmbeddedDocuments("Combatant", combatantIds);
  }



  // Copy of the Tokenlayer toggleCombat function
  /**
   * 
   * @param {*} state - The state you want the token or crew to be in
   * @param {*} combat - the combat to add the 
   * @param {*} token 
   * @returns 
   */


  async xxtoggleSpaceCombat(state = true, combat = null, { token = null } = {}) {
    // Process each controlled token, as well as the reference token
    //an array of tokens that are not in combat 

  //  console.log("\n\nHello\n\n")
    const tokens = this.layer.controlled.filter(t => t.inCombat !== state);
    // if there is a token, and but not controlled (not sure how), and not in combat, add it 
    if (token && !token.controlled && (token.inCombat !== state)) tokens.push(token);

    // Reference the combat encounter displayed in the Sidebar if none was provided

    combat = combat ?? game.combats.viewed;
    if (!combat) {
      if (game.user.isGM) {
        const cls = getDocumentClass("Combat");
        combat = await cls.create({ scene: canvas.scene.id, active: true }, { render: !state || !tokens.length });
        await ui.combat._render()
        const play = new Sound("systems/Alternityd100/sounds/encounter.wav")
        await play.load()
        play.play({ volume: 0.5 })
      //  console.log("play\n\n", play)
      } else {
        ui.notifications.warn("COMBAT.NoneActive", { localize: true });
        return [];
      }
    }

    // Add crew to the Combat encounter
    if (state) {

      const createData = []
      for (let token of tokens) {
        if (token.actor.system.type == "ordnance") {
          createData.push({
            tokenId: token.id,
            sceneId: token.scene.id,
            actorId: token.document.actorId,
            hidden: token.document.hidden,
            flags: d100Flags
          });
          continue;
        }
        if (!token.actor.system.crew?.useNPCCrew) {
          // console.log(token)
          // console.log(token.actor)
          // console.log(token.actor.system.crew)
          for (let [ck, cv] of Object.entries(token.actor.system.crew)) {
            // console.log(ck, cv,token)
            //if (!["npcData","useNPCCrew"].includes(ck) )
            if (!!cv.actors) {
              for (let crewactor of cv.actors) {
                createData.push({
                  tokenId: token.id,
                  sceneId: token.scene.id,
                  ship: token.actor,
                  actorId: crewactor.id,
                  hidden: false,
                  flags: { d100A: { npcCrew: false, crewRole: ck } }
                });
              }
            }
          }
        }

        if (token.actor.system.crew?.useNPCCrew) {

          for (let [ck, cv] of Object.entries(token.actor.system.crew.npcData)) {
            // console.log(ck, cv,token)
            //if (!["npcData","useNPCCrew"].includes(ck) )
            if (cv.active) {
              for (let i = 0; i < cv.number; i++) {
                createData.push({
                  tokenId: token.id,
                  sceneId: token.scene.id,
                  ship: token.actor,
                  //actorId: crewactor.id,
                  hidden: true,
                  flags: { d100A: { npcCrew: true, crewRole: ck, npcNo: i } }

                });
              }
            }
          }



        }




      }


    //  console.log(createData)
      let crewman = await combat.createEmbeddedDocuments("Combatant", createData);
      for (let a; a < createData.length; a++) {

        crewman[a].ship = createData[a].actor

        /*  if (crewman[a].flags.npcCrew){
          crewman[a].npcActor = {name: "NPC-"+ crewman[a].flags.npcJob}
          }
        */
     //   console.log(a)

      }


      // console.log(crewman)
      await ui.combat._render()
      return crewman

    }

    // Remove Tokens from combat
    if (!game.user.isGM) return [];
    //const tokenIds = new Set(tokens.map(t => t.id));
    const actorIds = new Set()

    for (let token of tokens) {


      for (let [ck, cv] of Object.entries(token.actor.system.crew)) {
        // console.log(ck, cv, token)
        //if (!["npcData","useNPCCrew"].includes(ck) )
        if (!!cv.actors) {
          for (let crewactor of cv.actors) {
            actorIds.add(crewactor.id);
          }
        }
      }
    }


    const combatantIds = combat.combatants.reduce((ids, c) => {
      if (actorIds.has(c.actorId)) ids.push(c.id);
      return ids;
    }, []);
    // console.log("Set", actorIds, combatantIds, combat.combatants)
    return combat.deleteEmbeddedDocuments("Combatant", combatantIds);
  }


}