import { SFRPG } from "../../../config.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes} from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add( "calculateMovementSpeeds", (fact, context) => {
        const data = fact.actor.system;
        const modifiers = fact.modifiers;
        const speed = data.attributes.speed
//console.log("calculateMovementSpeeds")

        //Combat Movement 
  
  let strdex=data.abilities.str.value+data.abilities.dex.value;

  if (strdex<8) {speed.sprint.base = 6};
  if (strdex<33) {speed.sprint.base = Math.floor(strdex/2)*2};
  if (strdex>32) {speed.sprint.base = 32};

  speed.glide.base = speed.sprint.base;
  speed.fly.base = speed.sprint.base*2;
  //speed.fly.base = 100;
  
 // if (speed.sprint.base<8) {speed.run.base = 4;speed.walk.base = 2};
 // if (speed.sprint.base>7) {speed.run.base = speed.sprint.base -4;speed.walk.base = 2};
 // if (speed.sprint.base>15) {speed.run.base = speed.sprint.base -6;speed.walk.base = 4};
// if (speed.sprint.base>19) {speed.run.base = speed.sprint.base -8};
 // if (speed.sprint.base>23) {speed.walk.base = 6};
 // if (speed.sprint.base>25) {speed.run.base = speed.sprint.base -10};
 // if (speed.sprint.base>29) {speed.walk.base = 8};

  speed.walk.base = Math.floor(speed.sprint.base / 4);
  speed.run.base = speed.walk.base * 3 ;
  

  speed.swim.base = speed.walk.base;
  speed.easyswim.base = speed.walk.base/2;

        const addModifier = (bonus, data, item, localizationKey, speedKey) => {
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

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    speed: SFRPG.speeds[speedKey],
                    type: bonus.type.capitalize(),
                    mod: computedBonus.toString(),
                    source: bonus.name
                }));
            }
            
            return computedBonus;
        };

//look at this when doing Armor 

        const armorSpeed = fact.armor?.system?.armor?.speedAdjust || 0;
        if (armorSpeed) {
            speed.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Modifiers.Tooltips.Speed", {
                speed: game.i18n.localize("SFRPG.ActorSheet.Attributes.Speed.Types.All"),
                type: SFRPG.modifierTypes["armor"],
                mod: armorSpeed.toString(),
                source: fact.armor.name
            }));
        }
        
        for (const speedKey of Object.keys(SFRPG.speeds)) {
            if (speedKey === "special") {
                continue;
            }

            const baseValue = Number(speed[speedKey].base);

            let filteredModifiers = fact.modifiers.filter(mod => {
                return (mod.enabled || mod.modifierType === "formula") && (mod.effectType === SFRPGEffectType.ALL_SPEEDS || (mod.effectType === SFRPGEffectType.SPECIFIC_SPEED && mod.valueAffected === speedKey));
            });
            filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);
    
            let filteredMultiplyModifiers = fact.modifiers.filter(mod => {
                return (mod.enabled || mod.modifierType === "formula") && mod.effectType === SFRPGEffectType.MULTIPLY_ALL_SPEEDS;
            });
            filteredMultiplyModifiers = context.parameters.stackModifiers.process(filteredMultiplyModifiers, context);

            const bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;
    
                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, data, speed, "SFRPG.ActorSheet.Modifiers.Tooltips.Speed", speedKey);
                    }
                } else {
                    sum += addModifier(mod[1], data, speed, "SFRPG.ActorSheet.Modifiers.Tooltips.Speed", speedKey);
                }
    
                return sum;
            }, 0);

            speed[speedKey].value = Math.max(0, baseValue + armorSpeed + bonus);

            for(const modifier of Object.values(filteredMultiplyModifiers)) {
                if (!modifier || !modifier.length) {
                    continue;
                }

                for (const modifierBonus of modifier) {
                    if (modifierBonus.modifierType === SFRPGModifierType.FORMULA) {
                        if (speed.rolledMods) {
                            speed.rolledMods.push({mod: modifierBonus.modifier, bonus: modifierBonus});
                        } else {
                            speed.rolledMods = [{mod: modifierBonus.modifier, bonus: modifierBonus}];
                        }
        
                        return 0;
                    }
        
                    const roll = Roll.create(modifierBonus.modifier.toString(), data).evaluate({maximize: true});
                    const computedBonus = roll.total;

                    if (computedBonus !== 0) {
                        speed.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Modifiers.Tooltips.Speed", {
                            speed: SFRPG.speeds[speedKey],
                            type: modifierBonus.type.capitalize(),
                            mod: Math.floor(100 * computedBonus) + "%",
                            source: modifierBonus.name
                        }));
                    }

                    speed[speedKey].value *= computedBonus;
                }
            }

            speed[speedKey].value = Math.floor(speed[speedKey].value);

            if (speedKey === "flying") {
                speed[speedKey].maneuverability = speed[speedKey].baseManeuverability;
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}