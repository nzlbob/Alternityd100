import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateResistanceModifiers", (fact, context) => {

        //console.log("----------ResmoD---------",fact, context)
        const data = fact.actor.system;
//Resistance modifier bonus from Skills
// Strength
if(data.skills.powerma.ranks>3) data.abilities.str.mod = data.abilities.str.modBase +1;
if(data.skills.powerma.ranks>7) data.abilities.str.mod = data.abilities.str.modBase +1;
if(data.skills.powerma.ranks>11) data.abilities.str.mod = data.abilities.str.modBase +1;
// Dex
if(data.skills.powerma.ranks>3) data.abilities.dex.mod = data.abilities.dex.modBase +1;
if(data.skills.powerma.ranks>7) data.abilities.dex.mod = data.abilities.dex.modBase +1;
if(data.skills.powerma.ranks>11) data.abilities.dex.mod = data.abilities.dex.modBase +1;
//Int
if(data.skills.deduc.ranks>3) data.abilities.int.mod = data.abilities.int.modBase +1;
if(data.skills.deduc.ranks>7) data.abilities.int.mod = data.abilities.int.modBase +1;
if(data.skills.deduc.ranks>11) data.abilities.int.mod = data.abilities.int.modBase +1;
//Will
if(data.skills.mentare.ranks>3) data.abilities.wil.mod = data.abilities.wil.modBase +1;
if(data.skills.mentare.ranks>7) data.abilities.wil.mod = data.abilities.wil.modBase +1;
if(data.skills.mentare.ranks>11) data.abilities.wil.mod = data.abilities.wil.modBase +1;

/*        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

            let computedBonus = 0;
            try {
                const roll = Roll.create(bonus.modifier.toString(), data).evaluate({maximize: true});
                computedBonus = roll.total;
            } catch {}

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }
            
            return computedBonus;
        };
        
        // Iterate through any modifiers that affect BAB
        let filteredModifiers = fact.modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && mod.effectType == SFRPGEffectType.BASE_ATTACK_BONUS;
        });
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);

        let bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, data.attributes.baseAttackBonus, "SFRPG.AbilityScoreBonusTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, data.attributes.baseAttackBonus, "SFRPG.AbilityScoreBonusTooltip");
            }

            return sum;
        }, 0);

        data.attributes.bab = data.attributes.baseAttackBonus.value + bonus;
        data.attributes.baseAttackBonus.value += bonus;
        */
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}