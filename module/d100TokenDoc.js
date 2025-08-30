/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
 export class d100ATokenDoc extends TokenDocument {
/** @override */


getData() {
  let data = super.getData();
  console.log("d100ATokenDoc.getData() {\n",this,data)
  
 return data
}
   
  /**
   * Return a reference to a Combatant that represents this Token, if one is present in the current encounter.
   * This runs when the cursor is over the token
   * @type {Combatant|null}
   */
  get combatant() {
//this.displayBars 
this._source.displayBars= 50
//console.log("Hello",this)
    if (!["starship"].includes(this.actor?.type)){
      
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
/***
 * 
 * 
 * 
 * 
 */
  static async xxcreateCombatants(tokens, {combat}={}) {
console.log("dfsgsdfgsdfg",tokens)
    // Identify the target Combat encounter

    if (!(tokens[0].actor.type == "starship")) {

    combat ??= game.combats.viewed;
    if ( !combat ) {
      if ( game.user.isGM ) {
        const cls = getDocumentClass("Combat");
        combat = await cls.create({scene: canvas.scene.id, active: true}, {render: false});
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
   
    return combat.createEmbeddedDocuments("Combatant", createData);
  }
  else {

    await toggleSpaceCombat(!this.inCombat, combat, { token: this });
    // console.log("\n\nHello\n\n")
  }
  // console.log("\n\nToggmed\n",this,"\n")
  return this;
}
  

/**
   * Add or remove the currently controlled Tokens from the active combat encounter
   * @param {Combat} [combat]    A specific combat encounter to which this Token should be added
   * @returns {Promise<Token>} The Token which initiated the toggle
   */
async xxxxxtoggleCombat(state = true, combat = null, { token = null } = {}) {
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
            // console.log(ck, cv,tokena)
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


      console.log(createData)
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


}