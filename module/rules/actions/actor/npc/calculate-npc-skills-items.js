import { d100A } from "../../../../d100Aconfig.js"

export default function (engine) {
    engine.closures.add("calculateNpcSkillsItems", (fact, context) => {
        const systemData = fact.actor.system;
        const profession = systemData.details.profession.primary
        const npcQuality = systemData.details.profession.npcQuality

        const PChange =  (systemData.details.profession.historicP != profession)
        const QChange =  (systemData.details.profession.historicQ != npcQuality)
        console.log(PChange,QChange)
        console.log(d100A.npc.skills[profession])

        if(PChange||QChange){
            for (let [k,v] of Object.entries(systemData.skills)) {
              //  console.log (v.label , d100A.skills[k])
                v.ranks = null
                if (v.customname == true) v.label = d100A.skills[k];
                v.show = v.isBroad
                
    
            }


        for (let [qualname,basequal] of Object.entries(d100A.npc.skills[profession])) {
            
            for (let [k,v] of Object.entries(basequal)) {
              //  console.log (k,v)
                if (!systemData.skills[k].isBroad && !systemData.skills[k].customname ) systemData.skills[k].ranks = v;
                if (!systemData.skills[k].isBroad && systemData.skills[k].customname ) {
                    systemData.skills[k].ranks = v.ranks
                    systemData.skills[k].label = v.label
                };
                
                systemData.skills[k].show = true
            }
          //  console.log("\n\nBreak\n\n",qualname,npcQuality)   
        if (qualname == npcQuality ) 
        {
            //console.log("\n\nBreak\n\n")
            break;
        }
        
        }
    }
        systemData.details.profession.historicP = profession
        systemData.details.profession.historicQ = npcQuality
        return fact;
    });
}