import { d100NPCCrewStats } from "../../module/modifiers/d100mod.js";
import { d100A } from "../d100Aconfig.js";
/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class d100BCombatant extends Combatant {
  /**
   * 
   * @param {*} data actorId defeated flags hidden img initiative name sceneId system tokenId type : "base" _id 
   * @param {*} options modifiedTime parent : d100BCombat , render : true , renderSheet : false
   * @param {*} userId 
   */

  /** @override */

  get isInitStunned() {
    const effects = this.actor.effects.map(c => {
      if (c.name.includes("Knocked")) { return { round: c.duration.startRound, } }
    });
    console.log(effects)
    if (effects.length > 0) {
      // stunned PC's can only act on marginal round after being stunned
      const roundafter = !(this.combat.roundB == effects[0].round)
      console.log("roundafter ", roundafter)
      if ((this.combat.phase == 3) && this.flags.d100A.canAct /* this is for piloting*/ && roundafter){
        console.log("here")
        return false
      }
      console.log("here")
      return true
    }
    return false
  }

  get initDegree() {
    const actionCheck = this.actor.system.attributes.actchk
    if (this.actor.system.type == "ordnance") return "amazing";
    if (this.initiative === null) return ""
    if (this.initiative <= actionCheck.amazing) return "amazing";
    if (this.initiative <= actionCheck.good) return "good";
    if (this.initiative <= actionCheck.ordinary) return "ordinary";
    return "marginal";
  }

  prepareDerivedData() {
    // Check for video source and save it if present
    this._videoSrc = VideoHelper.hasVideoExtension(this.token?.texture.src) ? this.token.texture.src : null;

    // Assign image for combatant (undefined if the token src image is a video)
    this.img ||= (this._videoSrc ? undefined : (this.token?.texture.src || this.actor?.img));
    this.name ||= this.token?.name || this.actor?.name || game.i18n.localize("COMBAT.UnknownCombatant");

    this.updateResource();

    if (!this.flags.d100A) {
      //console.log("*******************************************************")
      this.flags = {
        d100A: {
          actions: {
            total: this.apr,
            remaining: this.apr
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



  }





  /**
     * A reference to the Actor document which this Combatant represents, if any
     * @type {Actor|null}
     */
  get actor() {
    const combat = this.parent
    const isNPCCrew = this.token?.actor?.system?.crew?.useNPCCrew  //  console.log("combat",combat,combat.flags.sfrpg?.combatType,this,this.token.actor.type)
    const crewed = ["vehicle", "starship"].includes(this.token.actor.type) //!(combat.flags.d100A?.combatType == "starship")
    if (crewed && isNPCCrew) return this.buildNPCCrewman()
    if (crewed) return game.actors.get(this.actorId) || null;
    if (this.token) return this.token.actor;

    return game.actors.get(this.actorId) || null;
  }

  get apr() {
    return this.actor.system.attributes.actchk.apr

  }

  /**
   * This procedure builds a fake actor to act as npc crew with skills and actioncheck based on the selection of the ship
   * @returns 
   * 
   * 
   */

  //npcCrew: true, npcJob:ck, npcNo:i 
  buildNPCCrewman() {

    const crewman = {
      name: this.flags.crewRole + "-" + (this.flags.npcNo + 1), // Give the dude a name
      effects: [],

      system: {
        attributes: {
          actchk: this.getnpcdata().actchk
        },
        skills: this.getnpcdata().skills
      },

      temporaryEffects: [],
      defeated: false,
      statuses: new Set,

      canUserModify(user) {
        return true
      },

      render(force = false) {
        return true
      },

      get defeated() {
        return this.defeated
      },

      getResourcesForCombatTracker() {
        const actorResources = []
        return actorResources;
      }
    }

    return crewman


  }
  /**
   * 
   * @returns the quality f the npc crew
   */

  getnpcdata() {
    const quality = this.token?.actor?.system?.crew?.npcCrewQuality

    let data = d100NPCCrewStats(quality)
    // console.log(data)
    return data
  }





}


