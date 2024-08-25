/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class d100AToken extends Token {
  /** @override */

  /* -------------------------------------------- */

  /**
   * Rotation is an alias for direction
   * @returns {number}
   */
  get rotation() {
    return this.document.rotation;
  }

  //-----------------------------------------------------------------------------//
  //  IN V12 this does nothing now, gone to createCombatants d100TokenDoc        //
  //  However still used for alternity                                           //
  //-----------------------------------------------------------------------------//
  /**
   * Add or remove the currently controlled Tokens from the active combat encounter
   * @param {Combat} [combat]    A specific combat encounter to which this Token should be added
   * @returns {Promise<Token>} The Token which initiated the toggle
   */
  async toggleCombat(state = true, combat = null, { token = null } = {}) {
    console.log(this)
    if (!(this.actor.type == "starship")) {
      // Process each controlled token, as well as the reference token
      const tokens = this.layer.controlled.filter(t => t.inCombat !== state);
      if (token && !token.controlled && (token.inCombat !== state)) tokens.push(token);

      // Reference the combat encounter displayed in the Sidebar if none was provided
      combat = combat ?? game.combats.viewed;
      if (!combat) {
        if (game.user.isGM) {
          const cls = getDocumentClass("Combat");
          combat = await cls.create({ scene: canvas.scene.id, active: true }, { render: !state || !tokens.length });
        } else {
          ui.notifications.warn("COMBAT.NoneActive", { localize: true });
          return [];
        }
      }

      // Add tokens to the Combat encounter
      if (state) {
        const createData = []
        for (let tokena of tokens) {

          if (tokena.actor.type == "vehicle") {
            console.log(tokena)
            console.log(tokena.actor)
            console.log(tokena.actor.system.crew)
            for (let [ck, cv] of Object.entries(tokena.actor.system.crew)) {
              // console.log(ck, cv,tokena)
              //if (!["npcData","useNPCCrew"].includes(ck) )
              if (!!cv.actors) {
                for (let crewactor of cv.actors) {
                  createData.push({
                    tokenId: tokena.id,
                    sceneId: tokena.scene.id,
                    ship: tokena.actor,
                    actorId: crewactor.id,
                    hidden: false,
                    flags: { npcCrew: false, crewRole: ck }
                  });
                }
              }
            }
          }
          if (tokena.actor.type == "character") {
            createData.push({
              tokenId: tokena.id,
              sceneId: tokena.scene.id,
              actorId: tokena.document.actorId,
              hidden: tokena.document.hidden
            });
          }

        }



        /* const createData = tokens.map(t => {
          return {
            tokenId: t.id,
            sceneId: t.scene.id,
            actorId: t.document.actorId,
            hidden: t.document.hidden
          };
        });*/
        return combat.createEmbeddedDocuments("Combatant", createData);
      }

      // Remove Tokens from combat
      if (!game.user.isGM) return [];
      const tokenIds = new Set(tokens.map(t => t.id));
      const combatantIds = combat.combatants.reduce((ids, c) => {
        if (tokenIds.has(c.tokenId)) ids.push(c.id);
        return ids;
      }, []);
      return combat.deleteEmbeddedDocuments("Combatant", combatantIds);


      /*
        await this.layer.toggleCombat(!this.inCombat, combat, {token: this});
        combat = combat ?? game.combats.viewed;
      //  console.log("\n\nHello\n\n",combat)
        combat.update({"test":true})
        
  */






    }
    else {

      await this.toggleSpaceCombat(!this.inCombat, combat, { token: this });
      // console.log("\n\nHello\n\n")
    }
    // console.log("\n\nToggmed\n",this,"\n")
    return this;
  }


  /* -------------------------------------------- */
  //  This was copied out of foundary.js as V11 made the function private.
  /**
   * Helper method to determine whether a token attribute is viewable under a certain mode
   * @param {number} mode   The mode from CONST.TOKEN_DISPLAY_MODES
   * @returns {boolean}      Is the attribute viewable?
   */
  _xxxxcanViewMode(mode) {
    if (mode === CONST.TOKEN_DISPLAY_MODES.NONE) return false;
    else if (mode === CONST.TOKEN_DISPLAY_MODES.ALWAYS) return true;
    else if (mode === CONST.TOKEN_DISPLAY_MODES.CONTROL) return this.controlled;
    else if (mode === CONST.TOKEN_DISPLAY_MODES.HOVER) return (this.hover || canvas.tokens._highlight);
    else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER) return this.isOwner && this.hover;
    else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER) return this.isOwner;
    return false;
  }


  // Copy of the Tokenlayer toggleCombat function
  /**
   * 
   * @param {*} state - The state you want the token or crew to be in
   * @param {*} combat - the combat to add the 
   * @param {*} token 
   * @returns 
   */


  async toggleSpaceCombat(state = true, combat = null, { token = null } = {}) {
    // Process each controlled token, as well as the reference token
    //an array of tokens that are not in combat 

    console.log("\n\nHello\n\n")
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
        console.log("play\n\n", play)
      } else {
        ui.notifications.warn("COMBAT.NoneActive", { localize: true });
        return [];
      }
    }

    // Add crew to the Combat encounter
    if (state) {

      const createData = []
      for (let tokena of tokens) {
        if (tokena.actor.system.type == "ordnance") continue;
        if (!tokena.actor.system.crew?.useNPCCrew) {
          console.log(tokena)
          console.log(tokena.actor)
          console.log(tokena.actor.system.crew)
          for (let [ck, cv] of Object.entries(tokena.actor.system.crew)) {
            // console.log(ck, cv,tokena)
            //if (!["npcData","useNPCCrew"].includes(ck) )
            if (!!cv.actors) {
              for (let crewactor of cv.actors) {
                createData.push({
                  tokenId: tokena.id,
                  sceneId: tokena.scene.id,
                  ship: tokena.actor,
                  actorId: crewactor.id,
                  hidden: false,
                  flags: { npcCrew: false, crewRole: ck }
                });
              }
            }
          }
        }

        if (tokena.actor.system.crew?.useNPCCrew) {

          for (let [ck, cv] of Object.entries(tokena.actor.system.crew.npcData)) {
             console.log(ck, cv,tokena)
            //if (!["npcData","useNPCCrew"].includes(ck) )
            if (cv.active) {
              for (let i = 0; i < cv.number; i++) {
                createData.push({
                  tokenId: tokena.id,
                  sceneId: tokena.scene.id,
                  ship: tokena.actor,
                  //actorId: crewactor.id,
                  hidden: true,
                  flags: { npcCrew: true, crewRole: ck, npcNo: i }

                });
              }
            }
          }



        }




      }


      console.log("createData",createData)
      let crewman = await combat.createEmbeddedDocuments("Combatant", createData);
      for (let a; a < createData.length; a++) {

        crewman[a].ship = createData[a].actor

        /*  if (crewman[a].flags.npcCrew){
          crewman[a].npcActor = {name: "NPC-"+ crewman[a].flags.npcJob}
          }
        */
        console.log(a)

      }


      console.log(crewman)
      await ui.combat._render()
      return crewman

    }

    // Remove Tokens from combat
    if (!game.user.isGM) return [];
    //const tokenIds = new Set(tokens.map(t => t.id));
    const actorIds = new Set()

    for (let tokena of tokens) {


      for (let [ck, cv] of Object.entries(tokena.actor.system.crew)) {
        console.log(ck, cv, tokena)
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
    console.log("Set", actorIds, combatantIds, combat.combatants)
    return combat.deleteEmbeddedDocuments("Combatant", combatantIds);
  }

  /**
   * Update an emitted light source associated with this Token.
   * @param {object} [options={}]
   * @param {boolean} [options.defer]      Defer updating perception to manually update it later.
   * @param {boolean} [options.deleted]    Indicate that this light source has been deleted.
   */

  /*
    updateLightSource({defer=false, deleted=false}={}) {
  
      // Prepare data
      const origin = this.#adjustedCenter;
      const sourceId = this.sourceId;
      const d = canvas.dimensions;
      const isLightSource = this.emitsLight;
  
      // Initialize a light source
      if ( isLightSource && !deleted ) {
        const lightConfig = foundry.utils.mergeObject(this.document.light.toObject(false), {
          x: origin.x,
          y: origin.y,
          elevation: this.document.elevation,
          dim: Math.clamp(this.getLightRadius(this.document.light.dim), 0, d.maxR),
          bright: Math.clamp(this.getLightRadius(this.document.light.bright), 0, d.maxR),
          externalRadius: this.externalRadius,
          z: this.document.getFlag("core", "priority"),
          seed: this.document.getFlag("core", "animationSeed"),
          rotation: this.document.rotation,
          preview: this.isPreview
        });
        this.light.initialize(lightConfig);
        canvas.effects.lightSources.set(sourceId, this.light);
      }
  
      // Remove a light source
      else deleted = canvas.effects.lightSources.delete(sourceId);
  
      // Schedule a perception update
      if ( !defer && (isLightSource || deleted) ) {
        canvas.perception.update({
          refreshLighting: true,
          refreshVision: true
        });
      }
    }
  */


}

