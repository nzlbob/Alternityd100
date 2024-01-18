import { EntitySheetHelper } from "./helper.js";
import { getSkipActionPrompt } from "./settings.js";
import { Diced100 } from "./dice.js";
import { SFRPG } from "./config.js"
import { d100A } from "./d100Aconfig.js"
//import { DiceSFRPG } from "../dice.js";
//import RollContext from "../rolls/rollcontext.js";
import { Mix } from "./utils/custom-mixer.js";
import { ActorConditionsMixin } from "./actor/mixins/actor-conditions.js";
import { ActorCrewMixin } from "./actor/mixins/actor-crew.js";
import { ActorModifiersMixin } from "./actor/mixins/actor-modifiers.js";
import { ActorResourcesMixin } from "./actor/mixins/actor-resources.js";
import { ActorRestMixin } from "./actor/mixins/actor-rest.js";
import { d100stepdie } from "../module/modifiers/d100mod.js";
import { d100resmod,d100NPCCrewStats } from "../module/modifiers/d100mod.js";

//import { ChoiceDialog } from "../apps/choice-dialog.js";
//import { SpellCastDialog } from "../apps/spell-cast-dialog.js";
//import { AddEditSkillDialog } from "../apps/edit-skill-dialog.js";
//import { NpcSkillToggleDialog } from "../apps/npc-skill-toggle-dialog.js";

//import { } from "./crew-update.js"
import { ItemSheetSFRPG } from "./item/sheet.js";
import { ItemSFRPG } from "./item/item.js";
import { hasDiceTerms } from "./utilities.js";
import { skillStepdieData } from "./modifiers/d100mod.js";
import { ActorInventoryMixin } from "./actor/mixins/actor-inventory.js";

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
 export class d100Actor extends Mix(Actor).with(ActorConditionsMixin, ActorCrewMixin, ActorInventoryMixin, ActorModifiersMixin, ActorResourcesMixin, ActorRestMixin) {

  constructor(data, context) {
      super(data, context);
      //console.log(`Constructor for actor named ${data.name} of type ${data.type}`);
  }

  xtestUserPermission (){
    super.testUserPermission();
console.log("HI")
  }
  
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
    
    this._ensureHasModifiers(this.system);
    const modifiers = this.getAllModifiers();
//console.log("\nmodifiers\n" , modifiers)
    const items = this.items;




    const armor = items.find(item => item.type === "equipment" && item.system.equipped);
    const shields = items.filter(item => item.type === "shield" && item.system.equipped);
    const weapons = items.filter(item => item.type === "weapon" && item.system.equipped);
    const races = items.filter(item => item.type === "race");
    const frames = items.filter(item => item.type === "starshipFrame");
    const profession = items.filter(item => item.type === "profession");
    const chassis = items.filter(item => item.type === "chassis");
    const perks = items.find(item => item.type === "perk");
    const flaws = items.find(item => item.type === "flaw");
    const achievements = items.find(item => item.type === "achievement");
    const mods = items.filter(item => item.type === "mod");
    const armorUpgrades = items.filter(item => item.type === "upgrade");
    const asis = items.filter(item => item.type === "asi");
    const actorResources = items.filter(item => item.type === "actorResource");
    const psionics = items.filter(item => item.type === "psionic");
    //console.log("\n\n\n\----------------\nweapons",weapons,this)



return game.Alternityd100.engine.process("process-actors", {
  actorId: this.id,
  actor: this,
  type: this.system.type,
  system: this.system,
  flags: this.system.flags,
  items: this.items,
  armors:armor,
  shields:shields,
  weapons:weapons,
  races:races,
  profession:profession,
  chassis:chassis,
  modifiers:modifiers,
  perks:perks,
  flaws:flaws,
  achievements:achievements,
  mods:mods,
  armorUpgrades:armorUpgrades,
  asis:asis,
  frames:frames,
  actorResources:actorResources,
  psionics:psionics,
  //clothing:clothing

});
}


/** @override */
render(force, context={}) {
    /** Clear out deleted item sheets. */
    const keysToDelete = [];
    for (const [appId, app] of Object.entries(this.apps)) {
        if (app instanceof ItemSheetSFRPG) {
            const item = app.object;
            if (!this.items.find(x => x.id === item.id)) {
                keysToDelete.push(appId);
            }
        }
    }
    if (keysToDelete.length > 0) {
        for (const key of keysToDelete) {
            delete this.apps[key];
        }
    }

    /** Now render this actor. */
    return super.render(force, context);
}



  

    /** @override */
    prepareBaseData() {
      // Data modifications in this step occur before processing embedded
      // documents or derived data.



    }
  
    /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
    /** @inheritdoc */
  prepareDerivedData() {







    //console.log(this);
    super.prepareDerivedData();
    let actorData = this.system;
  
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  
    actorData.type = this.type;
    //console.log("actorData-------------",this, actorData.type, actorData)
    
   // let data = actorData;
   // console.log("actorData-------------",this,this.system.attributes.speed.walk.base)
   



    //const flags = actorData.flags.boilerplate || {};
    
    let conwil = 0;
    let strdex = 0;
    
   // console.log("\n\n\n\n\-------actorData-------------", actorData)
    if (["starship","ordnance"].includes(actorData.type) )
    { actorData.isSpaceActor = true
    this.isSpaceActor = true}  
    else 
    { actorData.isSpaceActor = false
      this.isSpaceActor = false} 

  if (["character","drone","npc","npc2",].includes(actorData.type) )
  {

  
/*
***Moved to calculate initiative modifiers**

  actorData.attributes.actchk.base = Math.floor(( actorData.abilities.dex.base+actorData.abilities.int.base)/2);
  actorData.attributes.actchk.ordinary = actorData.attributes.actchk.base ;
  actorData.attributes.actchk.marginal = actorData.attributes.actchk.ordinary +1;
  actorData.attributes.actchk.good = Math.floor((actorData.attributes.actchk.ordinary)/2);
  actorData.attributes.actchk.amazing = Math.floor((actorData.attributes.actchk.good)/2);
  actorData.attributes.actchk.die = "";*/
  //console.log("\n\nACT\n\n",actorData.attributes.actchk.base,actorData.abilities.dex.base,actorData.abilities.int.base)
  
  //Action Check calculation 
  //***Moved to calculate initiative modifiers**
/*
  conwil=actorData.abilities.con.base+actorData.abilities.wil.base;
  if (conwil>7) {actorData.attributes.actchk.aprbase = 1};
  if (conwil>15) {actorData.attributes.actchk.aprbase = 2};
  if (conwil>23) {actorData.attributes.actchk.aprbase = 3};
  if (conwil>31) {actorData.attributes.actchk.aprbase = 4};
  
  actorData.attributes.actchk.apr = actorData.attributes.actchk.aprbase;
  */
  //Combat Movement 
  /*
  strdex=actorData.abilities.str.value + actorData.abilities.dex.value;

  if (strdex<8) {actorData.attributes.speed.sprint.base = 6};
  if (strdex<33) {actorData.attributes.speed.sprint.base = Math.floor(strdex/2)*2};
  if (strdex>32) {actorData.attributes.speed.sprint.base = 32};

  actorData.attributes.speed.glide.base = actorData.attributes.speed.sprint.base;
  actorData.attributes.speed.fly.base = actorData.attributes.speed.sprint.base*2;
  //actorData.attributes.speed.fly.base = 100;
  
  if (actorData.attributes.speed.sprint.base<8) {actorData.attributes.speed.run.base = 4;actorData.attributes.speed.walk.base = 2};
  if (actorData.attributes.speed.sprint.base>7) {actorData.attributes.speed.run.base = actorData.attributes.speed.sprint.base -4;actorData.attributes.speed.walk.base = 2};
  if (actorData.attributes.speed.sprint.base>15) {actorData.attributes.speed.run.base = actorData.attributes.speed.sprint.base -6;actorData.attributes.speed.walk.base = 4};
  if (actorData.attributes.speed.sprint.base>19) {actorData.attributes.speed.run.base = actorData.attributes.speed.sprint.base -8};
  if (actorData.attributes.speed.sprint.base>23) {actorData.attributes.speed.walk.base = 6};
  if (actorData.attributes.speed.sprint.base>25) {actorData.attributes.speed.run.base = actorData.attributes.speed.sprint.base -10};
  if (actorData.attributes.speed.sprint.base>29) {actorData.attributes.speed.walk.base = 8};
  actorData.attributes.speed.swim.base = actorData.attributes.speed.walk.base;
  actorData.attributes.speed.easyswim.base = actorData.attributes.speed.walk.base/2;
 */
  //Hit point Calculation
 /*
  actorData.attributes.mor.base = Math.ceil(actorData.abilities.con.base/2);
  actorData.attributes.wou.base = actorData.abilities.con.base;
  actorData.attributes.stu.base = actorData.abilities.con.base;
  
  
  actorData.abilities.str.modBase= d100resmod(actorData.abilities.str.base);
  actorData.abilities.con.modBase= d100resmod(actorData.abilities.con.base);
  actorData.abilities.dex.modBase= d100resmod(actorData.abilities.dex.base);
  actorData.abilities.int.modBase= d100resmod(actorData.abilities.int.base);
  actorData.abilities.wil.modBase= d100resmod(actorData.abilities.wil.base);
  actorData.abilities.per.modBase= d100resmod(actorData.abilities.per.base);

*/
  
  //-- get bonus skills for being human. This is not great, should be in json file
  
  let bonusskillno = 0;
  let bonusbroadskillno = 0;
  if(actorData.details.species =="human"){bonusskillno = 5};bonusbroadskillno=1;
  //originalrules
  actorData.details.skillpoints = (actorData.abilities.int.base-1)*5+bonusskillno;
  actorData.details.broadskillpoints = Math.floor(actorData.abilities.int.base/2)+bonusbroadskillno;
  
  /*Optional Rule 2A: In addition to the free broad skills determined by race selection, a new character has a number of skill points equal to 30 plus 3 times his Intelligence score available to purchase skills during character creation. Human heroes receive a special bonus of 5 additional skill points at character creation.
  This replaces the skill point allocations indicated on Table P5 in the Player’s Handbook. Under the old system, an alien hero with an Intelligence score of 9 received 40 skill points for initial skill purchase; under the upgrade, he receives 30 + (3 × 9) or 57 skill points. A human hero of the same Intelligence score would begin with 62 skill points if using this optional rule.
  
  Optional Rule 2B: During initial skill purchase, a character may not learn more than six additional broad skills, not counting his racial broad skills. Modify this number by the hero’s Intelligence-based resistance modifier.
  Since low-Intelligence characters receive a much greater number of skill points in this upgrade, the limitation on purchasing new broad skills is relaxed somewhat. This replaces the limits given on Table P5. Previously, a character of Intelligence 6 would be able to purchase no more than 3 broad skills during initial skill purchase, but this upgrade increases that number to 5 (6, less 1 for his -1 Intelligence resistance modifier).
  
  Optional Rule 2C: The cost to purchase rank 2 or higher in a specialty skill is either the list price or the list price -1. The number of ranks a character currently possesses in the specialty skill does not increase the cost of advancing that skill.
  This replaces the second bullet point under Cost of Skills on page 61 in the Player’s Handbook. As originally written, advancing a specialty skill from rank 4 to rank 5 (for instance) would cost a number of skill points equal to the original purchase price +4. This upgrade changes the advancement of skills so that a character simply buys the skill again at its normal purchase price in order to advance his skill rank.
  Note that a hero may not begin with a specialty skill rank of more than 3 at character creation, and that a character cannot improve a skill rank more than once per achievement level.
  
  Optional rule 2A for calculating skill points; 0 bonus skill points
  Rule2C in play for skill advancement
  */
  actorData.details.skillpoints = (actorData.abilities.int.base)*3+bonusskillno+30;
  actorData.details.broadskillpoints = Math.floor(actorData.abilities.int.base/2)+bonusbroadskillno;
  
  
  
  
    // Loop through skills, and add their ranks to the base stat. Also halve broadskills. look through race and see if it is a free broadskill.
   const br_sk_id = [] ;
   let curbroadskill = 0;
   let freeflag = false
  
 // for (let[key3,stat] of Object.entries(actorData.abilities)){
  
   for (let [key, skill] of Object.entries(actorData.skills)) { if (skill.id == skill.broadid){skill.ranks = null};
   if (["movem","race","swim","trail"].includes(key)){ skill.ability = "con"}
   if (["race"].includes(key)){ skill.label = "Run"}
   for (let [key2,race] of Object.entries(actorData.charoptions.species)){if (key2 == actorData.details.species){if (race.freebroad1 == skill.id||race.freebroad2 == skill.id||race.freebroad3 == skill.id||race.freebroad4 == skill.id||race.freebroad5 == skill.id||race.freebroad6 == skill.id){freeflag = true}}}
    br_sk_id[skill.id]=2; if (skill.id == skill.broadid && !freeflag) {br_sk_id[skill.id]=2} else {if (skill.ranks>0 || freeflag ){br_sk_id[skill.broadid]=1;freeflag=false}}
    // skill dice
    if(skill.ranks>0){skill.step=0} else{skill.step=1}
    skill.step = skillStepdieData(skill)
    skill.stepdie = d100stepdie(skill.step);
  
  } 
  //  for (let [key, skill] of Object.entries(actorData.skills[key3])) { skill.base = Math.floor((actorData.abilities[key3].base + skill.ranks) / br_sk_id[skill.broadid]) ; skill.good =  Math.floor(skill.base/2) ; skill.amazing =  Math.max(1,Math.floor(skill.base/4)) };
   
  //}

//skill step bonus from Technical Knowledge
//console
if(actorData.skills.technkn.ranks>2) {
  actorData.skills.technsc.step +=1;
  actorData.skills.inven.step +=1;
  actorData.skills.juryr.step +=1;
  actorData.skills.repai.step +=1;
}
if(actorData.skills.technkn.ranks>5) {
  actorData.skills.technsc.step +=1;
  actorData.skills.inven.step +=1;
  actorData.skills.juryr.step +=1;
  actorData.skills.repai.step +=1;
}
if(actorData.skills.technkn.ranks>8) {
  actorData.skills.technsc.step +=1;
  actorData.skills.inven.step +=1;
  actorData.skills.juryr.step +=1;
  actorData.skills.repai.step +=1;
}
if(actorData.skills.technkn.ranks>11) {
  actorData.skills.technsc.step +=1;
  actorData.skills.inven.step +=1;
  actorData.skills.juryr.step +=1;
  actorData.skills.repai.step +=1;
}


// Table PIO: Skills & Resistance Modifiers
//Acting Characters Skill ....Resisting Ability
// Deception.Intelligence
// Entertainment  Intelligence or Will
// Heavy Weapons — ....Dexterity
// Interaction ....will
//Leader ship .............................Will
//Melee Weapons........ Strength
//Modern Ranged Weapons..........Dexterity
//Primitive Ranged Weapons .......... .Dexterity
//Psionic Skills WILI
// Stealth Will
//Street Smart .Intelligence or Will
//Unarmed Attack....... .Strength





  /*
  
   t [key, skill] of Object.entries(actorData.skills.per)) { skill.base = Math.floor((actorData.abilities.per.value + skill.ranks) / br_sk_id[skill.broadid]) ; skill.good =  Math.floor(skill.base/2) ; skill.amazing =  Math.max(1,Math.floor(skill.base/4)) };
             */
  
  
              let usedsp = 0
              let usedbsp = 0
              for (let[key3,skill] of Object.entries(actorData.skills)){
               if(skill.ranks && skill.id==skill.broadid){usedbsp+=skill.ranks} else {usedsp+=skill.ranks;/*console.log(usedsp)*/ }
               //console.log(skill.id,skill.broadid,skill.ranks,usedsp);
              }
              actorData.details.usedskillpoints = usedsp;
              actorData.details.usedbroadskillpoints = usedbsp;
  
  
  const k = "str" // [`actorData.skills.${skillId}.isTrainedOnly`]
  let l =  actorData.skills.armorop.label
  
  
   //console.log(l,k,actorData.skills.str.armorop.label)  
  
    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.

    this.system.groups = this.system.groups || {};
    this.system.attributes = this.system.attributes || {};


            }

            if (["starship",].includes(actorData.type) && (!!actorData.abilities))
            {
              if (actorData.abilities){
              actorData.abilities.str.modBase= 0;
              actorData.abilities.con.modBase= 0;
              actorData.abilities.dex.modBase= 0;
              actorData.abilities.int.modBase= 0;
              actorData.abilities.wil.modBase= 0;
              actorData.abilities.per.modBase= 0;
              }

           //   actorData.attribures.firepower = {value:0,type:""}

         //     d100A.starshipFirepower.G "d100A.Items.StarshipWeapon.firepower.GD"
         //     d100A.firepowerbyType"civilian"
         //     d100A.firepowerbyHullpoints.civilian //" : 30}
//
         //     SFRPG.toughness.good



          //    console.log(actorData.frame)

            }

      //console.log("actorData-------------\n",this,actorData,"actorData-------------\n")
  }
/**
 * Prepare Character type specific data
 */
 _prepareCharacterData(actorData) {
  if (actorData.type !== 'character') return;
  //const data = actorData.data;
  // Make modifications to data here. For example:
  
}



useStarshipAction(actionId) {

//console.log(actionId)

}

resetNPCCrew() {

  this.update({"system.crew.npcData" : null})
  delete this.system.crew.npcData
  
  }

/**
 * Prepare NPC type specific data.
 */
 _prepareNpcData(actorData) {
  //console.log(this)
  
  if (this.type !== 'npc') return;

  // Make modifications to data here. For example:
 // const data = actorData.data;
 // data.xp = (data.cr * data.cr) * 100;

 // if(this.type == "npc"){
   // const systemData = this.system   
    const quality = actorData.details.profession.npcQuality
    let qual = 0
    if (quality == "ordinary") qual = 1;
    if (quality == "good") qual = 2;
    if (quality == "amazing") qual = 3;
    for (let [k,v] of Object.entries(actorData.abilities))
        {
            let abi = d100A.npc.abilityBasis[actorData.details.profession.primary][k]
          //  console.log("KV ", k,v,abi,qual,d100A.npc.abilityArray,d100A.npc.abilityArray[0][2])
            v.base = d100A.npc.abilityArray[abi][qual]

        }

   // console.log("\n\n------QUALITY-------\n\n",actorData)

   //   }



}

  /** @override */
/*
  prepareData() {
  // Prepare data for the actor. Calling the super version of this executes
  // the following, in order: data reset (to clear active effects),
  // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
  // prepareDerivedData().
  super.prepareData();
}
**
  /* -------------------------------------------- */
    /** @override */
    getRollData() {
        const data = super.getRollData();

        return data;
    }

  /* -------------------------------------------- */

  /**
   * Apply shorthand syntax to actor roll data.
   * @param {Object} data The actor's data object.
   * @param {Array} formulaAttributes Array of attributes that are derived formulas.
   * @param {Boolean} shorthand Whether or not the shorthand syntax is used.
   */
  _applyShorthand(data, formulaAttributes, shorthand) {
    // Handle formula attributes when the short syntax is disabled.
    for ( let [k, v] of Object.entries(data.attributes || {}) ) {
      // Make an array of formula attributes for later reference.
      //console.log("\ndata\n", data,v,k)
      if ( v.dtype === "Formula" ) formulaAttributes.push(k);
      // Add shortened version of the attributes.
      if ( !!shorthand ) {
        if ( !(k in data) ) {
          // Non-grouped attributes.
          if ( v.dtype ) {
            data[k] = v.value;
          }
          // Grouped attributes.
          else {
            data[k] = {};
            for ( let [gk, gv] of Object.entries(v) ) {
              //console.log("\nGK-GV\n",gk,gv)
              data[k][gk] = gv.value;
              if ( gv.dtype === "Formula" ) formulaAttributes.push(`${k}.${gk}`);
            }
          }
        }
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Add items to the actor roll data object. Handles regular and shorthand
   * syntax, and calculates derived formula attributes on the items.
   * @param {Object} data The actor's data object.
   * @param {string[]} itemAttributes
   * @param {Boolean} shorthand Whether or not the shorthand syntax is used.
   */
  _applyItems(data, itemAttributes, shorthand) {
    // Map all items data using their slugified names
    data.items = this.items.reduce((obj, item) => {
      const key = item.name.slugify({strict: true});
      const itemData = item.toObject(false).data;

      // Add items to shorthand and note which ones are formula attributes.
      //console.log(itemData)
      for ( let [k, v] of Object.entries(itemData.attributes) ) {
        // When building the attribute list, prepend the item name for later use.+
        //console.log(v)
        
        if ( v.dtype === "Formula" ) itemAttributes.push(`${key}..${k}`);
        // Add shortened version of the attributes.
        if ( !!shorthand ) {
          if ( !(k in itemData) ) {
            // Non-grouped item attributes.
            if ( v.dtype ) {
              itemData[k] = v.value;
            }
            // Grouped item attributes.
            else {
              if ( !itemData[k] ) itemData[k] = {};
              for ( let [gk, gv] of Object.entries(v) ) {
                itemData[k][gk] = gv.value;
                if ( gv.dtype === "Formula" ) itemAttributes.push(`${key}..${k}.${gk}`);
              }
            }
          }
        }
        // Handle non-shorthand version of grouped attributes.
        else {
          if ( !v.dtype ) {
            if ( !itemData[k] ) itemData[k] = {};
            for ( let [gk, gv] of Object.entries(v) ) {
              itemData[k][gk] = gv.value;
              if ( gv.dtype === "Formula" ) itemAttributes.push(`${key}..${k}.${gk}`);
            }
          }
        }
      }

      // Delete the original attributes key if using the shorthand syntax.
      if ( !!shorthand ) {
        delete itemData.attributes;
      }
      obj[key] = itemData;
      return obj;
    }, {});
  }

  /* -------------------------------------------- */

  _applyItemsFormulaReplacements(data, itemAttributes, shorthand) {
    for ( let k of itemAttributes ) {
      // Get the item name and separate the key.
      let item = null;
      let itemKey = k.split('..');
      item = itemKey[0];
      k = itemKey[1];

      // Handle group keys.
      let gk = null;
      if ( k.includes('.') ) {
        let attrKey = k.split('.');
        k = attrKey[0];
        gk = attrKey[1];
      }

      let formula = '';
      if ( !!shorthand ) {
        // Handle grouped attributes first.
        if ( data.items[item][k][gk] ) {
          formula = data.items[item][k][gk].replace('@item.', `@items.${item}.`);
          data.items[item][k][gk] = Roll.replaceFormulaData(formula, data);
        }
        // Handle non-grouped attributes.
        else if ( data.items[item][k] ) {
          formula = data.items[item][k].replace('@item.', `@items.${item}.`);
          data.items[item][k] = Roll.replaceFormulaData(formula, data);
        }
      }
      else {
        // Handle grouped attributes first.
        if ( data.items[item]['attributes'][k][gk] ) {
          formula = data.items[item]['attributes'][k][gk]['value'].replace('@item.', `@items.${item}.attributes.`);
          data.items[item]['attributes'][k][gk]['value'] = Roll.replaceFormulaData(formula, data);
        }
        // Handle non-grouped attributes.
        else if ( data.items[item]['attributes'][k]['value'] ) {
          formula = data.items[item]['attributes'][k]['value'].replace('@item.', `@items.${item}.attributes.`);
          data.items[item]['attributes'][k]['value'] = Roll.replaceFormulaData(formula, data);
        }
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Apply replacements for derived formula attributes.
   * @param {Object} data The actor's data object.
   * @param {Array} formulaAttributes Array of attributes that are derived formulas.
   * @param {Boolean} shorthand Whether or not the shorthand syntax is used.
   */
  _applyFormulaReplacements(data, formulaAttributes, shorthand) {
    // Evaluate formula attributes after all other attributes have been handled, including items.
    for ( let k of formulaAttributes ) {
      // Grouped attributes are included as `group.attr`, so we need to split them into new keys.
      let attr = null;
      if ( k.includes('.') ) {
        let attrKey = k.split('.');
        k = attrKey[0];
        attr = attrKey[1];
      }
      // Non-grouped attributes.
      if ( data.attributes[k]?.value ) {
        data.attributes[k].value = Roll.replaceFormulaData(data.attributes[k].value, data);
      }
      // Grouped attributes.
      else if ( attr ) {
        data.attributes[k][attr].value = Roll.replaceFormulaData(data.attributes[k][attr].value, data);
      }

      // Duplicate values to shorthand.
      if ( !!shorthand ) {
        // Non-grouped attributes.
        if ( data.attributes[k]?.value ) {
          data[k] = data.attributes[k].value;
        }
        // Grouped attributes.
        else {
          if ( attr ) {
            // Initialize a group key in case it doesn't exist.
            if ( !data[k] ) {
              data[k] = {};
            }
            data[k][attr] = data.attributes[k][attr].value;
          }
        }
      }
    }
  }
 /* -------------------------------------------- */

 getSkillInfo(skillId) {
  let skl,
    sklName,
    parentSkill,
    isCustom = false;
  //const skillParts = skillId.split("."),
  //  isSubSkill = skillParts[1] === "subSkills" && skillParts.length === 3;
    skl = this.system.skills[skillId];
    //skl = this.system.skills.str.armorop
    //console.log("getSkillInfo(skillId)", skillId, skl, this.system.skills.str.armorop.label)  

    


    if (!skl) return null;
    if (skl.label != null) {
      sklName = skl.label.concat(" [",skl.base,",",skl.good,",",skl.amazing,"] ");
      isCustom = true;
    } else sklName = CONFIG.PF1.skills[skillId];
  

  const result = duplicate(skl);
  result.id = skillId;
  result.name = sklName;
  result.bonus = skl.steps; // deprecated; backwards compatibility

  if (parentSkill) result.parentSkill = parentSkill;

  return result;
}


 /**
   * Roll a Action Check
   * Prompt the user for input regarding Take 10/Take 20 and any Situational Bonus
   *
   * @param {string} skillId      The skill id (e.g. "per", or "prf.subSkills.prf1")
   * @param {object} options      Options which configure how the skill check is rolled
   */
 
 async rollActionCheck(){
let result = {}
    let dice="1d20"
    let totalbonus = this.system.attributes.actchk.step.total


  if (!this.isOwner) {
    const msg = game.i18n.localize("PF1.ErrorNoActorPermissionAlt").format(this.name);
    console.warn(msg);
    return ui.notifications.warn(msg);
  }
  result.roll = await Roll.create(dice.concat(d100stepdie(totalbonus))).evaluate({ async: true });
  //.evaluate({ async: true })
console.log("\n\n\n\n------------------\n\n\n\n",result.roll)
return result
}
get actioncheck(){

return this.system.attributes.actchk


}

  
  /**
   * Roll a Skill Check
   * Prompt the user for input regarding Take 10/Take 20 and any Situational Bonus
   *
   * @param {string} skillId      The skill id (e.g. "per", or "prf.subSkills.prf1")
   * @param {object} options      Options which configure how the skill check is rolled
   */
 
findCrewJob(characterId){
  if (["starship"].includes(this.type)){
  const crew = this.system.crew
  //console.log(crew, characterId)
  for (let[key,job] of Object.entries(crew)){
 //  console.log(key)
    if (job.actorIds?.includes(characterId)) return game.i18n.localize(SFRPG.starshipRoleNames[key])


  }
  }
return null
}
  


rollSkill(
  skillId,
  options = { steps:0, event: null, skipDialog: false, staticRoll: null, chatMessage: true, noSound: false, dice: "1d20",skillflavor:"",stepbonus:0 ,degreeText:{}}
) {
  console.log(skillId,options)
  if (!this.isOwner) {
    const msg = game.i18n.localize("PF1.ErrorNoActorPermissionAlt");//.format(this.name);
    console.warn(msg);
    return ui.notifications.warn(msg);
  }

  const allowed = Hooks.call("actorRoll", this, "skill", skillId, options);
  if (allowed === false) return;


//console.log(this)
  const skl = this.type=="starship"? d100NPCCrewStats(this.system.crew.npcCrewQuality).skills[skillId]: this.getSkillInfo(skillId);
if (this.type=="starship"){
  let name = d100A.skills[skillId]; 
  skl.name = name
  //skl.stepdie = 2
  //options.skipDialog = true

}
 // title: skl.name,
 // flavor :skl.name+" "+skl.stepdie,


  //console.log(skl,skillId )
  
  const rollData = this.getRollData();
 console.log(skl,rollData)
 /* Add contextual attack string
  const noteObjects = this.getContextNotes(`skill.${skillId}`);
  const notes = this.formatContextNotes(noteObjects, rollData);

  // Add untrained note
  if (skl.rt && !skl.rank) {
    notes.push(game.i18n.localize("PF1.Untrained"));
  }

  // Gather changes*/
  const parts = [skl.step," Base, "]
  let stepbonus = skl.step;
  console.log(stepbonus)
  /*
  const changes = this.changes.filter((c) => {
    let cf = getChangeFlat.call(this, c.subTarget, c.modifier);
    if (!(cf instanceof Array)) cf = [cf];

    return cf.includes(`data.skills.${skillId}.changeBonus`);
  });
*/
  // Add Rank modifier
  if (true) {
    parts.push(skl.rank," Rank Bonus, ");
    //stepbonus -= skl.ranks
  }

  if (true) {
    parts.push(options.steps," Range Bonus, ");
    stepbonus += options.steps
  }
  console.log(stepbonus)
/*
  // Add rank
  if (skl.rank > 0) {
    parts.push(`${skl.rank}[${game.i18n.localize("PF1.SkillRankPlural")}]`);
    if (skl.cs) {
      parts.push(`3[${game.i18n.localize("PF1.CSTooltip")}]`);
    }
  }
/*
  // Add armor check penalty
  if (skl.acp && rollData.attributes.acp.total !== 0) {
    parts.push(`-@attributes.acp.total[${game.i18n.localize("PF1.ACPLong")}]`);
  }

  // Add Wound Thresholds info
  if (rollData.attributes.woundThresholds?.penalty > 0) {
    parts.push(
      `- @attributes.woundThresholds.penalty[${game.i18n.localize(
        CONFIG.PF1.woundThresholdConditions[rollData.attributes.woundThresholds.level]
      )}]`
    );
  }

  // Add changes
  for (const c of changes) {
    if (!c.value) continue;
    parts.push(`${c.value}[${c.flavor}]`);
  }
*/
  const props = ["something","2.jghf"];
 
 
 
 
  /*






  if (notes.length > 0) props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });
 */
 console.log( "event:", options.event, 
 "fastForward:", options.skipDialog === true,
  "staticRoll:", options.staticRoll, 
  "parts:", parts, 
  "dice: ", options.dice, 
  "stepbonus", stepbonus,
  "data:", rollData,
  "subject:", { skill: skillId },
  "title: ",skl.name,
  "speaker: ",ChatMessage.getSpeaker({ actor: this }),
  "chatTemplate: ","systems/Alternityd100/templates/chat/roll-ext.hbs",
  "chatTemplateData:", { hasProperties: props.length > 0, properties: props },
  "chatMessage:", options.chatMessage,
  "noSound: ",options.noSound,
  "compendiumEntry: ",null,
  "skill", skl,
  
  )

  let A =  Diced100.skillRoll({
    event: options.event,
    fastForward: options.skipDialog === true,
    staticRoll: options.staticRoll,
    parts,
    stepbonus,
    stepflavor:options.stepflavor,
    skillflavor: options.skillflavor,
    ordinary: skl.base,
    good: skl.good,
    amazing: skl.amazing,
    dice: options.dice,
    data: rollData,
    subject: { skill: skillId },
    title: skl.name,
    flavor :skl.name+" Range/",
    speaker: ChatMessage.getSpeaker({ actor: this }),
    chatTemplate: "systems/Alternityd100/templates/chat/roll-ext.hbs",
    chatTemplateData: { hasProperties: props.length > 0, properties: props },
    chatMessage: options.chatMessage,
    noSound: options.noSound,
    compendiumEntry: null,
    degreeText:options.degreeText,
    hasDegreeText:options.degreeText? true : false
  });

console.log("\nDiced100.skillRoll({\n", A)
let rollresult = {}
  return A

}

/**
   * Generates an array with all the active context-sensitive notes for the given context on this actor.
   *
   * @param {string} context - The context to draw from.
   */
rollSkillObject(item,  options) {
  console.log(this)
const actorData = this.system
 // this.actor.useSpell(item, {configureDialog: !event.shiftKey});
 console.log (item)
const psionic =  item.type == "psionic"
 options.skillflavour = "Hello"
 options.stepflavour = "+0"
let parts = []
let dice=null

let rollData = {}
let skillId = item.name



let title = psionic? item.name + item.psionScore :  item.name + ": " + item.system.skill //was skl.name
let ordinary = psionic? item.ordinary : actorData.skills[item.system.skill].base
let good = psionic? item.good : actorData.skills[item.system.skill].good
let amazing = psionic? item.amazing : actorData.skills[item.system.skill].amazing 
let stepbonus = psionic? 0 : actorData.skills[item.system.skill].step 
options.nosound = false
let hasDegreeText = true
let degreeText = item.system.degreeText
const props = {header:"something",value:"2.jghf",extra:"fsfdg"};
let flavor = item.isSkilled?  actorData.skills[item.system.skill].label + " using" : ""

flavor += (" " + item.name + ". ")

 let A =  Diced100.skillRoll({
  event: options.event,
  fastForward: !(options.skipDialog === true),
  staticRoll: options.staticRoll,
  parts,
  stepbonus,
  stepflavor:options.stepflavor,
  skillflavor: options.skillflavor,
  ordinary: ordinary,
  good: good,
  amazing: amazing,
  dice: options.dice,
  data: rollData,
  subject: { skill: skillId },
  title: title,
  flavor : flavor,
  speaker: ChatMessage.getSpeaker({ actor: this }),
  chatTemplate: "systems/Alternityd100/templates/chat/roll-ext.hbs",
  chatTemplateData: { hasProperties: props.length > 0, properties: props },
  chatMessage: "Hello" + options.chatMessage,
  noSound: options.noSound,
  compendiumEntry: null,
  hasDegreeText,
  degreeText
});

console.log("\nDiced100.skillRoll({\n", A)
let rollresult = {}
return A

}


/**
   * Generates an array with all the active context-sensitive notes for the given context on this actor.
   *
   * @param {string} context - The context to draw from.
   */
 getContextNotes(context) {
  const result = this.allNotes;

  // Attacks
  if (context.match(/^attacks\.(.+)/)) {
    const key = RegExp.$1;
    for (const note of result) {
      note.notes = note.notes
        .filter((o) => {
          return o.subTarget === key;
        })
        .map((o) => {
          return o.text;
        });
    }

    return result;
  }

  // Skill
  if (context.match(/^skill\.(.+)/)) {
    const skillKey = RegExp.$1;
 
    const skill = this.getSkillInfo(skillKey);
    console.log(skillKey, skill)  
    const ability = skill.statid;
    for (const note of result) {
      note.notes = note.notes
        .filter((o) => {
          return (
            // Check for skill.context or skill.xyz.subSkills.context
            o.subTarget === context ||
            o.subTarget?.split(".")?.[3] === context?.split(".")?.[1] ||
            o.subTarget === `${ability}Skills` ||
            o.subTarget === "skills"
          );
        })
        .map((o) => {
          return o.text;
        });
    }

    return result;
  }

  // Saving throws
  if (context.match(/^savingThrow\.(.+)/)) {
    const saveKey = RegExp.$1;
    for (const note of result) {
      note.notes = note.notes
        .filter((o) => {
          return o.subTarget === saveKey || o.subTarget === "allSavingThrows";
        })
        .map((o) => {
          return o.text;
        });
    }

    if (this.system.attributes.saveNotes != null && this.system.attributes.saveNotes !== "") {
      result.push({ notes: [this.system.attributes.saveNotes], item: null });
    }

    return result;
  }

  // Ability checks
  if (context.match(/^abilityChecks\.(.+)/)) {
    const ablKey = RegExp.$1;
    for (const note of result) {
      note.notes = note.notes
        .filter((o) => {
          return o.subTarget === `${ablKey}Checks` || o.subTarget === "allChecks";
        })
        .map((o) => {
          return o.text;
        });
    }

    return result;
  }

  // Misc
  if (context.match(/^misc\.(.+)/)) {
    const miscKey = RegExp.$1;
    for (const note of result) {
      note.notes = note.notes
        .filter((o) => {
          return o.subTarget === miscKey;
        })
        .map((o) => {
          return o.text;
        });
    }

    return result;
  }

  if (context.match(/^spell\.concentration\.([a-z]+)$/)) {
    const spellbookKey = RegExp.$1;
    for (const note of result) {
      note.notes = note.notes
        .filter((o) => {
          return o.subTarget === "concentration";
        })
        .map((o) => {
          return o.text;
        });
    }

    const spellbookNotes = getProperty(
      this.data,
      `data.attributes.spells.spellbooks.${spellbookKey}.concentrationNotes`
    );
    if (spellbookNotes.length) {
      result.push({ notes: spellbookNotes.split(/[\n\r]+/), item: null });
    }

    return result;
  }

  if (context.match(/^spell\.cl\.([a-z]+)$/)) {
    const spellbookKey = RegExp.$1;
    for (const note of result) {
      note.notes = note.notes
        .filter((o) => {
          return o.subTarget === "cl";
        })
        .map((o) => {
          return o.text;
        });
    }

    const spellbookNotes = getProperty(this.data, `data.attributes.spells.spellbooks.${spellbookKey}.clNotes`);
    if (spellbookNotes.length) {
      result.push({ notes: spellbookNotes.split(/[\n\r]+/), item: null });
    }

    return result;
  }

  if (context.match(/^spell\.effect$/)) {
    for (const note of result) {
      note.notes = note.notes.filter((o) => o.subTarget === "spellEffect").map((o) => o.text);
    }

    return result;
  }

  return [];
}

    /** Roll contexts */
    setupRollContexts(rollContext, desiredSelectors = []) {
      if (!this.system) {
          return;
      }

      const actorData = this.system;
      if (actorData.type === "vehicle") {
          if (!actorData.crew.useNPCCrew) {
              /** Add player pilot if available. */
              if (actorData.crew.pilot?.actors?.length > 0) {
                  const pilotActor = actorData.crew.pilot.actors[0];
                  let pilotData = null;
                  if (pilotActor instanceof ActorSFRPG) {
                      pilotData = pilotActor;
                  } else {
                      pilotData = pilotActor;
                  }
                  rollContext.addContext("pilot", pilotActor, pilotData);
              }
          }
      }
      else if (actorData.type === "starship") {
          if (!actorData.crew.useNPCCrew) {
              /** Add player captain if available. */
              if (actorData.crew.captain?.actors?.length > 0) {
                  const actor = actorData.crew.captain.actors[0];
                  let crewActorData = null;
                  if (actor instanceof d100Actor) {
                      crewActorData = actor.system;
                  } else {
                      crewActorData = actor.system;
                  }
                  rollContext.addContext("captain", actor, crewActorData);
              }
      
              /** Add player pilot if available. */
              if (actorData.crew.pilot?.actors?.length > 0) {
                  const actor = actorData.crew.pilot.actors[0];
                  let crewActorData = null;
                  if (actor instanceof d100Actor) {
                      crewActorData = actor.system;
                  } else {
                      crewActorData = actor.system;
                  }
                  rollContext.addContext("pilot", actor, crewActorData);
              }
      
              /** Add remaining roles if available. */
              const crewMates = ["copilot", "navigation","communications","damageControl","defences", "gunner", "engineer", "sensors","chiefMate", "magicOfficer", "passenger", "scienceOfficer", "minorCrew", "openCrew"];
              const allCrewMates = ["minorCrew", "openCrew"];
              for (const crewType of crewMates) {
                  let crewCount = 1;
                  const crew = [];
                  if (allCrewMates.includes(crewType)) {
                      for (const crewEntries of Object.values(actorData.crew)) {
                          const crewList = crewEntries.actors;
                          if (crewList && crewList.length > 0) {
                              for (const actor of crewList) {
                                  let crewActorData = null;
                                  if (actor instanceof d100Actor) {
                                      crewActorData = actor.system;
                                  } else {
                                      crewActorData = actor.data;
                                  }

                                  const contextId = crewType + crewCount;
                                  rollContext.addContext(contextId, actor, crewActorData);
                                  crew.push(contextId);
                                  crewCount += 1;
                              }
                          }
                      }
                  } else {
                      const crewList = actorData.crew[crewType].actors;
                      if (crewList && crewList.length > 0) {
                          for (const actor of crewList) {
                              let crewActorData = null;
                              if (actor instanceof d100Actor) {
                                  crewActorData = actor.system;
                              } else {
                                  crewActorData = actor.system;
                              }

                              const contextId = crewType + crewCount;
                              rollContext.addContext(contextId, actor, crewActorData);
                              crew.push(contextId);
                              crewCount += 1;
                          }
                      }
                  }
      
                  if (desiredSelectors.includes(crewType)) {
                      rollContext.addSelector(crewType, crew);
                  }
              }
          } else {
              /** Create 'fake' actors. */
              rollContext.addContext("captain", this, actorData.crew.npcData.captain);
              rollContext.addContext("pilot", this, actorData.crew.npcData.pilot);
              rollContext.addContext("gunner", this, actorData.crew.npcData.gunner);
              rollContext.addContext("engineer", this, actorData.crew.npcData.engineer);
             // rollContext.addContext("chiefMate", this, actorData.crew.npcData.chiefMate);
             // rollContext.addContext("magicOfficer", this, actorData.crew.npcData.magicOfficer);
             // rollContext.addContext("scienceOfficer", this, actorData.crew.npcData.scienceOfficer);
          }
      }
  }




}

Hooks.on("afterClosureProcessed", async (closureName, fact) => {
  if (closureName == "process-actors") {
    
   // console.log("closureName, fact",closureName, fact)

     // await fact.actor.processItemData();
  }
});
/*
export function d100stepdie(step) {
  var die = "";
  if(step < -4){die="-1d20"}
  if(step == -4){die="-1d12"}
  if(step == -3){die="-1d8"}
  if(step == -2){die="-1d6"}
  if(step == -1){die="-1d4"}
  if(step == 0){die="+d0"}
  if(step == 1){die="+1d4"}
  if(step == 2){die="+1d6"}
  if(step == 3){die="+1d8"}
  if(step == 4){die="+1d12"}
  if(step == 5){die="+1d20"}
  if(step == 6){die="+2d20"}
  if(step > 6){die="+3d20"}
  return die;   // The function returns the product of p1 and p2
}
export function d100resmod(stat) {
  var mod = "";
  if(stat < 5) return -2; 
  if(stat < 7) return -1; 
  if(stat < 11) return 0; 
  if(stat < 13) return 1; 
  if(stat < 15) return 2; 
  if(stat < 17) return 3; 
  if(stat < 19) return 4; 
  return 5; 

   }*/
