import { d100NPCCrewStats } from "../module/modifiers/d100mod.js";
import { d100A } from "./d100Aconfig.js";
/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
 export class d100ACombatant extends Combatant {
/** @override */
//actions = {total:null,remaining:null};
/*
static metadata = Object.freeze(mergeObject(super.metadata, {
  name: "Combatant",
  collection: "combatants",
  label: "DOCUMENT.Combatant",
  labelPlural: "DOCUMENT.Combatants",
  isEmbedded: true,
  permissions: {
    //create: this.#canCreate,
    update: this.canUpdate
  }
}, {inplace: false}));

 /**
     * Is a user able to update an existing Combatant?
     * @private
     */

  /* -------------------------------------------- */

  /** @override */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

   // console.log(duplicate(this.actor))
 // console.log("data, options, userId",data, options, userId)
   
      data.flags.actions = {
        total: this.apr,
        remaining: this.apr
    },
       data.flags.delayed = null


       data.flags.degree = null, 
       data.flags.canAct = false, 
      console.log(duplicate(this))

  }
    


  



  #canUpdate(user, doc, data) {
  console.log((user, doc, data))
  //loadLauncherOrdnance.lp.lp
  return true;
  if ( user.isGM ) return true; // GM users can do anything
  if ( doc.actor && !doc.actor.canUserModify(user, "update", data) ) return false;
  const updateKeys = new Set(Object.keys(data));
  const allowedKeys = new Set(["_id", "initiative", "flags", "defeated"]);
  return updateKeys.isSubset(allowedKeys); // Players may only update initiative scores, flags, and the defeated state
}


  /** @inheritdoc */
  testUserPermission(user, permission, {exact=false}={}) {
  //  console.log(user,this.actor?.canUserModify(user, "update"))
    if ( user.isGM ) return true;
    return this.actor?.canUserModify(user, "update") || false;
  }

// FIX THIS FOR STARSHIPS
/* -------------------------------------------- */

  /**
   * A reference to the Actor document which this Combatant represents, if any
   * @type {Actor|null}
   */
  get actor() {
    const combat = this.parent
    const isNPCCrew = this.token?.actor?.system?.crew?.useNPCCrew
  //  console.log("combat",combat,combat.flags.sfrpg?.combatType,this,this.token.actor.type)
    
    const notStarship = !(combat.flags.sfrpg?.combatType == "starship")
    if (this.token.actor.type == "vehicle" ) return game.actors.get(this.actorId) || null;
    if ( this.token && notStarship) return this.token.actor;
    if(!notStarship && isNPCCrew) return this.buildNPCCrewman ()
    return game.actors.get(this.actorId) || null;
  }

  get apr() {
return this.actor.system.attributes.actchk.apr

  }

async rollInitiative(formula) {
  const roll = this.getInitiativeRoll(formula);
  await roll.evaluate({async: true});
  return this.update({initiative: roll.total});
}
//npcCrew: true, npcJob:ck, npcNo:i 
 buildNPCCrewman() {
//dsfgsfdgsdf
const crewman = {
  name:this.flags.crewRole+"-"+(this.flags.npcNo+1),
  effects:[],
 isNpcCrew : true,
  system:{
    attributes:{
      actchk: this.getnpcdata().actchk
      
    },
    skills : this.getnpcdata().skills
  },

  temporaryEffects:[],
  defeated:false,
  statuses : new Set,

  canUserModify(user){
    return true
  },

  render(force = false){
    return true
  },

  get defeated(){
    return this.defeated
  },

  getResourcesForCombatTracker() {
    const actorResources = []
    return actorResources;
  }
}

return crewman


}
getnpcdata(){
  const quality = this.token?.actor?.system?.crew?.npcCrewQuality

  let data = d100NPCCrewStats(quality)
 // console.log(data)
return data
}
   
}