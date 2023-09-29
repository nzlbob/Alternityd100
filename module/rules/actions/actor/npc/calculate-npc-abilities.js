import { d100A } from "../../../../d100Aconfig.js"
export default function (engine) {
   engine.closures.add("calculateNpcAbilities", (fact, context) => {
    const systemData = fact.actor.system   
    const quality = fact.actor.system.details.profession.npcQuality
    let qual = 0
    if (quality == "ordinary") qual = 1;
    if (quality == "good") qual = 2;
    if (quality == "amazing") qual = 3;
    for (let [k,v] of Object.entries(systemData.abilities))
        {
            let abi = d100A.npc.abilityBasis[systemData.details.profession.primary][k]
          //  console.log("KV ", k,v,abi,qual,d100A.npc.abilityArray,d100A.npc.abilityArray[0][2])
            v.base = d100A.npc.abilityArray[abi][qual]

        }

   // console.log("\n\n------QUALITY-------\n\n",systemData)


    //  fact.actor.system.details.xp.value = getCRExp(fact.actor.system.details.cr.value || fact.actor.system.details.cr);

        return fact;
    });
}