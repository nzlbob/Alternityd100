import { SFRPG } from "../../../config.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAbilityScore", (fact, context) => {
        const data = fact.actor.system;
        const modifiers = fact.modifiers;
        const races = fact.races;
//console.log(fact, context)
        const perkData = fact?.perk?.system;
        const flawData = fact?.flaw?.system;
        const achievementData = fact?.achievement?.system;
        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

           // let computedBonus = parseInt(bonus.modifier, 10);
           let computedBonus = 0;
            try {
                const roll = Roll.create(bonus.modifier.toString(), data).evaluateSync({maximize: true});
                computedBonus = roll.total;
                } catch {}

            console.log (computedBonus,fact)
            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.toString(),
                    source: bonus.name
                }));
            }
            
            return computedBonus;
        };

        const filteredMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ABILITY_SCORE].includes(mod.effectType);
        })

        let perkMod = {};
        if(perkData?.abilityMod) {
            perkMod[perkData.abilityMod.ability] = perkData.abilityMod.mod;
        }

        let flawMod = {};
        if(flawData?.abilityMod) {
            flawMod[flawData.abilityMod.ability] = flawData.abilityMod.mod;
        }

        let achievementMod = {};
        if(achievementData?.abilityMod) {
            achievementMod[achievementData.abilityMod.ability] = achievementData.abilityMod.mod;
        }

        /*
        let racesMod = {};
        for (let race of races) {
            const raceData = race.system;
            for(let raceMod of raceData.abilityMods.parts) {
                racesMod[raceMod[1]] = racesMod[raceMod[1]] !== undefined ? racesMod[raceMod[1]] + raceMod[0] : raceMod[0];
            }
        }
*/
        let abilityScoreIncreasesMod = {};
        const asis = fact.asis?.filter(x => x.type === "asi") || [];
        for (let asi of asis) {
            const asiData = asi.system;

            for (let ability of Object.keys(SFRPG.abilities)) {
                if (asiData.abilities[ability]) {
                    if (!(ability in abilityScoreIncreasesMod)) {
                        abilityScoreIncreasesMod[ability] = 1;
                    } else {
                        abilityScoreIncreasesMod[ability] += 1;
                    }
                }
            }
        }

        for (let [abl, ability] of Object.entries(data.abilities)) {

            const abilityMods = context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl), 
                context
            );

            let score = ability.base ? ability.base : 0;
            
            ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreBaseTooltip", { mod: score.toString() }));

            const modFromPerk = perkMod[abl] ?? 0;
            if(modFromPerk) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScorePerkTooltip", { mod: modFromPerk.toString() }));
            }

            const modFromFlaw = flawMod[abl] ?? 0;
            if(modFromFlaw) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreFlawTooltip", { mod: modFromFlaw.toString() }));
            }
            const modFromAchievement = achievementMod[abl] ?? 0;
            if(modFromAchievement) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreAchievementTooltip", { mod: modFromAchievement.toString() }));
            }
/*
            const modFromRace = racesMod[abl] ?? 0;
            if(modFromRace) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreRaceTooltip", { mod: modFromRace.toString() }));
            }
*/
            let intermediateScore = score + modFromPerk + modFromFlaw + modFromAchievement //+  modFromRace;
            if (abl in abilityScoreIncreasesMod) {
                for (let i = 0; i<abilityScoreIncreasesMod[abl]; i++) {
                    if (intermediateScore <= 16) {
                        intermediateScore += 2;
                    } else {
                        intermediateScore += 1;
                    }
                }
            }

            const raisedByASI = intermediateScore - (score + modFromPerk + modFromFlaw + modFromAchievement /*+ modFromRace*/);
            if(raisedByASI) {
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityScoreIncreaseTooltip", { mod: raisedByASI.toString() }));
            }

            if (ability.userPenalty) {
                let userPenalty = -Math.abs(ability.userPenalty);
                score += userPenalty;
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityPenaltyTooltip", { mod: userPenalty.toString() }));
            }

            if (ability.drain) {
                let drain = -Math.abs(ability.drain);
                score += drain;
                ability.tooltip.push(game.i18n.format("SFRPG.AbilityDrainTooltip", { mod: drain.toString() }));
            }

            let bonus = Object.entries(abilityMods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, data, ability, "SFRPG.AbilityScoreBonusTooltip");
                    }
                } else {
                    sum += addModifier(mod[1], data, ability, "SFRPG.AbilityScoreBonusTooltip");
                }

                return sum;
            }, 0);

            ability.value = score /*+ modFromRace*/ + modFromPerk + modFromFlaw + modFromAchievement +raisedByASI + bonus;
        }
//console.log("Wghats my strength - ", data.abilities.str.value)
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}