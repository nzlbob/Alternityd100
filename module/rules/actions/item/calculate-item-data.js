import { Diced100 } from "../../../dice.js"
import RollContext from "../../../rolls/rollcontext.js";


// This us used to update an item with data from the owner. Things like strngth based throwing rande

export default function (engine) {
    engine.closures.add("calculateItemData", (fact, context) => {
        const item = fact.item;
        const itemData = fact.itemData;
       // const data = itemData.data;

        const actor = fact.owner.actor;
        const actorData = fact.owner.actorData;

        if (itemData.actionType) {
/*
            if (itemData.save && itemData.save.type) {
                const save = itemData.save || {};

                let dcFormula = save.dc?.toString();
                if (!dcFormula) {
                    const ownerKeyAbilityId = actorData?.attributes.keyability;
                    const itemKeyAbilityId = itemData.ability;

                    const abilityKey = itemKeyAbilityId || ownerKeyAbilityId;
                    if (abilityKey) {
                        if (itemData.type === "spell") {
                            dcFormula = `10 + @item.level + @owner.abilities.${abilityKey}.mod`;
                        } else if (itemData.type === "feat") {
                            dcFormula = `10 + @owner.details.level.value + @owner.abilities.${abilityKey}.mod`;
                        } else {
                            dcFormula = `10 + floor(@item.level / 2) + @owner.abilities.${abilityKey}.mod`;
                        }
                    }
                }

                if (dcFormula) {
                    const rollContext = new RollContext();
                    rollContext.addContext("item", item, data);
                    rollContext.setMainContext("item");
                    if (actor && actor.data) {
                        rollContext.addContext("owner", actor);
                        rollContext.setMainContext("owner");
                    }
            
                    actor?.setupRollContexts(rollContext);
                
                    const rollPromise = Diced100.createRoll({
                        rollContext: rollContext,
                        rollFormula: dcFormula,
                        mainDie: 'd0',
                        dialogOptions: { skipUI: true }
                    });
            
                    rollPromise.then(rollResult => {
                        const returnValue = `DC ${rollResult.roll.total || ""} ${CONFIG.SFRPG.saves[save.type]} ${CONFIG.SFRPG.saveDescriptors[save.descriptor]}`;
                        item.labels.save = returnValue;
                    });

                    if (!fact.promises) {
                        fact.promises = [];
                    }
                    fact.promises.push(rollPromise);
                } else {
                    item.labels.save = 10;
                }            }

            */
        }
       // console.log("Whats my strength - ", actor.system.abilities.str.value)
        

       /***
        * 
        * Sets the range for thrown items
        * 
        */
        if (item.system.skill === "throw")
        {
           // console.log("Whats my Item - ", item)
           // console.log("Whats my Item - ", item.system.range.short,item.system.range.short != actor.system.abilities.str.value)
            if (item.system.range.short != actor.system.abilities.str.value)
            {
                let newRange = foundry.utils.duplicate(item.system.range)
             //   console.log("Whats my newRange - ", newRange)
                newRange.short = actor.system.abilities.str.value
                newRange.medium = actor.system.abilities.str.value *2
                newRange.long = actor.system.abilities.str.value *4
                let a = item.update({"system.range" :newRange } )
              //  console.log(a)
            }


        }
        return fact;
    });
}
