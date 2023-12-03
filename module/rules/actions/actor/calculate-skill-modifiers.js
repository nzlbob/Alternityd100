import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../../../modifiers/types.js";
import { d100stepdie } from "../../../../module/modifiers/d100mod.js";

export default function (engine) {
    engine.closures.add('calculateSkillModifiers', (fact, context) => {
        const skills = fact.actor.system.skills;
        const flags = fact.flags;
        const modifiers = fact.modifiers;





        const addModifier = (bonus, data, item, localizationKey) => {
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

        const filteredMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ABILITY_SKILLS, SFRPGEffectType.SKILL, SFRPGEffectType.ALL_SKILLS].includes(mod.effectType);
        });

        console.log("n\calculateSkillModifiers\n","\nskills\n",skills,"\nflags\n",flags,"\nmodifiers\n",modifiers,"\nfilteredMods\n",filteredMods)


for (let mofifier of filteredMods){
if(mofifier.enabled && mofifier.valueAffected){

    console.log(mofifier,skills[mofifier.valueAffected])
    skills[mofifier.valueAffected].step = skills[mofifier.valueAffected].step +  parseInt(mofifier.modifier,10)

    skills[mofifier.valueAffected].stepdie = d100stepdie(skills[mofifier.valueAffected].step);
}

}


/* old skill thing
        // Skills
        for (let [skl, skill] of Object.entries(skills)) {
            skill.rolledMods = null;
            const mods = context.parameters.stackModifiers.process(filteredMods.filter(mod => {
                if (mod.effectType === SFRPGEffectType.ALL_SKILLS) return true;
                else if (mod.effectType === SFRPGEffectType.SKILL && skl === mod.valueAffected) return true;
                else if (mod.effectType === SFRPGEffectType.ABILITY_SKILLS && skill.ability === mod.valueAffected) return true;
                
                return false;
            }), context);


            let accumulator = Object.entries(mods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, fact.data, skill, "SFRPG.SkillModifierTooltip");
                    }
                } else {
                    sum += addModifier(mod[1], fact.data, skill, "SFRPG.SkillModifierTooltip");
                }

                return sum;
            }, 0);
            
            skill.mod += accumulator;
        }
*/
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
