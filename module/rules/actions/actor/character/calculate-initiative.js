import { addModifier } from "../../../../modifiers/d100mod.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../../modifiers/types.js";


export default function (engine) {
    engine.closures.add("calculateInitiative", (fact, context) => {
       // console.log("calculateInitiative", fact, context)
        const data = fact.actor.system;
        const init = data.attributes.init;
      //  console.log("calculateInitiative", engine,data)
        
        
        
        // Iterate through any modifiers that grant the character additional skillpoints to distribute
        // These only count towards skillpoint max
/*

      let filteredModifiers = fact.modifiers.filter(mod => {
        return (mod.enabled || mod.modifierType === "roll") && mod.effectType == SFRPGEffectType.INITIATIVE;
    });
   // console.log("filteredModifiers", filteredModifiers,context)
  
  
   // filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);
   // console.log ("\nfilteredModifiers\n", filteredModifiers)

      
      const actchkModifiersBonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
          if (mod[1] === null || mod[1].length < 1) return sum;

          if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
              for (const bonus of mod[1]) {
                  sum += addModifier(bonus, data, data.skillpoints, "SFRPG.ActorSheet.Modifiers.Tooltips.BonusSkillpoints");
              }
          } else {
              sum += addModifier(mod[1], data, data.skillpoints, "SFRPG.ActorSheet.Modifiers.Tooltips.BonusSkillpoints");
          }

          return sum;
      }, 0);
// End Iterate through any modifiers



/*
        init.mod = data.abilities.dex.mod;
        init.total = init.mod;

        init.tooltip.push(game.i18n.format("SFRPG.InitiativeDexModTooltip", { mod: data.abilities.dex.mod.signedString() }));
*/
        return fact;
    });
}