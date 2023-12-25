/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */

// Import Modules
//import { SimpleActor } from "./actor.js";
import { d100Actor } from "./d100actor.js";
//import { SimpleItem } from "./item.js";
//import { d100Item } from "./d100item.js";
//import { SimpleItemSheet } from "./item-sheet.js";
import { d100ItemSheet } from "./d100item-sheet.js";
//import { SimpleActorSheet } from "./actor-sheet.js";
import { d100ActorSheet } from "./d100Actor-sheet.js";
import { d100ATokenHUD } from "./d100hud.js"; 
import { d100ATokenDoc } from "./d100TokenDoc.js";
import { d100AToken } from "./d100Token.js";
import { d100ACombatant } from "./d100Combatant.js";
import { d100AActorSheetCharacter } from "./actor/sheet/character.js";
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
import { ItemSFRPG } from "./item/item.js";
import { Combatd100A } from "./combat/combat.js";
import { d100ASceneConfig } from "./d100ASceneConfig.js";
import { d100AScene} from "./d100AScene.js";
import { ItemSheetSFRPG } from "./item/sheet.js";
import { ItemCollectionSheet } from './apps/item-collection-sheet.js';
import { ItemDeletionDialog } from './apps/item-deletion-dialog.js';
import { SFRPG } from "./config.js";
import { SFRPGModifierTypes, SFRPGModifierType, SFRPGEffectType } from "../module/modifiers/types.js";
import SFRPGModifier from "../module/modifiers/modifier.js";
import d100AModifierApplication from '../module/apps/modifier-app.js';
import { ActorMovementConfig } from '../module/apps/movement-config.js';
import { RPC } from "../module/rpc.js";
import CounterManagement from "../module/classes/counter-management.js";
import { initializeRemoteInventory, ActorItemHelper } from "../module/actor/actor-inventory-utils.js";
import { d100A } from "./d100Aconfig.js";
import { computeCompoundBulkForItem } from "../module/actor/actor-inventory-utils.js";
import registerSystemRules from "./rules.js";
import Engine from "./engine/engine.js";
import { registerSystemSettings } from "../module/settings.js";
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

 import { extendBarRenderer, redrawBar } from "./barbrawl/module/rendering.js";
 //C0002 import { extendTokenConfig } from "./barbrawl/module/config.js";
 //C0002 import { extendTokenHud } from "./barbrawl/module/hud.js";
 import { getDefaultResources, registerSettings } from "./barbrawl/module/settings.js";
 import { createOverrideData, prepareUpdate } from "./barbrawl/module/synchronization.js";
 import { refreshBarVisibility } from "./barbrawl/module/api.js";
 import { d100ACombatTracker } from './combat/combat-tracker.js'
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
  CONST.USER_PERMISSIONS.TOKEN_DELETE.defaultRole = 1

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
      ActorSheetSFRPGCharacter,
      ActorSheetSFRPGDrone,
      ActorSheetSFRPGHazard,
      ActorSheetSFRPGNPC,
      ActorSheetSFRPGStarship,
      ActorSheetSFRPGVehicle,*/
      // Item Sheets
      /*ItemCollectionSheet,
      ItemSheetSFRPG,      */      
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
      //TraitSelectorSFRPG
    },
    //d100Actor,
    d100AActorSheetCharacter,
    d100AActorSheetNPC,
    ItemSheetSFRPG,
    //C0001 DragRuler,
    //TokenHUD,
    ItemCollectionSheet,
    ItemDeletionDialog,
    createAlternityd100Macro,
    config: SFRPG,
    d100Aconfig: d100A,
    ActorMovementConfig,
    SFRPGModifier,
    SFRPGModifierType,
    SFRPGModifierTypes ,
    d100AModifierApplication  ,
    ActorSheetFlags, 
    AbilityTemplate,

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
  CONFIG.Actor.documentClass = d100Actor;
  CONFIG.Item.documentClass = ItemSFRPG;
  CONFIG.Token.documentClass = d100ATokenDoc;
  CONFIG.Token.objectClass = d100AToken;
  CONFIG.Combat.documentClass = Combatd100A;
  //CONFIG.MeasuredTemplate.objectClass = MeasuredTemplatePF;
  CONFIG.SFRPG = SFRPG;
  CONFIG.d100A = d100A;
  CONFIG.Combatant.documentClass = d100ACombatant;
  CONFIG.ui.combat = d100ACombatTracker;
  CONFIG.Scene.documentClass = d100AScene;

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



  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  //Actors.registerSheet("Alternityd100", SimpleActorSheet, { makeDefault: false });
  //Actors.registerSheet("Alternityd100", d100ActorSheet, { makeDefault: true });
  Actors.registerSheet("Alternityd100", d100AActorSheetCharacter, { types: ["character"], makeDefault: true });
  Actors.registerSheet("Alternityd100", d100AActorSheetStarship , { types: ["starship"], makeDefault: true });
  Actors.registerSheet("Alternityd100", d100AActorSheetVehicle, { types: ["vehicle"], makeDefault: true });
  Actors.registerSheet("Alternityd100", d100AActorSheetDrone,     { types: ["drone"],     makeDefault: true });
  Actors.registerSheet("Alternityd100", d100AActorSheetHazard,    { types: ["hazard"],    makeDefault: true });
  Actors.registerSheet("Alternityd100", d100AActorSheetOrdnance,    { types: ["ordnance"],    makeDefault: true });
  Actors.registerSheet("Alternityd100", d100AActorSheetNPC,       { types: ["npc"],       makeDefault: false });
  //Actors.registerSheet("sfrpg", d100AActorSheetStarship,  { types: ["starship"],  makeDefault: true });
  //Actors.registerSheet("sfrpg", ActorSheetSFRPGVehicle,   { types: ["vehicle"],   makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("Alternityd100", ItemSheetSFRPG, { makeDefault: true });
  //TokenHUD.registerSheet("Alternityd100", d100Hud,       { types: ["TokenHUD"],       makeDefault: true });
  Scenes.registerSheet("Alternityd100", d100ASceneConfig, { makeDefault: true });


registerSystemRules(game.Alternityd100.engine);
registerSystemSettings();
  //game.settings.get("sfrpg", "sfrpgTheme")
if (true) {
       const logo = document.querySelector("#logo");
       logo.src = "systems/Alternityd100/images/VTTlogo.png";
       logo.style.width = "120px";
       logo.style.height = "43px";
       logo.style.margin = "0 0 0 9px";
       let r = document.querySelector(':root');
       r.style.setProperty("--color-border-highlight-alt", "#0EAAAA");  // #0080ff
       r.style.setProperty("--color-border-highlight", "#0EAAAA");   // #0EAAAA #00a0ff
       r.style.setProperty("--color-text-hyperlink", "#38b5ff");  //
       r.style.setProperty("--color-shadow-primary", "#0EAAAA");//#00a0ff
       r.style.setProperty("--color-shadow-highlight", "#0EAAAA");  //#00a0ff
       r.style.setProperty("--sfrpg-theme-blue", "#235683");
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

  // Patch Core Functions
  PatchCore();



  /**
   * Slugify a string.
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });

  // Preload template partials
  preloadHandlebarsTemplates();
  //canvas.controdragRuler = new DragRuler();
  
  //DragRuler.init;
  console.log('barbrawl | Initializing barbrawl');

  registerSettings();
  Handlebars.registerHelper("barbrawl-concat", function () {
      let output = "";
      for (let input of arguments) {
          if (typeof input !== "object") output += input;
      }
      return output;
  });
//console.log("---------THIS LOADS----------")
  let a = loadTemplates(["systems/Alternityd100/module/barbrawl/templates/bar-config-minimal.hbs", "systems/Alternityd100/module/barbrawl/templates/bar-config.hbs"]);
//    console.log("---------THIS LOADS----------",a)


});

/** Hooks to replace UI elements. */
Hooks.once("setup", extendBarRenderer);


Hooks.once("setup", function () {



  //extendBarRenderer;
    //console.log(`Alternity by d100  | [SETUP] Setting up Alternity by d100  System subsystems`);
    //console.log("SFRPG",CONFIG.SFRPG)


    console.log("Alternity by d100  | [SETUP] Initializing counter management");
    const counterManagement = new CounterManagement();
    counterManagement.setup();

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
            "starshipRoles", "vehicleTypes", "vehicleCoverTypes", "containableTypes", "starshipSystemStatus", "speeds",
            "damageTypeOperators", "flightManeuverability", "npcCrewQualities"
        ];
    
        const d100toLocalize = ["abilities","conditionTypes", "weaponTypes","progressLevel","pubnsource","availability","skills","damagetype", "firepower", "damageQ","psionAbility",/*"starshipSensorModes","starshipSensorTypes",*/
        "modifierEffectTypes","modifierHitPointsAffectedValues","feature","mountTypes","ordnanceTypes","starshipFirepower","starshipFirepowerDial", "modifierResistanceAffectedValues" ,"coverType","movementType", "dodgeType" ];

        for (let o of toLocalize) {
            
            CONFIG.SFRPG[o] = Object.entries(CONFIG.SFRPG[o]).reduce((obj, e) => {
                obj[e[0]] = game.i18n.localize(e[1]);
    
                return obj;
            }, {});
       
        }

        for (let o of d100toLocalize) {
            
            CONFIG.d100A[o] = Object.entries(CONFIG.d100A[o]).reduce((obj, e) => {
                obj[e[0]] = game.i18n.localize(e[1]);
    
                return obj;
            }, {});
       
        }
    
    
  //console.log(  //"_getItemProperties",props,
        //  "labels", labels,  
         // "Itemdata" ,itemData,
         // "Item" , item,  
         // "CONFIG-NEW", CONFIG.SFRPG.weaponProperties, 
         // "Object Ent", Object.entries(itemData.properties),
        //  "AEON" ,CONFIG.SFRPG.weaponPropertiesAeon
  //      )
    
        console.log("Alternity by d100  | [SETUP] Configuring rules engine");
      

        console.log("d100Alternity | [SETUP] Registering custom handlebars");
        setupHandlebars();

      





});

Hooks.once("ready", () => {
    console.log(`Alternity by d100  | [READY] Preparing system for operation`);
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
//Hooks.on("renderChatLog", (app, html, data) => ItemSFRPG.chatListeners(html));
Hooks.on("renderChatMessage", (_, html) => ItemSFRPG.chatListeners(html));
//Hooks.on("renderChatMessage", (_, html) => d100ActorSheet.chatListeners(html)); 
//Hooks.on("renderChatMessage", (app, html, data) => ItemSFRPG.chatListeners(html));

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
Hooks.on("preUpdateActor", function (actor, newData) {
  console.log("actor, newData",actor, newData)
  if (!hasProperty(newData, "prototypeToken.flags.barbrawl.resourceBars")) return;
  prepareUpdate(actor.prototypeToken, newData.prototypeToken);
});

/** Hook to update bars. */
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

/** Hooks to initialize tokens and actors with default bars. */
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

Hooks.on("preCreateActor", function (doc) {
  console.log("preCreateActor")
  if (!doc.token || foundry.utils.hasProperty(doc.token, "flags.barbrawl.resourceBars")) return;

  const barConfig = getDefaultResources(doc.type);
  if (!barConfig) return;
  doc.updateSource(createOverrideData(barConfig, true));
});

/** Hook to update bar visibility. */
Hooks.on("hoverToken", refreshBarVisibility);
Hooks.on("controlToken", refreshBarVisibility);

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
 kjhgjkhg
  const command = `game.sfrpg.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
      macro = await Macro.create({
          name: item.name,
          type: "script",
          img: item.img,
          command: command,
          flags: {"sfrpg.itemMacro": true}
      }, {displaySheet: false});
  }
  console.log(macro)
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
  Handlebars.registerHelper("json-string", (e2) => new Handlebars.SafeString(escape(JSON.stringify(e2))))
  
  Handlebars.registerHelper("enrich", (content, options) => {
    let a= enrichthis(content, options)
  
console.log("\nA",a)
    return a
    const owner = Boolean(options.hash["owner"]);
   const rollData = options.hash["rollData"];
   
   const newstring = TextEditor.enrichHTML( { secrets: owner, rollData })
   console.log(content,options,rollData,newstring)
    return new Handlebars.SafeString(newstring);
  });

   function enrichthis(content, options){
    const owner = Boolean(options.hash["owner"]);
    const rollData = options.hash["rollData"];
    
    const newstring = TextEditor.enrichHTML( { secrets: owner,async:true, rollData })
    console.log(content,options,rollData,newstring)
     return new Handlebars.SafeString(newstring);


  }

   function PatchCore() {
  // Add inline support for extra /commands
  {
    const origParse = ChatLog.parse;
    ChatLog.parse = function (message) {
      const match = message.match(/^\/(\w+)(?: +([^#]+))(?:#(.+))?/),
        type = match?.[1];
      if (["HEAL", "H", "DAMAGE", "D"].includes(type?.toUpperCase())) {
        match[2] = match[0].slice(1);
        return ["custom", match];
      } else return origParse.call(this, message);
    };

    const origClick = TextEditor._onClickInlineRoll;
    TextEditor._onClickInlineRoll = function (event) {
      event.preventDefault();
      const a = event.currentTarget;
      if (!a.classList.contains("custom")) return origClick.call(this, event);

      const chatMessage = `/${a.dataset.formula}`;
      const cMsg = CONFIG.ChatMessage.documentClass;
      const speaker = cMsg.getSpeaker();
      const actor = cMsg.getSpeakerActor(speaker);
      let rollData = actor ? actor.getRollData() : {};

      const sheet = a.closest(".sheet");
      if (sheet) {
        const app = ui.windows[sheet.dataset.appid];
        if (["Actor", "Item"].includes(app?.document.documentName)) rollData = app.object.getRollData();
      }
      return customRolls(chatMessage, speaker, rollData);
    };

    // Fix for race condition
    if ($._data($("body").get(0), "events")?.click?.find((o) => o.selector === "a.inline-roll")) {
      $("body").off("click", "a.inline-roll", origClick);
      $("body").on("click", "a.inline-roll", TextEditor._onClickInlineRoll);
    }
  }

  // Change tooltip showing on alt
  {
    const fn = KeyboardManager.prototype._onAlt;
    KeyboardManager.prototype._onAlt = function (event, up, modifiers) {
      if (!game.pf1.tooltip) return;
      if (!up) game.pf1.tooltip.lock.new = true;
      fn.call(this, event, up, modifiers);
      if (!up) game.pf1.tooltip.lock.new = false;
    };
  }

  // Patch StringTerm
  StringTerm.prototype.evaluate = function (options = {}) {
    const result = parseRollStringVariable(this.term);
    if (typeof result === "string") {
      const src = `with (sandbox) { return ${this.term}; }`;
      try {
        const evalFn = new Function("sandbox", src);
        this._total = evalFn(RollPF.MATH_PROXY);
      } catch (err) {
        err.message = `Failed to evaluate: '${this.term}'\n${err.message}`;
        throw err;
      }
    } else {
      this._total = result;
    }
  };

  // Patch NumericTerm
  NumericTerm.prototype.getTooltipData = function () {
    return {
      formula: this.expression,
      total: this.total,
      flavor: this.flavor,
    };
  };

  // Patch ParentheticalTerm and allowed operators
  ParentheticalTerm.CLOSE_REGEXP = new RegExp(`\\)${RollTerm.FLAVOR_REGEXP_STRING}?`, "g");
  OperatorTerm.REGEXP = /(?:&&|\|\||\*\*|\+|-|\*|\/|\\%|\||:|\?)|(?<![a-z])[!=<>]+/g;
  OperatorTerm.OPERATORS.push("\\%", "!", "?", ":", "=", "<", ">", "==", "===", "<=", ">=", "??", "||", "&&", "**");

  // Add secondary indexing to compendium collections
  {
    const origFunc = CompendiumCollection.prototype.getIndex;
    CompendiumCollection.prototype.getIndex = async function ({ fields } = {}) {
      const index = await origFunc.call(this, { fields });
      this.fuzzyIndex = sortArrayByName([...index]);
      return this.index;
    };
  }

  // Document link attribute stuffing
  {
    const origFunc = TextEditor._createContentLink;
    TextEditor._createContentLink = function (match, type, target, name) {
      const a = origFunc.call(this, match, type, target, name);
      if (name?.indexOf("::") > -1) {
        const args = name.split("::"),
          label = args.pop();
        if (args.length) {
          args.forEach((o) => {
            let [key, value] = o.split(/(?<!\\):/);
            if (!(key && value)) {
              value = key;
              key = "extra";
            }
            switch (key) {
              case "icon":
                a.firstChild.className = "fas fa-" + value;
                break;
              case "class":
                a.classList.add(...value.split(" "));
                break;
              default:
                a.setAttribute("data-" + key, value);
            }
          });
          a.lastChild.textContent = label;
        }
      }
      return a;
    };
  }

  // Remove warnings for conflicting uneditable system bindings
  {
    const origFunc = KeybindingsConfig.prototype._detectConflictingActions;
    KeybindingsConfig.prototype._detectConflictingActions = function (actionId, action, binding) {
      // Uneditable System bindings are never wrong, they can never conflict with something
      if (actionId.startsWith("pf1.") && action.uneditable.includes(binding)) return [];

      return origFunc.call(this, actionId, action, binding);
    };
  }
}


}
function PatchCore() {
  // Add inline support for extra /commands
  {
    const origParse = ChatLog.parse;
    ChatLog.parse = function (message) {
      const match = message.match(/^\/(\w+)(?: +([^#]+))(?:#(.+))?/),
        type = match?.[1];
      if (["HEAL", "H", "DAMAGE", "D"].includes(type?.toUpperCase())) {
        match[2] = match[0].slice(1);
        return ["custom", match];
      } else return origParse.call(this, message);
    };

    const origClick = TextEditor._onClickInlineRoll;
    TextEditor._onClickInlineRoll = function (event) {
      event.preventDefault();
      const a = event.currentTarget;
      if (!a.classList.contains("custom")) return origClick.call(this, event);

      const chatMessage = `/${a.dataset.formula}`;
      const cMsg = CONFIG.ChatMessage.documentClass;
      const speaker = cMsg.getSpeaker();
      const actor = cMsg.getSpeakerActor(speaker);
      let rollData = actor ? actor.getRollData() : {};

      const sheet = a.closest(".sheet");
      if (sheet) {
        const app = ui.windows[sheet.dataset.appid];
        if (["Actor", "Item"].includes(app?.document.documentName)) rollData = app.object.getRollData();
      }
      return customRolls(chatMessage, speaker, rollData);
    };

    // Fix for race condition
    if ($._data($("body").get(0), "events")?.click?.find((o) => o.selector === "a.inline-roll")) {
      $("body").off("click", "a.inline-roll", origClick);
      $("body").on("click", "a.inline-roll", TextEditor._onClickInlineRoll);
    }
  }

  // Change tooltip showing on alt
  {
    const fn = KeyboardManager.prototype._onAlt;
    KeyboardManager.prototype._onAlt = function (event, up, modifiers) {
      if (!game.pf1.tooltip) return;
      if (!up) game.pf1.tooltip.lock.new = true;
      fn.call(this, event, up, modifiers);
      if (!up) game.pf1.tooltip.lock.new = false;
    };
  }

  // Patch StringTerm
  StringTerm.prototype.evaluate = function (options = {}) {
    console.log(this)
    const result = parseRollStringVariable(this.term);
    if (typeof result === "string") {
      const src = `with (sandbox) { return ${this.term}; }`;
      try {
        const evalFn = new Function("sandbox", src);
        this._total = evalFn(RollPF.MATH_PROXY);
      } catch (err) {
        err.message = `Failed to evaluate: '${this.term}'\n${err.message}`;
        throw err;
      }
    } else {
      this._total = result;
    }
  };

  // Patch NumericTerm
  NumericTerm.prototype.getTooltipData = function () {
    return {
      formula: this.expression,
      total: this.total,
      flavor: this.flavor,
    };
  };

  // Patch ParentheticalTerm and allowed operators
  ParentheticalTerm.CLOSE_REGEXP = new RegExp(`\\)${RollTerm.FLAVOR_REGEXP_STRING}?`, "g");
  OperatorTerm.REGEXP = /(?:&&|\|\||\*\*|\+|-|\*|\/|\\%|\||:|\?)|(?<![a-z])[!=<>]+/g;
  OperatorTerm.OPERATORS.push("\\%", "!", "?", ":", "=", "<", ">", "==", "===", "<=", ">=", "??", "||", "&&", "**");

  // Add secondary indexing to compendium collections
  {
    const origFunc = CompendiumCollection.prototype.getIndex;
    CompendiumCollection.prototype.getIndex = async function ({ fields } = {}) {
      const index = await origFunc.call(this, { fields });
      this.fuzzyIndex = sortArrayByName([...index]);
      return this.index;
    };
  }

  // Document link attribute stuffing
  {
    const origFunc = TextEditor._createContentLink;
    TextEditor._createContentLink = function (match, type, target, name) {
      const a = origFunc.call(this, match, type, target, name);
      if (name?.indexOf("::") > -1) {
        const args = name.split("::"),
          label = args.pop();
        if (args.length) {
          args.forEach((o) => {
            let [key, value] = o.split(/(?<!\\):/);
            if (!(key && value)) {
              value = key;
              key = "extra";
            }
            switch (key) {
              case "icon":
                a.firstChild.className = "fas fa-" + value;
                break;
              case "class":
                a.classList.add(...value.split(" "));
                break;
              default:
                a.setAttribute("data-" + key, value);
            }
          });
          a.lastChild.textContent = label;
        }
      }
      return a;
    };
  }

  // Remove warnings for conflicting uneditable system bindings
  {
    const origFunc = KeybindingsConfig.prototype._detectConflictingActions;
    KeybindingsConfig.prototype._detectConflictingActions = function (actionId, action, binding) {
      // Uneditable System bindings are never wrong, they can never conflict with something
      if (actionId.startsWith("pf1.") && action.uneditable.includes(binding)) return [];

      return origFunc.call(this, actionId, action, binding);
    };
  }
}