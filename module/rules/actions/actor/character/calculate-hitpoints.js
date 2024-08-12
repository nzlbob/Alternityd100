import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateHitpoints", (fact, context) => {
        const data = fact.actor.system;
        console.log(fact,context)
       if(["character","npc"].includes(fact.actor.type)){
        data.attributes.mor.base = Math.ceil(data.abilities.con.value/2);
        data.attributes.wou.base = data.abilities.con.value;
        data.attributes.stu.base = data.abilities.con.value;
    }
        

      

        
       // console.log(fact,context)
        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }
            
            let computedBonus = parseInt(bonus.modifier, 10);
            //  try {
                 // const roll = Roll.create(bonus.modifier.toString(), data).evaluate({maximize: true});
                 // computedBonus = roll.total;
           //   } catch {}
           console.log(computedBonus,bonus,localizationKey)
            if (computedBonus !== 0 && localizationKey) {
               // console.log(item)
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.toString(),
                    source: bonus.name
                }));
            }
            
            return computedBonus;
        };
        let hpMaxStu = data.attributes.stu.base;
        let hpMaxWou = data.attributes.wou.base;
        let hpMaxMor = data.attributes.mor.base; 
        let hpMaxCri = 0
       
        console.log("fact", fact,"\nData", data,"\n")
        if (fact.type == "starship"){
            //hpMaxCri = data.attributes.cri.base;
            if(fact.actor.system.frame.system){
            //console.log("fact", fact,"\nData", fact.actor.system.frame.data,"\n")
            hpMaxStu = data.frame.system.attributes.stu.base;
            hpMaxWou = data.frame.system.attributes.wou.base;
            hpMaxMor = data.frame.system.attributes.mor.base; 
            hpMaxCri = data.frame.system.attributes.cri.base; 
        }
    }

       if (fact.type == "character"){

        hpMaxStu = data.attributes.stu.base; // Race HP + (Class HP per level * Class Level) + Modifiers
        hpMaxWou = data.attributes.wou.base;
        hpMaxMor = data.attributes.mor.base;
       }

        /*
        // Race bonus
        if (fact.races && fact.races.length > 0) {
            for (const race of fact.races) {
                const raceData = race.system;

                hpMax += raceData.hp.value;

                data.attributes.hp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Hitpoints.RacialTooltip", {
                    mod: raceData.hp.value,
                    source: race.name
                }));
            }
        }

        // Class bonus
        if (fact.classes && fact.classes.length > 0) {
            for (const cls of fact.classes) {
                const classData = cls.system;

                let classBonus = Math.floor(classData.levels * classData.hp.value);
                hpMax += classBonus;

                data.attributes.hp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Hitpoints.ClassTooltip", {
                    mod: classBonus,
                    source: cls.name
                }));
            }
        }
        */
        // Iterate through any modifiers that affect HP
        let filteredModifiers = fact.modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "roll") && mod.effectType == SFRPGEffectType.HIT_POINTS;
        });
       // console.log("filteredModifiers", filteredModifiers,context)
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);
        console.log ("\nfilteredModifiers\n", filteredModifiers)
        
        //Stin
        


        // These Calculations only work for untypes bonus's. As Alternity doesn't have bonus "types" it can probably be altered
        let bonusStu = Object.entries(filteredModifiers).reduce((sum, mod) => {
            console.log("mod\n" ,mod,"\nmod 0\n" , mod[0],"\nmod 1\n" ,mod[1]) // (2) ['ability', null] 'ability' null
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    console.log("\nbonus\n" ,bonus)
                    if(bonus.valueAffected == "stu") sum += addModifier(bonus, data, data.attributes.stu, "SFRPG.AbilityScoreBonusTooltip");
                }
            } else {
          //console.log(bonus);
                if(bonus.valueAffected == "stu") sum += addModifier(mod[1], data, data.attributes.stu, "SFRPG.AbilityScoreBonusTooltip");
            }
          //  console.log(sum, mod)
            return sum;
        }, 0);
        let bonusWou = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1 ) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    if(bonus.valueAffected == "wou")  sum += addModifier(bonus, data, data.attributes.wou, "SFRPG.AbilityScoreBonusTooltip");
                }
            } else {
                if(bonus.valueAffected == "wou") sum += addModifier(mod[1], data, data.attributes.wou, "SFRPG.AbilityScoreBonusTooltip");
            }

            return sum;
        }, 0);
        let bonusMor = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1 ) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    if(bonus.valueAffected == "mor") sum += addModifier(bonus, data, data.attributes.mor, "SFRPG.AbilityScoreBonusTooltip");
                }
            } else {
                if(bonus.valueAffected == "mor") sum += addModifier(mod[1], data, data.attributes.mor, "SFRPG.AbilityScoreBonusTooltip");
            }

            return sum;
        }, 0);

        hpMaxStu += bonusStu;
        hpMaxWou += bonusWou;
        hpMaxMor += bonusMor;
        if (fact.type == "starship"){hpMaxCri += bonusMor};
        data.attributes.stu.max = hpMaxStu;
        data.attributes.wou.max = hpMaxWou;
        data.attributes.mor.max = hpMaxMor;
        if (fact.type == "starship"){data.attributes.cri.max = hpMaxCri};
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}