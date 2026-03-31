/**
 * 
 *  "styles/style.css",
    "styles/tippy.css",
    "styles/simple.css",
    "styles/attributeHud.css"
 * 
 * 
 */


/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */
import {d100AStatusEffects} from './modifiers/d100AStatusEffects.js'
// Import Modules
//import { SimpleActor } from "./actor.js";
import { d100Actor } from "./d100actor.js";
//import { SimpleItem } from "./item.js";
//import { d100Item } from "./d100item.js";
//import { SimpleItemSheet } from "./item-sheet.js";
import { d100ItemSheet } from "./d100item-sheet.js";
//import { SimpleActorSheet } from "./actor-sheet.js";
import { d100ActorSheet } from "./d100Actor-sheet.js";
import { d100ATokenHUD } from "./d100TokenHud.js"; 
import { d100ATokenDoc } from "./d100TokenDoc.js";
import { d100AToken } from "./d100Token.js";
import { d100ATokenRuler } from "./d100TokenRuler.js";

import { d100AActorSheetCharacter } from "./actor/sheet/character.js";
import { d100AActorSheetCharacterSmall} from "./actor/sheet/character-small.js";
import { d100AActorSheetNPC } from "./actor/sheet/npc.js";
import { d100AActorSheetStarship } from "./actor/sheet/starship.js";
import { d100AActorSheetVehicle } from "./actor/sheet/vehicle.js";
import { d100AActorSheetHazard } from "./actor/sheet/hazard.js";
import { d100AActorSheetDrone } from "./actor/sheet/drone.js";
import { d100AActorSheetOrdnance } from "./actor/sheet/ordnance.js";
//import templateOverrides from "../module/template-overrides.js";
//import { MeasuredTemplatePF } from "./measure.js";
import { AbilityTemplate } from "./pixi/ability-template.js";
//import { initializeBrowsers } from "../module/packs/browsers.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { createAlternityd100Macro } from "./macro.js";
import { Diced100 } from "./dice.js";
//import { RollPF , parseRollStringVariable} from "./roll.js";
import { Itemd100A } from "./item/item.js";

import { d100ASceneConfig } from "./d100ASceneConfig.js";
//import { d100ACombatantConfig } from "./combat/combatant-config.js";
import { d100AScene} from "./d100AScene.js";
import { ItemSheetd100A } from "./item/d100ItemSheet.js";
import { ItemCollectionSheet } from './apps/item-collection-sheet.js';
import { ItemDeletionDialog } from './apps/item-deletion-dialog.js';
// SFRPG config has been migrated into d100Aconfig.js
import { SFRPGModifierTypes, SFRPGModifierType, SFRPGEffectType } from "../module/modifiers/types.js";
import SFRPGModifier from "../module/modifiers/modifier.js";
import d100AModifierApplication from '../module/apps/modifier-app.js';
import { ActorMovementConfig } from '../module/apps/movement-config.js';
import { RPC } from "../module/rpc.js";

import { initializeRemoteInventory, ActorItemHelper } from "../module/actor/actor-inventory-utils.js";
import { d100A } from "./d100Aconfig.js";
import { computeCompoundBulkForItem } from "../module/actor/actor-inventory-utils.js";
import registerSystemRules from "./rules.js";
import Engine from "./engine/engine.js";
import { registerSystemSettings, applyTokenHudStatusEffectSize } from "../module/settings.js";
import { registerGameDateSettings, initializeGameDateApi, registerGameDateHooks } from "../module/calendar.js";
//import { TargetsTable } from '../lib-targeting/src/TargetsTable.js';
//import { NPCTargeting } from '../lib-targeting/src/NPCTargeting.js';
import { ActorSheetFlags } from '../module/apps/actor-flags.js';
import {
  getItemOwner,
  sizeDieExt,
  sizeReach,
  normalDie,
  getActorFromId,
  createTag,
  createTabs,
  convertWeight,
  convertWeightBack,
  convertDistance,
  getBuffTargets,
  getBuffTargetDictionary,
  binarySearch,
  sortArrayByName,
  findInCompendia,
} from "../module/lib.js";
//C0001 import { DragRuler } from "./move/d100move.js";

//window.TargetsTable = TargetsTable;
//window.NPCTargeting = NPCTargeting;
//"module/barbrawl/barbrawl.js","module/move/move.js"

/**
 * This is the entry file for the FoundryVTT module to configure resource bars.
 * @author Adrian Haberecht
 */

 //import { extendBarRenderer, redrawBar } from "./barbrawl/module/rendering.js";
 //C0002 import { extendTokenConfig } from "./barbrawl/module/config.js";
 //C0002 import { extendTokenHud } from "./barbrawl/module/hud.js";
 //import { getDefaultResources, registerSettings } from "./barbrawl/module/settings.js";
 //import { createOverrideData, prepareUpdate } from "./barbrawl/module/synchronization.js";
 //import { refreshBarVisibility } from "./barbrawl/module/api.js";



  import { d100CombatTracker } from './combat/d100combat-tracker.js'
  import { d100Combat } from "./combat/d100combat.js";
  import { d100Combatant } from "./combat/d100Combatant.js";


//  import CounterManagement from "../module/classes/counter-management.js";
//  import { d100ACombatTracker,d100BCombatTracker } from './combat/combat-tracker.js'
//  import { Combatd100A,d100BCombat } from "./combat/combat.js";
//  import { d100ACombatant,d100BCombatant } from "./d100Combatant.js";

 
 //import {
 // DragRuler
//} from "./move/move.js";



let defaultDropHandler = null;



/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", function() {
  console.log(`Initializing Alternityd100 System`,game.i18n.localize("ACTOR.TypeCharacter"));
//  CONST.USER_PERMISSIONS.TOKEN_DELETE.defaultRole = 1

  // Defensive: some legacy templates can call {{selectOptions}} with null/undefined.
  // Foundry's built-in helper throws (Object.entries(null)), which aborts sheet rendering.
  // We wrap it to return an empty string instead, and log a warning to help locate the culprit.
  try {
    const originalSelectOptions = Handlebars?.helpers?.selectOptions;
    if (originalSelectOptions && !originalSelectOptions.__alternityd100_wrapped) {
      const wrapped = function (choices, options) {
        if (choices === null || choices === undefined) {
          console.warn("Alternityd100 | selectOptions received null/undefined choices", {
            context: this,
            options
          });
          return "";
        }
        return originalSelectOptions.call(this, choices, options);
      };
      wrapped.__alternityd100_wrapped = true;
      Handlebars.registerHelper("selectOptions", wrapped);
    }
  } catch (err) {
    console.warn("Alternityd100 | Failed to wrap selectOptions helper", err);
  }

  // Battery Fire support (assignment is tracked via actor flags in `flags.Alternityd100.batteries`).
  // When the battery leader attacks, attached weapons also consume capacity/ammo.
  Hooks.on("attackRolled", async ({ actor, item }) => {
    try {
      if (!actor || !item) return;
      if (actor.type !== "starship") return;
      if ((item.type !== "starshipWeapon") && (item.system?.type !== "starshipWeapon")) return;
      if (item.system?.fireMode !== "battery") return;

      const rawBatteries = actor.getFlag?.("Alternityd100", "batteries");
      const batteries = Array.isArray(rawBatteries)
        ? rawBatteries.map(g => Array.isArray(g) ? g.filter(Boolean) : [])
        : [];

      let leaderGroup = null;
      for (const group of batteries) {
        if (!Array.isArray(group) || group.length === 0) continue;
        if (group[0] === item.id) {
          leaderGroup = group;
          break;
        }
      }

      // Only the leader consumes for the group.
      if (!leaderGroup) return;

      const memberIds = leaderGroup.slice(1);
      for (const memberId of memberIds) {
        const member = actor.items?.get?.(memberId);
        if (!member) continue;
        // Spend ammo/capacity once per member weapon.
        if (typeof member.consumeCapacity === "function") {
          await member.consumeCapacity(1);
        }
      }
    } catch (err) {
      console.warn("Alternityd100 | Battery ammo consumption failed", err);
    }
  });

  const engine =  new Engine();
//await engine.reset()


  let ctrlPressed = false;
  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  
  

  game.Alternityd100 = {
    applications: {
      // Actor Sheets
      /*ActorSheetSFRPG,
      //ActorSheetSFRPGCharacter,
      //ActorSheetSFRPGDrone,
      //ActorSheetSFRPGHazard,
     // ActorSheetSFRPGNPC,
      //ActorSheetSFRPGStarship,
      //ActorSheetSFRPGVehicle,*/
      // Item Sheets
      /*ItemCollectionSheet,
      ItemSheetd100A,      */      
      // Dialogs
      ActorMovementConfig,
      /*AddEditSkillDialog,
      ChoiceDialog,
      DroneRepairDialog,
      InputDialog,
      ItemDeletionDialog,
      RollDialog,
      NpcSkillToggleDialog,
      SpellCastDialog,
      ShortRestDialog,     */                   
      // Misc
      ActorSheetFlags,            
      d100AToken,
      d100AModifierApplication,     
     // d100ACombatantConfig       
      //TraitSelectorSFRPG
    },
    //d100Actor,
 
    d100AActorSheetCharacter,
    d100AActorSheetNPC,
    ItemSheetd100A,
    //C0001 DragRuler,
    //TokenHUD,
    ItemCollectionSheet,
    ItemDeletionDialog,
    createAlternityd100Macro,
    config: d100A,
    d100Aconfig: d100A,
    ActorMovementConfig,
    SFRPGModifier,
    SFRPGModifierType,
    SFRPGModifierTypes ,
    d100AModifierApplication  ,
    ActorSheetFlags, 
    AbilityTemplate,
    //d100ACombatantConfig,
    engine,
        // Namespace style
        Actor: {
          Damage: {
              //SFRPGHealingSetting,
              //SFRPGDamage
          },
          Modifiers: {
              SFRPGEffectType,
              SFRPGModifier,
              SFRPGModifierType,
              SFRPGModifierTypes
          },
          Sheet: {
              Base: d100ActorSheet,
              Character: d100AActorSheetCharacter,
              Npc: d100AActorSheetNPC,
              //Drone: ActorSheetSFRPGDrone,
              Starship: d100AActorSheetStarship,
              //Vehicle: ActorSheetSFRPGVehicle
          },
          Type: d100Actor
      }
  };
 
  // Define custom Entity classes
  //CONST.DEFAULT_TOKEN = "systems/Alternityd100/icons/conditions/dead_02.webp"
  //CONFIG.statusEffects[0].img = "systems/Alternityd100/icons/conditions/dead_02.webp";
  CONFIG.statusEffects = d100AStatusEffects


  CONFIG.controlIcons.defeated = "icons/svg/padlock.svg";
  CONFIG.controlIcons.doorOpen = "systems/Alternityd100/icons/items/door_02_open.webp";
  CONFIG.controlIcons.doorClosed = "systems/Alternityd100/icons/items/door_02.webp";
  CONFIG.Actor.documentClass = d100Actor;
  CONFIG.Item.documentClass = Itemd100A;
  CONFIG.Token.documentClass = d100ATokenDoc;
  CONFIG.Token.objectClass = d100AToken;
  CONFIG.Token.rulerClass = d100ATokenRuler;

  // Movement actions (v13): keep Foundry's standard actions, but define Alternity-specific behavior.
  // In particular:
  // - crawl: 25% of land speeds  -> cost multiplier 4x
  // - burrow: 10% of land speeds -> cost multiplier 10x
  try {
    const actions = CONFIG?.Token?.movement?.actions;
    if (actions?.crawl) {
      actions.crawl.getCostFunction = () => (cost) => cost * 4;
    }
    if (actions?.burrow) {
      actions.burrow.getCostFunction = () => (cost) => cost * 10;
    }

    // Limit selectable movement actions by actor type.
    // - Vehicles: drive (walk), fly, swim
    // - Starships/ordnance: none (movement action palette not needed)
    if (actions) {
      const restrictedVehicleActions = new Set(["walk", "fly", "swim"]);
      for (const [id, cfg] of Object.entries(actions)) {
        if (!cfg || cfg.__alternityd100_canSelectWrapped) continue;
        const original = typeof cfg.canSelect === "function" ? cfg.canSelect : (() => true);
        cfg.canSelect = (tokenLike) => {
          const actorType = tokenLike?.actor?.type;
          if (["starship", "ordnance"].includes(actorType)) return false;
          if (actorType === "vehicle") return restrictedVehicleActions.has(id);
          return original(tokenLike);
        };
        cfg.__alternityd100_canSelectWrapped = true;
      }
    }

    // Ensure default remains the core "walk" action.
    if (CONFIG?.Token?.movement) CONFIG.Token.movement.defaultAction = "walk";
  } catch (err) {
    console.warn("Alternityd100 | Failed to adjust CONFIG.Token.movement.actions", err);
  }

  // Combat movement (visual + status automation)
  // Only when:
  // - Token is in combat
  // - Token movement action is "walk" (land)
  // After a move completes:
  // - If moved distance exceeds walk: apply "run" status
  // - If moved distance exceeds run: apply "sprint" status
  // - Otherwise: remove run/sprint
  const _combatMoveProcessing = new Set();

  const _isTokenInCombat = (tokenDoc) => {
    const tokenObj = tokenDoc?.object;
    if (typeof tokenObj?.inCombat === "boolean") return tokenObj.inCombat;

    const combat = game?.combat;
    const combatants = combat?.combatants;
    if (!combat || !combatants) return false;
    const sceneId = tokenDoc?.parent?.id ?? canvas?.scene?.id;
    const tokenId = tokenDoc?.id;
    return combatants.some((c) => c?.sceneId === sceneId && c?.tokenId === tokenId);
  };

  const _measureTokenMoveDistance = (tokenDoc, fromPosition, toPosition) => {
    if (!tokenDoc || !fromPosition || !toPosition) return 0;

    try {
      // Prefer the token-aware v13 movement measurement API.
      const result = tokenDoc.measureMovementPath([
        {
          x: Number(fromPosition.x) || 0,
          y: Number(fromPosition.y) || 0,
          elevation: Number(fromPosition.elevation ?? tokenDoc.elevation) || 0
        },
        {
          x: Number(toPosition.x) || 0,
          y: Number(toPosition.y) || 0,
          elevation: Number(toPosition.elevation ?? tokenDoc.elevation) || 0
        }
      ]);

      const directDistance = Number(result?.distance);
      if (Number.isFinite(directDistance)) return directDistance;

      const lastWaypointDistance = Number(result?.waypoints?.at?.(-1)?.distance);
      if (Number.isFinite(lastWaypointDistance)) return lastWaypointDistance;
    } catch (err) {
      console.warn("Alternityd100 | TokenDocument.measureMovementPath failed, falling back to grid measurement", err);
    }

    try {
      const origin = tokenDoc.getCenterPoint({ x: Number(fromPosition.x) || 0, y: Number(fromPosition.y) || 0 });
      const dest = tokenDoc.getCenterPoint({ x: Number(toPosition.x) || 0, y: Number(toPosition.y) || 0 });
      const measured = canvas.grid.measurePath([origin, dest]);
      return Number(measured?.distance ?? 0);
    } catch (err) {
      console.warn("Alternityd100 | Grid measurement fallback failed", err);
    }

    return 0;
  };

  const _getMovementRouteKey = (tokenDoc) => tokenDoc?.uuid ?? `${tokenDoc?.parent?.id ?? ""}.${tokenDoc?.id ?? ""}`;

  const _getMovementHistoryDistance = (movement) => {
    const totalHistoryDistance = Number(movement?.history?.distance);
    if (Number.isFinite(totalHistoryDistance) && totalHistoryDistance > 0) return totalHistoryDistance;

    const recordedDistance = Number(movement?.history?.recorded?.distance);
    const unrecordedDistance = Number(movement?.history?.unrecorded?.distance);
    const normalizedRecordedDistance = Number.isFinite(recordedDistance) ? recordedDistance : 0;
    const normalizedUnrecordedDistance = Number.isFinite(unrecordedDistance) ? unrecordedDistance : 0;
    const combinedDistance = normalizedRecordedDistance + normalizedUnrecordedDistance;

    return combinedDistance > 0 ? combinedDistance : 0;
  };

  const _getMovedDistanceFromOperation = (tokenDoc, movement) => {
    const passedDistance = Number(movement?.passed?.distance);
    const normalizedPassedDistance = Number.isFinite(passedDistance) ? passedDistance : 0;
    const historyDistance = _getMovementHistoryDistance(movement);

    if ((historyDistance + normalizedPassedDistance) > 0) {
      return historyDistance + normalizedPassedDistance;
    }

    if (normalizedPassedDistance > 0) return normalizedPassedDistance;

    const waypoints = [];
    const origin = movement?.origin;
    if (origin) {
      waypoints.push({
        x: Number(origin.x) || 0,
        y: Number(origin.y) || 0,
        elevation: Number(origin.elevation ?? tokenDoc?.elevation) || 0
      });
    }

    for (const waypoint of movement?.passed?.waypoints ?? []) {
      waypoints.push({
        x: Number(waypoint?.x) || 0,
        y: Number(waypoint?.y) || 0,
        elevation: Number(waypoint?.elevation ?? tokenDoc?.elevation) || 0
      });
    }

    const destination = movement?.destination;
    if (destination) {
      const destinationPoint = {
        x: Number(destination.x) || 0,
        y: Number(destination.y) || 0,
        elevation: Number(destination.elevation ?? tokenDoc?.elevation) || 0
      };

      const lastWaypoint = waypoints.at(-1);
      if (!lastWaypoint || (lastWaypoint.x !== destinationPoint.x) || (lastWaypoint.y !== destinationPoint.y)
        || (Number(lastWaypoint.elevation ?? 0) !== destinationPoint.elevation)) {
        waypoints.push(destinationPoint);
      }
    }

    if (waypoints.length >= 2) {
      try {
        const result = tokenDoc.measureMovementPath(waypoints);
        const measuredDistance = Number(result?.distance);
        if (Number.isFinite(measuredDistance) && measuredDistance > 0) return measuredDistance;
      } catch (err) {
        console.warn("Alternityd100 | Failed to re-measure token movement operation", err);
      }
    }

    if (origin && destination) return _measureTokenMoveDistance(tokenDoc, origin, destination);
    return 0;
  };


  const _shouldSyncSpaceSpeedFromMove = (actorType) => {
    const setting = game?.settings?.get?.("Alternityd100", "spaceSpeedFromLastMove");
    if (setting === "both") return ["starship", "ordnance"].includes(actorType);
    if (setting === "starship") return actorType === "starship";
    if (setting === "ordnance") return actorType === "ordnance";
    return false;
  };

  Hooks.on("moveToken", async (tokenDoc, movement, _operation, user) => {
    if (!canvas?.ready) return;
    if (!tokenDoc?.actor) return;

    // Client-scoped setting: only the user whose action caused the token move should process it.
    if (user?.id && (game?.user?.id !== user.id)) return;

    const actor = tokenDoc.actor;
    const actorType = actor?.type;
    if (!actorType) return;

    const key = _getMovementRouteKey(tokenDoc);
    const remainingDistance = Number(movement?.pending?.distance ?? 0);
    if (Number.isFinite(remainingDistance) && remainingDistance > 0) return;

    const moved = _getMovedDistanceFromOperation(tokenDoc, movement);
    if (!Number.isFinite(moved) || moved <= 0) return;

    if (_shouldSyncSpaceSpeedFromMove(actorType)) {
      const currentSpeed = Number(actor.system?.attributes?.speed?.value);
      if (currentSpeed !== moved) {
        try {
          await actor.update({ ["system.attributes.speed.value"]: moved });
        } catch (err) {
          console.warn("Alternityd100 | Failed to sync space speed from last move", err);
        }
      }
    }

    // Only apply for land movement action.
    const action = tokenDoc.movementAction ?? CONFIG?.Token?.movement?.defaultAction;
    if (action !== "walk") return;

    // Only apply in combat.
    if (!_isTokenInCombat(tokenDoc)) return;

    // Avoid recursion when toggling effects.
    if (_combatMoveProcessing.has(key)) return;
    if (!actorType || ["starship", "vehicle", "ordnance", "hazard"].includes(actorType)) return;

    const speeds = actor.system?.attributes?.speed;
    const walk = Number(speeds?.walk?.value);
    const run = Number(speeds?.run?.value);
    if (!Number.isFinite(walk) || !Number.isFinite(run)) return;

    _combatMoveProcessing.add(key);
    try {
      const shouldSprint = moved > run;
      const shouldRun = (moved > walk) && !shouldSprint;
      await actor.toggleStatusEffect("run", { active: shouldRun, overlay: false });
      await actor.toggleStatusEffect("sprint", { active: shouldSprint, overlay: false });
    } catch (err) {
      console.warn("Alternityd100 | Combat movement status update failed", err);
    } finally {
      _combatMoveProcessing.delete(key);
    }
  });
 
  //CONFIG.Combatant.documentClass = d100ACombatantConfig;



  //CONFIG.MeasuredTemplate.objectClass = MeasuredTemplatePF;
  CONFIG.d100A = d100A;

  





  CONFIG.Scene.documentClass = d100AScene;
 // CONFIG.Combatant.documentClass = d100ACombatantConfig;
  //CONFIG.fontFamilies.push("serpentine");
  //CONFIG.defaultFontFamily = "serpentine";

  CONFIG.canvasTextStyle = new PIXI.TextStyle({
    fontFamily: "serpentine",
    fontSize: 36,
    fill: "#FFFFFF",
    stroke: "#111111",
    strokeTickness: 1,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: 0,
    dropShadowDistance: 0,
    align: "center",
    wordWrap: false
});



  // Register sheet application classes (v13+)
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "Alternityd100", d100AActorSheetCharacter, { types: ["character"], makeDefault: true });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "Alternityd100", d100AActorSheetCharacterSmall, { types: ["character"], makeDefault: false });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "Alternityd100", d100AActorSheetStarship, { types: ["starship"], makeDefault: true });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "Alternityd100", d100AActorSheetVehicle, { types: ["vehicle"], makeDefault: true });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "Alternityd100", d100AActorSheetDrone, { types: ["drone"], makeDefault: true });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "Alternityd100", d100AActorSheetHazard, { types: ["hazard"], makeDefault: true });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "Alternityd100", d100AActorSheetOrdnance, { types: ["ordnance"], makeDefault: true });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "Alternityd100", d100AActorSheetNPC, { types: ["npc"], makeDefault: false });
  //Actors.registerSheet("sfrpg", d100AActorSheetStarship,  { types: ["starship"],  makeDefault: true });
  //Actors.registerSheet("sfrpg", ActorSheetSFRPGVehicle,   { types: ["vehicle"],   makeDefault: true });
  // Register per-type item sheets so each Item type uses its matching template.
  // Foundry v13 expects part templates to be string paths (not functions), so we generate a small subclass per type.
  const makeTypedItemSheet = (template) => class extends ItemSheetd100A {
    static PARTS = { form: { template } };
  };

  const itemTypes = [
    "achievement",
    "ammunition",
    "equipment",
    "clothing",
    "communication",
    "computer",
    "container",
    "augmentation",
    "feat",
    "flaw",
    "medical",
    "miscellaneous",
    "perk",
    "pharmaceutical",
    "profession",
    "professional",
    "psionic",
    "race",
    "sensor",
    "shield",
    "survival",
    "technological",
    "weapon",
    "vehicleAttack",
    "vehicleSystem",
    "starshipAblativeArmor",
    "starshipAction",
    "starshipArmor",
    "starshipCommunications",
    "starshipComputer",
    "starshipCrewQuarter",
    "starshipDefence",
    "starshipElectronicCountermeasure",
    "starshipEngine",
    "starshipFrame",
    "starshipOrdnance",
    "starshipOtherSystem",
    "starshipPowerCore",
    "starshipSensor",
    "starshipShield",
    "starshipSystemDamage",
    "starshipWeapon",
    "goods",
    "magic",
    "starshipExpansionBay",
    "starshipFortifiedHull",
    "starshipReinforcedBulkhead",
    "starshipSecuritySystem",
    "ordnancePropulsion",
    "ordnanceWarhead",
    "ordnanceGuidance"
  ];

  for (const type of itemTypes) {
    const template = `systems/Alternityd100/templates/items/${type}.html`;
    foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "Alternityd100", makeTypedItemSheet(template), {
      types: [type],
      makeDefault: true
    });
  }

  // Fallback sheet: uses templates/items/generic.html
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "Alternityd100", ItemSheetd100A, { makeDefault: false });
  //TokenHUD.registerSheet("Alternityd100", d100Hud,       { types: ["TokenHUD"],       makeDefault: true });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Scene, "Alternityd100", d100ASceneConfig, { makeDefault: true });
 // Combatant.registerSheet("Alternityd100", d100ACombatantConfig , { makeDefault: true });

registerSystemRules(game.Alternityd100.engine);
registerSystemSettings();
registerGameDateSettings();
initializeGameDateApi();
registerGameDateHooks();
applyTokenHudStatusEffectSize();

const combatType = game.settings.get("Alternityd100", "combatType");

//if (combatType == "original")  { 
//  CONFIG.Combatant.documentClass = d100ACombatant;
//  CONFIG.ui.combat = d100ACombatTracker;
//  CONFIG.Combat.documentClass = Combatd100A;
//}

// if (combatType == "new") {
  
  CONFIG.Combatant.documentClass = d100Combatant;
  CONFIG.ui.combat = d100CombatTracker;
  CONFIG.Combat.documentClass = d100Combat;
//}


  //game.settings.get("sfrpg", "sfrpgTheme")
if (true) {
    //   const logo = document.querySelector("#logo");
   //    logo.src = "systems/Alternityd100/images/VTTlogo.png";
    //   logo.style.width = "120px";
    //   logo.style.height = "43px";
   //    logo.style.margin = "0 0 0 9px";
       let r = document.querySelector(':root');
       r.style.setProperty("--color-border-highlight-alt", "#0EAAAA");  // #0080ff
       r.style.setProperty("--color-border-highlight", "#0EAAAA");   // #0EAAAA #00a0ff
       r.style.setProperty("--color-text-hyperlink", "#38b5ff");  //
       r.style.setProperty("--color-shadow-primary", "#0EAAAA");//#00a0ff
       r.style.setProperty("--color-shadow-highlight", "#0EAAAA");  //#00a0ff
       r.style.setProperty("--sfrpg-theme-blue", "#235683");

       // Foundry UI sizing: make the hotbar slots/buttons smaller.
       // Important: Foundry defines --hotbar-size on #hotbar, so setting it on :root will NOT override it.
       // We inject a CSS rule which targets #hotbar directly.
       const HOTBAR_SIZE_PX = "40px";
       const styleId = "alternityd100-hotbar-size";
       if (!document.getElementById(styleId)) {
         const style = document.createElement("style");
         style.id = styleId;
         style.textContent = `#hotbar { --hotbar-size: ${HOTBAR_SIZE_PX}; }`;
         document.head?.appendChild(style);
       }

       // Fallback: ensure the rendered hotbar element has the property too.
       Hooks.on("renderHotbar", (_app, html) => {
         const element = html?.[0] ?? html;
         element?.style?.setProperty("--hotbar-size", HOTBAR_SIZE_PX);
       });
   }
   console.log("Starfinder | [INIT] Registering sheets");


  // Register system settings
  game.settings.register("Alternityd100", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register("Alternityd100", "debug", {
    name: "Debug Mode",
    hint: "Debug Mode",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });




  // Register initiative setting.
  game.settings.register("Alternityd100", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "1d20",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Retrieve and assign the initiative formula setting.
  const initFormula = game.settings.get("Alternityd100", "initFormula");
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula.
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post nofications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    const isValid = Roll.validate(formula);
    if ( !isValid ) {
      if ( notify ) ui.notifications.error(`${game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid")}: ${formula}`);
      return;
    }
    CONFIG.Combat.initiative.formula = formula;
  }

  // Initialize chat command and inline-roll handlers (hook-based)
  setupChatHooks();
  setupInlineRollHooks();



  /**
   * Slugify a string.
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });

  Handlebars.registerHelper('evaluate', function(value) {
    console.log(value)

    // crewMember = await game.Alternityd100.getActorFromUuid(i.uuid);
    const actor = game.actors.get(value.container.actorId);

    let computedBonus = 0;
    let roll = null
    try {
        roll = Roll.create(value.modifier.toString(),actor.system).evaluateSync({maximize: true});
     computedBonus = roll.total;
    } catch {}

    console.log(computedBonus,roll)
    return computedBonus
  });

  // Preload template partials
  preloadHandlebarsTemplates();
  //canvas.controdragRuler = new DragRuler();
  
  //DragRuler.init;
  //console.log('barbrawl | Initializing barbrawl');

 /*
  registerSettings();
  Handlebars.registerHelper("barbrawl-concat", function () {
      let output = "";
      for (let input of arguments) {
          if (typeof input !== "object") output += input;
      }
      return output;
  });
*/

//console.log("---------THIS LOADS----------")
  //let a = loadTemplates(["systems/Alternityd100/module/barbrawl/templates/bar-config-minimal.hbs", "systems/Alternityd100/module/barbrawl/templates/bar-config.hbs"]);
//    console.log("---------THIS LOADS----------",a)


});

/** Hooks to replace UI elements. */
//Hooks.once("setup", extendBarRenderer);


Hooks.once("setup", function () {



  //extendBarRenderer;
    //console.log(`Alternity by d100  | [SETUP] Setting up Alternity by d100  System subsystems`);
    //console.log("d100A",CONFIG.d100A)


    console.log("Alternity by d100  | [SETUP] Initializing counter management");
/*
    const combatType = game.settings.get("Alternityd100", "combatType");
    if (combatType == "original")  { 
  */
 //  const counterManagement = new CounterManagement();
 //     counterManagement.setup();
    
  




    console.log("Alternity by d100  | [SETUP] Initializing RPC system");
    RPC.initialize();

    console.log("Alternity by d100  | [SETUP] Initializing remote inventory system");
    initializeRemoteInventory();

    console.log("Alternity by d100  | [SETUP] Localizing global arrays");
        const toLocalize = [
          // "abilities",
             "alignments", "ammunitionTypes", "distanceUnits", "senses", "skills", "currencies", "saves",
            "augmentationTypes", "augmentationSytems", "itemActionTypes", "actorSizes", "starshipSizes",
            "vehicleSizes", "babProgression", "saveProgression", "saveDescriptors", "armorProficiencies",
            "weaponProficiencies", "abilityActivationTypes", "skillProficiencyLevels", "damageTypes",
            "healingTypes", "spellPreparationModes", "limitedUsePeriods", "weaponCategories",
            "weaponProperties", "weaponPropertiesTooltips", "spellAreaShapes", "weaponDamageTypes", "energyDamageTypes", "kineticDamageTypes",
            "languages",  "modifierTypes",  "modifierType", "acpEffectingArmorType",
            "modifierArmorClassAffectedValues", "capacityUsagePer", "spellLevels", "armorTypes", "spellAreaEffects",
            "weaponSpecial", "weaponCriticalHitEffects", "featTypes", "allowedClasses", "consumableTypes", "maneuverability", "toughness",
            "starshipWeaponTypes", "starshipWeaponClass", "starshipWeaponProperties", "starshipArcs", "starshipWeaponRanges",
            "starshipRoles", "starshipRoleNames", "vehicleTypes", "vehicleCoverTypes", "containableTypes", "starshipSystemStatus", "speeds",
            "damageTypeOperators", "flightManeuverability", "npcCrewQualities"
        ];
    
        const d100toLocalize = ["abilities","conditionTypes", "weaponTypes","progressLevel","pubnsource","availability","skills","damagetype", "firepower", "damageQ","psionAbility",/*"starshipSensorModes","starshipSensorTypes",*/
        "modifierEffectTypes","modifierHitPointsAffectedValues","feature","mountTypes","ordnanceTypes","starshipFirepower","starshipFirepowerDial", "modifierResistanceAffectedValues" ,"coverType","movementType", "dodgeType" ];

        const allToLocalize = [...new Set([...toLocalize, ...d100toLocalize])];

        for (const o of allToLocalize) {
          const source = CONFIG.d100A?.[o];
          if (!source) continue;

          CONFIG.d100A[o] = Object.entries(source).reduce((obj, e) => {
            obj[e[0]] = game.i18n.localize(e[1]);
            return obj;
          }, {});
        }
    
    
  //console.log(  //"_getItemProperties",props,
        //  "labels", labels,  
         // "Itemdata" ,itemData,
         // "Item" , item,  
           // "CONFIG-NEW", CONFIG.d100A.weaponProperties, 
         // "Object Ent", Object.entries(itemData.properties),
          //  "AEON" ,CONFIG.d100A.weaponPropertiesAeon
  //      )
    
        console.log("Alternity by d100  | [SETUP] Configuring rules engine");
      

        console.log("d100Alternity | [SETUP] Registering custom handlebars");
        setupHandlebars();

      





});

Hooks.once("dragRuler.ready", (SpeedProvider) => {
  class d100AAlternitySpeedProvider extends SpeedProvider {
      get colors() {
          return [
              {id: "walk", default: 0x00FF00, name: "sfrpg.speeds.walk"},
              {id: "dash", default: 0xFFFF00, name: "sfrpg.speeds.dash"},
              {id: "run", default: 0xFF8000, name: "sfrpg.speeds.run"},

          ]
      }

      getRanges(token) {
          const actorType = token.actor.type;

          if (actorType === "hazard") {
              return [];
          }

          if ( ["starship","ordnance"].includes(actorType)) {
            const driveSpeed = parseFloat(token.actor.system.attributes.speed.value);
            const accel = parseFloat(token.actor.system.attributes.accel.value);
            return [
                {range: driveSpeed-accel, color: "unreachable"},
                {range: driveSpeed+accel, color: "walk"},
               
            ];
          }

          if (actorType === "vehicle") {
            
              const driveSpeed = parseFloat(token.actor.system.attributes.speed.value);
              const accel = parseFloat(token.actor.system.attributes.accel.value);
              return [
                  {range: driveSpeed-accel, color: "unreachable"},
                  {range: driveSpeed+accel, color: "walk"},
                 
              ];
          }

          const mainMovement = token.actor.system.attributes.speed.mainMovement ?? "land";
        //  const baseSpeed = token.actor.system.attributes.speed[mainMovement].value;
        const statuses = token.actor.statuses
          if(statuses.has("swim") || statuses.has("eswim") ){
            return [
            {range: token.actor.system.attributes.speed.easyswim.value, color: "walk"},
            {range: token.actor.system.attributes.speed.swim.value, color: "run"}
            ]
          }
          if(statuses.has("flying") || statuses.has("glide") ){
            return [
              {range: token.actor.system.attributes.speed.glide.value, color: "walk"},
              {range: token.actor.system.attributes.speed.fly.value, color: "run"}
              ]

          }
          return [
              {range: token.actor.system.attributes.speed.walk.value, color: "walk"},
              {range: token.actor.system.attributes.speed.run.value, color: "dash"},
              {range: token.actor.system.attributes.speed.sprint.value, color: "run"}
          ];
      }
  }
  console.log("baseSpeed------")
  dragRuler.registerSystem("Alternityd100", d100AAlternitySpeedProvider);
})


Hooks.once("ready", () => {
    console.log(`Alternity by d100  | [READY] Preparing system for operation`);
  applyTokenHudStatusEffectSize();
    const readyTime = (new Date()).getTime();

    console.log("Alternity by d100  | [READY] Overriding canvas drop handler");
  //  if (canvas.initialized) {
  //      defaultDropHandler = canvas.dragDrop.callbacks.drop;
  //      canvas._dragDrop.callbacks.drop = handleOnDrop.bind(canvas);
  //  }

    console.log("Alternity by d100  | [READY] Setting up AOE template overrides");
    //templateOverrides();
    
    console.log("Alternity by d100  | [READY] Overriding token HUD");
    canvas.hud.token = new d100ATokenHUD();
    
    //TokenHUD.template

    console.log("Alternity by d100  | [READY] Preloading handlebar templates");
    preloadHandlebarsTemplates();

    console.log("Alternity by d100  | [READY] Caching starship actions");
    
    // Loads the database packs (.db) from SFRPG
    d100AActorSheetStarship.ensureStarshipActions();
    d100AActorSheetStarship.loadStarshipSystemDamage()

    if (game.user.isGM) {
     // const currentSchema = game.settings.get('Alternityd100', 'worldSchemaVersion') ?? 0;
      // const systemSchema = Number(game.system.data.flags.Alternityd100.schema);
      // const needsMigration = currentSchema < systemSchema || currentSchema === 0;
    /*
        if (needsMigration) {
            console.log("Alternity by d100  | [READY] Performing world migration");
            migrateWorld()
                .then(_ => ui.notifications.info(game.i18n.localize("SFRPG.MigrationSuccessfulMessage")))
                .catch(_ => ui.notifications.error(game.i18n.localize("SFRPG.MigrationErrorMessage")));
        }
    
        console.log("Alternity by d100  | [READY] Checking items for migration");
        migrateOldContainers();
    */
      }

    console.log("Alternity by d100  | [READY] Initializing compendium browsers");
    //initializeBrowsers();

    const finishTime = (new Date()).getTime();
    console.log(`Alternity by d100 | [READY] Done (operation took ${finishTime - readyTime} ms)`);
    //token
/**
 * Retreives all resource bars of the given token document.
 * @param {TokenDocument} tokenDoc The token document to fetch the bars from.
 * @returns {Object[]} An array of bar data.
 */
// export 
// const getBars = function (tokenDoc) {

  //  console.log("HELLO ",foundry.utils)
 //   stop()
  //    const resourceBars = foundry.utils.getProperty(tokenDoc.data, "flags.barbrawl.resourceBars") ?? {};
   //   const barArray = Object.values(resourceBars);
    
   //   if (tokenDoc.data.bar1?.attribute && !resourceBars.bar1)
    //      barArray.push(getDefaultBar("bar1", tokenDoc.data.bar1.attribute));
 //     if (tokenDoc.data.bar2?.attribute && !resourceBars.bar2)
   //       barArray.push(getDefaultBar("bar2", tokenDoc.data.bar2.attribute));
    
      //return barArray.sort((b1, b2) => (b1.order ?? 0) - (b2.order ?? 0));
   // }
    //const startupDuration = finishTime - initTime;
    //console.log(`Alternity by d100  | [STARTUP] Total launch took ${Number(startupDuration / 1000).toFixed(2)} seconds.`);
    // setupstuff();

    if (game.i18n.lang === "ja" && !game.modules.get("foundryVTTja")?.active) {
      const message = "Bar Brawl | " + game.i18n.localize("barbrawl.localization-moved");
      ui.notifications.warn(message);
      console.warn(message);


  }

//  for (let actor of game.actors.contents){
//    console.log(actor.id)
//    let a = actor.system
//    actor.update({"system.health.min":1})
//    actor.processItemData()
//  }



});


 function migrateOldContainers() {
    const promises = [];
    for (const actor of game.actors.contents) {
        const sheetActorHelper = new ActorItemHelper(actor.id, null, null);
        const migrationProcess = sheetActorHelper.migrateItems();
        if (migrationProcess) {
            promises.push(migrationProcess);
        }
    }

    for (const scene of game.scenes.contents) {
        for (const token of scene.tokens) {
            const sheetActorHelper = new ActorItemHelper(token.actorId, token.id, scene.id);
            const migrationProcess = sheetActorHelper.migrateItems();
            if (migrationProcess) {
                promises.push(migrationProcess);
            }
        }
    }

    if (promises.length > 0) {
        console.log(`Alternity by d100  | [READY] Migrating ${promises.length} documents.`);
        return Promise.all(promises);
    }
}

export function handleOnDrop(event) {
    event.preventDefault();
    console.log(`Alternity by d100  | itemdrop`);
	let data = null;
	try {
		data = JSON.parse(event.dataTransfer.getData('text/plain'));
	} catch (err) {
    console.log("error", event, data)
    console.log(   defaultDropHandler(event));
		return false;
    }
    console.log("not error", event, data)
    // We're only interested in overriding item drops.
    if (!data || (data.type !== "Item" && data.type !== "ItemCollection")) {

      console.log(`Alternity by d100  | itemdrop`);
        return defaultDropHandler(event);
    }

    // Transform the cursor position to canvas space
	const [x, y] = [event.clientX, event.clientY];
	const t = this.stage.worldTransform;
	data.x = (x - t.tx) / canvas.stage.scale.x;
    data.y = (y - t.ty) / canvas.stage.scale.y;

    data.x -= Math.floor(canvas.grid.size / 2);
    data.y -= Math.floor(canvas.grid.size / 2);

    if (!event.shiftKey) {
        const point = canvas.grid.getSnappedPosition(data.x, data.y, canvas.activeLayer.gridPrecision);
        data.x = point.x;
        data.y = point.y;
    }

    if (data.type === "Item") {
        return handleItemDropCanvas(data);
    }
    return false;
}


Hooks.on("endTurnUpdate",(combat) => {
  console.log("\n A", combat)
            for (let c of combat.combatants) {
                console.log(c)
                c.token.actor.sheet._onApplyPendingDamage()
            }
  return false
}
);


Hooks.on("combatTurn",(combat, updateData, updateOptions) => {
//  console.log("\n A", combat, updateData, updateOptions)

  combat.update(updateData, updateOptions);
          //  for (let c of combat.combatants) {
           //     console.log(c)
           //     c.token.actor.sheet._onApplyPendingDamage()
           // }
  return false
}
);

/**
 * Macrobar hook.
 */
Hooks.on("hotbarDrop",(bar, data, slot) => {

  console.log("\n A", bar, data, slot)
  let a = createAlternityd100Macro(data, slot)
  
  return false

}
  
 
 
 );
/*
  Hooks.on("hotbarDrop",((e,t,o)=>{
    if("Item"===t.type)return async function(e,t){const o=await Item.fromDropData(e),r=`game.sfrpg.rollItemMacro("${o.name}");`;
      let i=game.macros.contents.find((e=>e.name===o.name&&e.command===r));
      i||(i=await Macro.create({
        name:o.name,
        type:"script",
        img:o.img,
        command:r,
        flags:{"sfrpg.itemMacro":!0}},
        {displaySheet:!1}));
        game.user.assignHotbarMacro(i,t)}(t,o),!1}))

*/
//Hooks.on("renderChatLog", (app, html, data) => Itemd100A.chatListeners(html));
// v13+: renderChatMessage is deprecated in favor of renderChatMessageHTML (HTMLElement).
Hooks.on("renderChatMessageHTML", (_message, html) => Itemd100A.chatListeners($(html)));
//Hooks.on("renderChatMessage", (_, html) => d100ActorSheet.chatListeners(html)); 
//Hooks.on("renderChatMessage", (app, html, data) => Itemd100A.chatListeners(html));

/**
 * Adds the actor template context menu.
 * I disabled this as it couldn't find the right data - not sure if we need the Template entry.
 */
Hooks.on("getActorDirectoryEntryContext", (html, options) => {
  // Define an actor as a template.
  return
  console.log("game--------------------",game,options)
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("entityId"));
     console.log("Actor", actor,li)
      return !actor.getFlag("sfrpg", "isTemplate");
    },
    callback: li => {
      const actor = game.actors.get(li.data("entityId"));
      actor.setFlag("sfrpg", "isTemplate", true);
    }
  });

  // Undefine an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      
        const actor = game.actors.get(li.data("entityId"));
      return actor.getFlag("sfrpg", "isTemplate");
    },
    callback: li => {
      const actor = game.actors.get(li.data("entityId"));
      actor.setFlag("sfrpg", "isTemplate", false);
    }
  });
});

/**
 * Adds the item template context menu.
 * I disabled this as it couldn't find the right data - not sure if we need the Template entry.
 */
Hooks.on("getItemDirectoryEntryContext", (html, options) => {
  // Define an item as a template.
  return
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const item = game.items.get(li.data("entityId"));
      return !item.getFlag("Alternityd100", "isTemplate");
    },
    callback: li => {
      const item = game.items.get(li.data("entityId"));
      item.setFlag("Alternityd100", "isTemplate", true);
    }
  });

  // Undefine an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const item = game.items.get(li.data("entityId"));
      return item.getFlag("Alternityd100", "isTemplate");
    },
    callback: li => {
      const item = game.items.get(li.data("entityId"));
      item.setFlag("Alternityd100", "isTemplate", false);
    }
  });
});


//C0002 Hooks.on("renderTokenHUD", extendTokenHud);
//C0002 Hooks.on("renderTokenConfig", extendTokenConfig);
/*
Hooks.on('canvasReady', ()=>{
	canvas.controls.dragRulers = null;
 	canvas.controls._dragRulers = {};
 	canvas.controls.drawDragRulers();
})
Hooks.on('updateUser', (user,data,diff, id)=>{
	canvas.controls.getDragRulerForUser(data._id).color = colorStringToHex(data.color);
})
*/

/** Hook to apply changes to the prototype token. */
/*
Hooks.on("preUpdateActor", function (actor, newData) {
  console.log("actor, newData",actor, newData)
  if (!hasProperty(newData, "prototypeToken.flags.barbrawl.resourceBars")) return;
  prepareUpdate(actor.prototypeToken, newData.prototypeToken);
});
*/


/** Hook to update bars. */

/*
Hooks.on("updateToken", function (doc, changes) {
  const token = doc.object;
  
  if (!token) return;

  if ("bar1" in changes || "bar2" in changes) {
      if (token.hasActiveHUD) canvas.tokens.hud.render();
      return;
  }

  if (!hasProperty(changes, "flags.barbrawl.resourceBars")) return;

  // Check if only one bar value was changed (not added or removed)
  let changedBars = changes.flags.barbrawl.resourceBars;
  let changedBarIds = Object.keys(changedBars);
  if (changedBarIds.length === 1 && !changedBarIds.some(id => id.startsWith("-="))) {
      let changedData = changedBars[changedBarIds[0]];
      if (!(["position", "id", "max", "indentLeft", "indentRight", "bgImage", "fgImage",
          "ownerVisibility", "otherVisibility"].some(prop => prop in changedData))) {
          const barData = doc.flags.barbrawl.resourceBars[changedBarIds[0]];
          console.log("barData  ",barData, doc.flags.barbrawl.resourceBars)
          if (barData.attribute !== "custom") {
              const resource = doc.getBarAttribute(null, { alternative: barData.attribute });
              if (!resource || (resource.type !== "bar" && !barData.max)) return;
              else barData.value = resource.value;
          } else if (!barData.max) {
              return;
          }

          redrawBar(token, barData);

          // Update HUD
          if (token.hasActiveHUD && changedData.value) {
              let valueInput = canvas.tokens.hud._element
                  .find(`input[name='flags.barbrawl.resourceBars.${changedBarIds[0]}.value']`);
              if (valueInput) valueInput.val(changedData.value);
          }
          return;
      }
  }

  // Otherwise, completely redraw all bars
  token.drawBars();
  if (token.hasActiveHUD) canvas.tokens.hud.render();
});
*/
/** Hooks to initialize tokens and actors with default bars. */
/*
Hooks.on("preCreateToken", function (doc, data) {
  // Always make the bar container visible.
  console.log("preCreateToken",doc, data,CONST.TOKEN_DISPLAY_MODES.ALWAYS)

  doc.update({ displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS });

  const actor = game.actors.get(data.actorId);

  console.log("preCreateToken1",actor,hasProperty(actor, "token.flags.barbrawl.resourceBars"))
  if (!actor || hasProperty(actor, "token.flags.barbrawl.resourceBars")) return; // Don't override prototype.
  
  const barConfig = getDefaultResources(actor.type);
  if (!barConfig) return;
  doc.update(createOverrideData(barConfig));
  console.log("preCreateToken2")
});
*/
/*
Hooks.on("preCreateActor", function (doc) {
  console.log("preCreateActor")
  if (!doc.token || foundry.utils.hasProperty(doc.token, "flags.barbrawl.resourceBars")) return;

  const barConfig = getDefaultResources(doc.type);
  if (!barConfig) return;
  doc.updateSource(createOverrideData(barConfig, true));
});
*/
const FLIPPED_TOKEN_TYPES = new Set(["ordnance", "vehicle", "starship"]);

Hooks.on("preCreateToken", function (doc, data) {
  const actor = doc.actor ?? game.actors?.get(data?.actorId) ?? null;
  const actorType = actor?.type ?? data?.actorLink?.type ?? null;
  if (!FLIPPED_TOKEN_TYPES.has(actorType)) return;

  const currentScaleY = Number(
    foundry.utils.getProperty(data, "texture.scaleY")
      ?? foundry.utils.getProperty(doc, "texture.scaleY")
      ?? 1
  ) || 1;

  doc.updateSource({
    texture: {
      scaleY: -Math.abs(currentScaleY)
    }
  });
});

/** Hook to update bar visibility. */
//Hooks.on("hoverToken", refreshBarVisibility);
//Hooks.on("controlToken", refreshBarVisibility);

//C0001 Hooks.on('init', DragRuler.init);



export { RollPF } from "./roll.js";
export { ChatAttack } from "./misc/chat-attack.js";

/**
 * Create a Macro form an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * 
 * @param {Object} item The item data
 * @param {number} slot The hotbar slot to use
 * @returns {Promise}
 */
 async function createItemMacro(item, slot) {
  const command = `game.sfrpg.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command,
      flags: { "sfrpg.itemMacro": true }
    }, { displaySheet: false });
  }
  game.user.assignHotbarMacro(macro, slot);
}

function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;

  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  if (item.system.type === 'spell') return actor.useSpell(item);
  return item.roll();
}

function setupHandlebars() {
  Handlebars.registerHelper("length", function (value) {
      if (value instanceof Array) {
          return value.length;
      } else if (value instanceof Object) {
          return Object.entries(value).length;
      }
      return 0;
  });

  Handlebars.registerHelper("not", function (value) {
      return !Boolean(value);
  });

  Handlebars.registerHelper("add", function (v1, v2, options) {
      'use strict';
      return v1 + v2;
  });

  Handlebars.registerHelper("sub", function (v1, v2, options) {
      'use strict';
      return v1 - v2;
  });

  Handlebars.registerHelper("mult", function (v1, v2, options) {
      'use strict';
      return v1 * v2;
  });

  Handlebars.registerHelper("div", function (v1, v2, options) {
      'use strict';
      return v1 / v2;
  });

  Handlebars.registerHelper("isNull", function (value) {
      if (value === 0) return false;
      return !Boolean(value);
  });

  Handlebars.registerHelper('greaterThan', function (v1, v2, options) {
      'use strict';
      if (v1 > v2) {
          return true;
      }
      return false;
  });

  Handlebars.registerHelper('ellipsis', function (displayedValue, limit) {
      let str = displayedValue.toString();
      //console.log("------ELLIPSIS-----" , str);
      if (str.length <= limit) {
          return str;
      }
      return str.substring(0, limit) + '…';
  });

  Handlebars.registerHelper('getChildBulk', function (children) {
      const bulk = computeCompoundBulkForItem(null, children);
      const reduced = bulk / 10;
      if (reduced < 0.1) {
          return "-";
      } else if (reduced < 1) {
          return "L";
      } else return Math.floor(reduced);
  });

  Handlebars.registerHelper('getTotalStorageCapacity', function (item) {
      let totalCapacity = 0;
      if (item?.system?.container?.storage && item.system.container.storage.length > 0) {
          for (let storage of item.system.container.storage) {
              totalCapacity += storage.amount;
          }
      }
      return totalCapacity;
  });

  Handlebars.registerHelper('getStarfinderBoolean', function (settingName) {
 //     console.log("settingName",settingName);
      return game.settings.get('Alternityd100', settingName);
  });

  Handlebars.registerHelper('capitalize', function (value) {
    if (value === 0) return value;
      return value?.capitalize();
  });

  Handlebars.registerHelper('contains', function (container, value) {
      if (!container || !value) return false;

      if (container instanceof Array) {
          return container.includes(value);
      }

      if (container instanceof Object) {
          return container.hasOwnProperty(value);
      }

      return false;
  });

  Handlebars.registerHelper('console', function (value) {
      
    if (game.settings.get("Alternityd100", "debug")) console.log(value);
  });

  Handlebars.registerHelper('indexOf', function (array, value, zeroBased = true) {
      const index = array.indexOf(value);
      if (index < 0) return index;
      return index + (zeroBased ? 0 : 1);
  });

  Handlebars.registerHelper('append', function (left, right) {
      return left + right;
  });

  /** Returns null if 0 is entered. */
  Handlebars.registerHelper('modToScoreRange', function (value) {
      const score = 10 + value * 2;
      return `${score}-${score+1}`;
  });

  /** Returns null if 0 is entered. */
  Handlebars.registerHelper('nullOrNonZero', function (value) {
      if (value === 0) return null;
      return value;
  });

  /** Returns the value based on whether left is null or not. */
  Handlebars.registerHelper('leftOrRight', function (left, right) {
      return left || right;
  });

  Handlebars.registerHelper('editorPlus', function (options) {
      const target = options.hash['target'];
      if ( !target ) throw new Error("You must define the name of a target field.");
  
      // Enrich the content
      const isOwner = Boolean(options.hash['isOwner']);
      const rolls = Boolean(options.hash['rolls']);
      const rollData = options.hash['rollData'];
      const content = TextEditor.enrichHTML(options.hash['content'] || "", {secrets: isOwner, documents: true, rolls: rolls, rollData: rollData});
      
      
      const maxSize = Boolean(options.hash['maxSize']) ? ` style="flex: 1;"` : "";
  
      // Construct the HTML
      let editor = $(`<div class="editor flexcol"${maxSize}><div class="editor-content"${maxSize} data-edit="${target}">${content}</div></div>`);
  
      // Append edit button
      const button = Boolean(options.hash['button']);
      const editable = Boolean(options.hash['editable']);
      if ( button && editable ) editor.append($('<a class="editor-edit"><i class="fas fa-edit"></i></a>'));
      return new Handlebars.SafeString(editor[0].outerHTML);
  });
/*
  Handlebars.registerHelper('createTippy', function (options) {
    
      const title = options.hash['title'];
      const subtitle = options.hash['subtitle'];
      const attributes = options.hash['attributes'];
      const tooltips = options.hash['tooltips'];
      if ( !title ) {
  //console.log(options)
          console.trace();
          throw new Error(game.i18n.localize("Alternityd100.Tippy.ErrorNoTitle"));
      }

      let html = "data-tippy-content=\"<strong>" + game.i18n.localize(title) + "</strong>";
      if (subtitle) {
          html += "<br/>" + game.i18n.localize(subtitle);
      }
      if (attributes) {
          const printableAttributes = [];
          if (attributes instanceof Array) {
              for(const attrib of attributes) {
                  printableAttributes.push(attrib);
              }
          } else if (attributes instanceof Object) {
              for (const key of Object.keys(attributes)) {
                  printableAttributes.push(key);
              }
          } else {
              printableAttributes.push(attributes);
          }
          if (printableAttributes.length > 0) {
              html += "<br/><br/>" + game.i18n.localize("Alternityd100.Tippy.Attributes");
              for (const attrib of printableAttributes) {
                  html += "<br/>" + attrib;
              }
          }
      }
      if (tooltips) {
          const printabletooltips = [];
          if (tooltips instanceof Array) {
              for(const tooltip of tooltips) {
                  printabletooltips.push(tooltip);
              }
          } else {
              printabletooltips.push(tooltips);
          }
          if (printabletooltips.length > 0) {
              html += "<br/>";
              for (const attrib of printabletooltips) {
                  html += "<br/>" + attrib;
              }
          }
      }

      html += "\"";

      return new Handlebars.SafeString(html);
  });
  */
  Handlebars.registerHelper("json-string", (e2) => new Handlebars.SafeString(escape(JSON.stringify(e2))))
  
  Handlebars.registerHelper("enrich", (content, options) => {
    const owner = Boolean(options.hash["owner"]);
    const rollData = options.hash["rollData"];
    const html = TextEditor.enrichHTML(content || "", { documents: true, rolls: true, secrets: owner, rollData });
    return new Handlebars.SafeString(html);
  });

}

function setupChatHooks() {
  Hooks.on("chatMessage", (log, message, chatData) => {
    const match = message.match(/^\/(\w+)(?: +([^#]+))(?:#(.+))?/);
    const type = match?.[1];
    if (!type) return;
    if (["HEAL", "H", "DAMAGE", "D"].includes(type.toUpperCase())) {
      const cMsg = CONFIG.ChatMessage.documentClass;
      const speaker = cMsg.getSpeaker();
      const actor = cMsg.getSpeakerActor(speaker);
      const rollData = actor ? actor.getRollData() : {};
      if (typeof customRolls === "function") customRolls(message, speaker, rollData);
      return false; // prevent default handling
    }
  });
}

function setupInlineRollHooks() {
  // v13+: renderChatMessageHTML passes an HTMLElement.
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const $html = $(html);
    $html.on("click", "a.inline-roll.custom", (event) => {
      event.preventDefault();
      const a = event.currentTarget;
      const chatMessage = `/${a.dataset.formula}`;
      const cMsg = CONFIG.ChatMessage.documentClass;
      const speaker = cMsg.getSpeaker();
      const actor = cMsg.getSpeakerActor(speaker);
      const rollData = actor ? actor.getRollData() : {};
      if (typeof customRolls === "function") customRolls(chatMessage, speaker, rollData);
    });
  });
}
// Legacy monkey patches removed in favor of hook-based handlers.