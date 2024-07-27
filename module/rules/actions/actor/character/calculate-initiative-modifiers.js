import { addModifier } from "../../../../modifiers/d100mod.js";
import { SFRPGModifierType, SFRPGEffectType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateInitiativeModifiers", (fact, context) => {
        const data = fact.actor.system;
        const init = data.attributes.actchk;
        const modifiers = fact.modifiers;

        init.base = Math.floor(( data.abilities.dex.value+data.abilities.int.value)/2);
        //init.ordinary = actorData.attributes.actchk.base ;
        //init.marginal = actorData.attributes.actchk.ordinary +1;
        //init.good = Math.floor((actorData.attributes.actchk.ordinary)/2);
        //init.amazing = Math.floor((actorData.attributes.actchk.good)/2);
        init.die = "";
        const conwil=data.abilities.con.value+data.abilities.wil.value;
        if (conwil>7) {data.attributes.actchk.aprbase = 1};
        if (conwil>15) {data.attributes.actchk.aprbase = 2};
        if (conwil>23) {data.attributes.actchk.aprbase = 3};
        if (conwil>31) {data.attributes.actchk.aprbase = 4};
        
        data.attributes.actchk.apr = data.attributes.actchk.aprbase;


        const filteredMods = modifiers.filter(mod => {
            
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.INITIATIVE,SFRPGEffectType.ALL_ACTIONS].includes(mod.effectType);
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
                    
                    
                    if((bonus.valueAffected == "steps") || (bonus.effectType=="all-actions") ) { 
                        let a = addModifier(bonus, data, init.step, "SFRPG.InitiativeModiferTooltip")
                //        console.log("Hello" ,a ,bonus, data, init.step)
                        
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
    init.step.tooltip.push(game.i18n.format("SFRPG.AbilityScorePerkTooltip", { mod: modFromPerk.toString() }));
}


//let a = addModifier(bonus, data, init.step, "SFRPG.InitiativeModiferTooltip")
let mortalDamage = 0
if (data.attributes.mor.value<data.attributes.mor.max){
   mortalDamage = data.attributes.mor.max - data.attributes.mor.value

    init.step.tooltip.push(game.i18n.format("Mortal Damage: " + mortalDamage.toString())) 
}
const filteredIMortal = modifiers.filter(mod => {     
    return mod.enabled  && [SFRPGEffectType.IGNORE_MORTAL].includes(mod.effectType);
});
//console.log(filteredIMortal)
let IM = 0
for ( let modIM of filteredIMortal){
IM -=  parseInt(modIM.modifier)
//console.log (modIM,modIM.modifier,parseInt(modIM.modifier),IM)
init.step.tooltip.push(game.i18n.format("<br>Ignore Mortal: " + (0-parseInt(modIM.modifier)).toString())) 

}

init.step.base = 0 + modFromPerk // + modFromFlaw
let mortalPenalty = Math.max(0, mortalDamage + IM)
//console.log (mortalPenalty)
init.step.bonus = steps + mortalPenalty
init.step.total = init.step.bonus + init.step.base

//console.log(init,init.step.bonus,init.step.total,steps,)




        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}