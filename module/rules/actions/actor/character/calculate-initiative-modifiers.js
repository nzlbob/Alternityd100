import { addModifier } from "../../../../modifiers/d100mod.js";
import { SFRPGModifierType, SFRPGEffectType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateInitiativeModifiers", (fact, context) => {
        const data = fact.actor.system;
        const init = data.attributes.actchk;
        const modifiers = fact.modifiers;

        const filteredMods = modifiers.filter(mod => {
            
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.INITIATIVE].includes(mod.effectType);
        });
      //  console.log( "------filteredMods------",  context, filteredMods)  // Looking for [1].valueAffected
        const mods = context.parameters.stackModifiers.process(filteredMods, context);
      //  console.log( "------Mods------",mods) // This is a bunch of array objects with the type of bonus. Alternity are all untyped

        const mod = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    if(bonus.valueAffected == "bonus")  prev += addModifier(bonus, data, init, "SFRPG.InitiativeModiferTooltip");
                }
            } else {
                if(bonus.valueAffected == "bonus") prev += addModifier(curr[1], data, init, "SFRPG.InitiativeModiferTooltip");
            }
            return prev;
        }, 0);

        const steps = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    
                    console
                    if(bonus.valueAffected == "steps") { 
                        let a = addModifier(bonus, data, init.step, "SFRPG.InitiativeModiferTooltip")
                     //   console.log("Hello" ,a ,bonus, data, init.step)
                        
                        prev += a //addModifier(bonus, data, init.step, "SFRPG.InitiativeModiferTooltip");
                }
                }
            } else {
                if(bonus.valueAffected == "steps") prev += addModifier(curr[1], data, init.step, "SFRPG.InitiativeModiferTooltip");
            }
            return prev;
        }, 0);

        init.bonus = mod;
        init.ordinary = init.base + init.bonus ;
        init.marginal = init.ordinary +1;
        init.good = Math.floor((init.ordinary)/2);
        init.amazing = Math.floor((init.good)/2);



// Modification for Action per round

        const filteredModsA = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ACTIONS].includes(mod.effectType);
        });
        const modsA = context.parameters.stackModifiers.process(filteredModsA, context);
        const modA = Object.entries(modsA).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    prev += addModifier(bonus, data, init, "SFRPG.ActionsModiferTooltip");
                }
            } else {
                prev += addModifier(curr[1], data, init, "SFRPG.ActionsModiferTooltip");
            }
            return prev;
        }, 0);

        init.aprbonus = modA;
        init.apr = init.aprbase + init.aprbonus ;

// Modification for Action Check Bonus die

const perkData = fact?.perk?.system;
let perkMod = 0;
if(perkData?.acb) {
    perkMod = perkData.acb;
}

const modFromPerk = perkMod ?? 0;
if(modFromPerk) {
    init.step.tooltip.push(game.i18n.format("SFRPG.AbilityScorePerkTooltip", { mod: modFromPerk.signedString() }));
}

init.step.base = 0 + modFromPerk // + modFromFlaw
        

init.step.bonus = steps
init.step.total = steps + init.step.base

//console.log(init)




        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}