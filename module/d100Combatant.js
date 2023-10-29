import { d100NPCCrewStats } from "../module/modifiers/d100mod.js";
import { d100A } from "./d100Aconfig.js";
/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
 export class d100ACombatant extends Combatant {
/** @override */
//actions = {total:null,remaining:null};




// FIX THIS FOR STARSHIPS
/* -------------------------------------------- */

  /**
   * A reference to the Actor document which this Combatant represents, if any
   * @type {Actor|null}
   */
  get actor() {
    const combat = this.parent
    const isNPCCrew = this.token?.actor?.system?.crew?.useNPCCrew
    //console.log("combat",combat,combat.flags.sfrpg?.combatType,this)
    const notStarship = !(combat.flags.sfrpg?.combatType == "starship")
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