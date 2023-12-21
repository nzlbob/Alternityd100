import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";
import { addModifier, d100resmod } from "../../../modifiers/d100mod.js";

export default function (engine) {
    engine.closures.add("calculateResistanceModifiers", (fact, context) => {


        console.log("----------ResmoD---------",fact, context)
        const data = fact.actor.system;
        const modifiers = fact.modifiers;
        data.abilities.str? console.log("OK") : console.log("Bad", fact) 
        data.abilities.str.modBase= d100resmod(data.abilities.str.value);
        data.abilities.con.modBase= d100resmod(data.abilities.con.value);
        data.abilities.dex.modBase= d100resmod(data.abilities.dex.value);
        data.abilities.int.modBase= d100resmod(data.abilities.int.value);
        data.abilities.wil.modBase= d100resmod(data.abilities.wil.value);
        data.abilities.per.modBase= d100resmod(data.abilities.per.value);


/*
        "resModBase":0,
        "resModValue":0,
        "resModBonus":0
*/
//Resistance modifier bonus from Skills
//console.log(data.abilities.int)
// Strength
for (let [abl, ability] of Object.entries(data.abilities)) {



}
let bonus = {}

if(data.skills.powerma.ranks>3) bonus.str = {modifier:1,modifierType:"constant",name:"Power Martial Arts",valuaAffected:"str",type:"untyped"};
if(data.skills.powerma.ranks>7) bonus.str.modifier = 2;
if(data.skills.powerma.ranks>11) bonus.str.modifier = 3;;
// Dex
if(data.skills.powerma.ranks>3) bonus.dex = {modifier:1,modifierType:"constant",name:"Power Martial Art",valuaAffected:"dex",type:"untyped"};;
if(data.skills.powerma.ranks>7) bonus.dex.modifier = 2;
if(data.skills.powerma.ranks>11) bonus.dex.modifier = 3;
//Int
if(data.skills.deduc.ranks>3) bonus.int = {modifier:1,modifierType:"constant",name:"Deduction",valuaAffected:"int",type:"untyped"};;
if(data.skills.deduc.ranks>7) bonus.int.modifier = 2;
if(data.skills.deduc.ranks>11) bonus.int.modifier = 3;
//Will
if(data.skills.mentare.ranks>3) bonus.wil = {modifier:1,modifierType:"constant",name:"Mental Resolve",valuaAffected:"wil",type:"untyped"};;
if(data.skills.mentare.ranks>7) bonus.wil.modifier = 2;
if(data.skills.mentare.ranks>11) bonus.wil.modifier = 3;





let Skillmod = {}
for (let [abl, ability] of Object.entries(data.abilities)) {
    Skillmod[abl] = 0
   if (bonus[abl]) Skillmod[abl] =  addModifier(bonus[abl], data, ability, "SFRPG.AbilityModifiersTooltip");

 //   console.log("Skillmod[abl] ",Skillmod[abl] ,bonus[abl] )
}


        
        const filteredMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.AC, SFRPGEffectType.AC].includes(mod.effectType);
        })
      //      console.log("filteredMods",filteredMods)
        for (let [abl, ability] of Object.entries(data.abilities)) {

            const abilityMods = context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl /*|| mod.effectType === SFRPGEffectType.ABILITY_MODIFIERS*/), 
                context
            );

            let abilityValue = ability.value;
            if (Number.isNaN(Number.parseInt(abilityValue))) {
                abilityValue = 10;
            }
         //   console.log(abilityMods)
            const baseMod = Math.floor((abilityValue - 10) / 2);
            //ability.modifierTooltip.push(game.i18n.format("SFRPG.AbilityModifierBase", { mod: baseMod.signedString() }));

            let mod = Object.entries(abilityMods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
        //            console.log(bonus)
                           sum += addModifier(bonus, data, ability, "SFRPG.AbilityModifiersTooltip");
                    }
                } else {
                    sum += addModifier(mod[1], data, ability, "SFRPG.AbilityModifiersTooltip");
                }

                return sum;
            }, 0);
            
            let resistanceModifier = baseMod + mod;

            if (ability.damage) {
                let damage = -Math.floor(Math.abs(ability.damage) / 2);
                resistanceModifier += damage;
                ability.modifierTooltip.push(game.i18n.format("SFRPG.AbilityDamageTooltip", { mod: damage.signedString() }));
            }
            ability.resModBonus = mod
            ability.resModValue = resistanceModifier + Skillmod[abl];
            ability.resModBase = baseMod
            ability.mod = resistanceModifier + Skillmod[abl]
        }

        return fact;

    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}