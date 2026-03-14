import { d100NPCCrewStats } from "../modifiers/d100mod.js";
import { d100A } from "../d100Aconfig.js";
import { roundToRoundB } from "../utilities.js";
/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class d100Combatant extends Combatant {

  /** @override */
  _preCreate(data, options, userId) {
    // Seed default flags early so derived-data prep and the tracker can assume they exist.
    // Do not overwrite values if they were already provided.
    const existing = foundry.utils.getProperty(data, "flags.d100A") ?? {};

    const actor = game.actors.get(data.actorId) || null;
    const apr = actor?.system?.attributes?.actchk?.apr ?? 2;
console.log("apr ", apr,data,actor)
console.log("existing ", existing)
    const update = {};

    if (foundry.utils.getProperty(existing, "actions.remaining") == null) update["flags.d100A.actions.remaining"] = apr;
    if (foundry.utils.getProperty(existing, "actions.total") == null) update["flags.d100A.actions.total"] = apr;
    if (foundry.utils.getProperty(existing, "actions.actedThisPhase") == null) update["flags.d100A.actions.actedThisPhase"] = false;

    if (foundry.utils.getProperty(existing, "isNpcCrew") == null) update["flags.d100A.isNpcCrew"] = null;

    // Ensure ordnance combatants have a crewRole for starship sub-phase gating.
    // Treat empty string as missing.
    const existingCrewRole = foundry.utils.getProperty(existing, "crewRole");
    const hasCrewRole = existingCrewRole != null && String(existingCrewRole).trim() !== "";
    const isOrdnance = actor?.type === "ordnance" || actor?.system?.type === "ordnance";
    if (isOrdnance && !hasCrewRole) update["flags.d100A.crewRole"] = "ordnance";

    if (foundry.utils.getProperty(existing, "stunned.isStunned") == null) update["flags.d100A.stunned.isStunned"] = false;
    if (foundry.utils.getProperty(existing, "stunned.stunDur") == null) update["flags.d100A.stunned.stunDur"] = 0;
    if (foundry.utils.getProperty(existing, "stunned.stunnedRound") == null) update["flags.d100A.stunned.stunnedRound"] = -1;

    if (Object.keys(update).length) this.updateSource(update);
    return super._preCreate(data, options, userId);
  }

  /* -------------------------------------------- */

  /**
   * A boolean indicator for whether the current game User has ownership rights for this Document.
   * Different Document types may have more specialized rules for what constitutes ownership.
   * @type {boolean}
   * @memberof ClientDocumentMixin#
   */
  get isOwner() {
    //  console.log(game.user,)
    return this.testUserPermission(game.user, "OWNER");



    /* -------------------------------------------- */
    /*  Methods                                     */
    /* -------------------------------------------- */

    /** @inheritdoc */
    /* testUserPermission(user, permission, {exact=false}={}) {
       if ( user.isGM ) return true;
       return this.actor?.canUserModify(user, "update") || false;
     }
   */


  }





  /**
   * 
   * @param {*} data actorId defeated flags hidden img initiative name sceneId system tokenId type : "base" _id 
   * @param {*} options modifiedTime parent : d100Combat , render : true , renderSheet : false
   * @param {*} userId 
   */

  /** @override */

  get isInitStunned() {
    const actor = this.actor;
    const actorEffects = Array.isArray(actor?.effects) ? actor.effects : [];

    const effects = actorEffects.map((c) => {
      if (c?.name?.includes?.("Knocked")) return { round: c?.duration?.startRound };
      return null;
    }).filter(Boolean);

    if (!effects[0]) return false;

    if (effects.length > 0) {
      // stunned PC's can only act on marginal round after being stunned
      const roundafter = !(this.combat.roundB == roundToRoundB(effects[0].round))
      console.log("roundafter ", roundafter)
      if ((this.combat.phase == 3) /*&& this.flags.d100A.canAct*/ /* this is for piloting*/ && roundafter) {
        console.log("here")
        return false
      }
      console.log("here")
      return true
    }
    return false
  }
  resetActions() {

    const update = foundry.utils.duplicate(this.flags)
    update.d100A.actions.remaining = value
    console.log(value, update)
    const reply = this.update({ flags: update });
    console.log("\nreply", reply)


  }

  get actionsRemaining() {
    return this.flags?.d100A?.actions?.remaining ?? 0;

  }

  set actionsRemaining(value) {
    const update = foundry.utils.duplicate(this.flags ?? {});
    foundry.utils.setProperty(update, "d100A.actions.remaining", value);
    return this.update({ flags: update });
  }

  get canAct() {
  //  console.log(this)
    if (!this.combat) return false
    const degree = this.initDegree
    const phase = this.combat.phase
    if (this.flags.d100A?.actions?.actedThisPhase) return false;
    if (degree == "") return true;
    if (phase == 0 && ["amazing"].includes(degree)) return true
    if (phase == 1 && ["amazing", "good"].includes(degree)) return true
    if (phase == 2 && ["amazing", "good", "ordinary"].includes(degree)) return true
    if (phase == 3 && ["amazing", "good", "ordinary", "marginal"].includes(degree)) return true
    return false
  }

  get initDegree() {
  //  console.log(this)
    const actionCheck = this.actor ? this.actor.system.attributes.actchk : 20
    if (this.actor?.system.type == "ordnance") return "amazing";
    if (this.initiative === null) return ""
    if (this.initiative <= actionCheck.amazing) return "amazing";
    if (this.initiative <= actionCheck.good) return "good";
    if (this.initiative <= actionCheck.ordinary) return "ordinary";
    return "marginal";
  }

  get isNpcCrew() {
    const tokenActor = this.token?.actor ?? null;
    const isNPCCrew = tokenActor?.system?.crew?.useNPCCrew;
    const crewed = tokenActor ? ["vehicle", "starship", "mount"].includes(tokenActor.type) : false;
    return Boolean(crewed && isNPCCrew);
  }

  get crewRole() {
    const flagRoleRaw = this.flags?.d100A?.crewRole;
    const flagRole = flagRoleRaw != null ? String(flagRoleRaw).trim() : "";
    if (flagRole) return flagRole;

    // Ordnance combatants may have a ship token actor; use the linked actorId to detect ordnance.
    const linkedActor = game.actors.get(this.actorId) || null;
    if (linkedActor?.type === "ordnance" || linkedActor?.system?.type === "ordnance") return "ordnance";

    // Starship crew roles are typically resolved on the ship actor via the crew assignment.
    const shipActor = this.token?.actor ?? null;
    const roleFromShip = shipActor?.findCrewJob?.(this.actorId);
    if (roleFromShip) return roleFromShip;

    // Fallback: let the represented actor resolve its own role if it can.
    return this.actor?.getCrewRoleForActor?.(this.actorId) ?? this.actor?.getCrewRoleForActor?.() ?? null;

  }

  prepareDerivedData() {
    // Check for video source and save it if present
    this._videoSrc = foundry.helpers.media.VideoHelper.hasVideoExtension(this.token?.texture.src) ? this.token.texture.src : null;

    // Assign image for combatant (undefined if the token src image is a video)
    this.img ||= (this._videoSrc ? undefined : (this.token?.texture.src || this.actor?.img));
    this.name ||= this.token?.name || this.actor?.name || game.i18n.localize("COMBAT.UnknownCombatant");

    // Combatant.updateResource expects an Actor; some combatants may be missing one during world load.
    if (this.actor) this.updateResource();





  }





  /**
     * A reference to the Actor document which this Combatant represents, if any
     * @type {Actor|null}
     */
  get actor() {
    const tokenActor = this.token?.actor ?? null;
    const actor = game.actors.get(this.actorId) || null;

    // NPC crew requires a ship token actor to synthesize a crewman.
    if (tokenActor && ["vehicle", "starship"].includes(tokenActor.type) && tokenActor?.system?.crew?.useNPCCrew) {
      return this.buildNPCCrewman();
    }

    // Starship/vehicle combat often uses the ship token to represent individual crew combatants.
    // In that case, prefer the linked Actor (crew/ordnance) over the ship token Actor.
    const tokenIsVehicleOrStarship = tokenActor && ["vehicle", "starship", "mount"].includes(tokenActor.type);
    const actorDiffersFromToken = tokenIsVehicleOrStarship && actor && tokenActor && (tokenActor.id !== actor.id);
    if (actorDiffersFromToken) return actor;

    // Prefer token actor when present, otherwise fall back to the linked Actor.
    return tokenActor ?? actor;
  }

  get apr() {
    return this.actor?.system?.attributes?.actchk?.apr ?? 1;

  }

  /**
   * This procedure builds a fake actor to act as npc crew with skills and actioncheck based on the selection of the ship
   * @returns 
   * 
   * 
   */

  //npcCrew: true, npcJob:ck, npcNo:i 
  buildNPCCrewman() {
    const ship = this.token?.actor;
    if (!ship) return null;

    const crewRoleKey = this.flags?.d100A?.crewRole ?? "openCrew";
    const npcNo = Number(this.flags?.d100A?.npcNo ?? 0);
    const crewman =
    {
      ship,
      name: `${game.i18n.localize(`SFRPG.ShipSystems.StarshipRoles.${crewRoleKey}`)}-${npcNo + 1}`,

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

      canUserModify(user, level) {
        // canUserModify(user, "update")
        return ship.canUserModify(user, level)

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
      },

      getUserLevel() {
    //    console.log(this, ship.getUserLevel())
        // return 0
        return ship.getUserLevel()
        // return 3;
      }
    }
//console.log("crewman name", this.flags.crewRole + "-" + (this.flags.npcNo + 1))
//console.log("crewman", crewman)
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


