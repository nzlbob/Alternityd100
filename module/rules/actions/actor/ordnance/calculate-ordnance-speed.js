export default function (engine) {
    engine.closures.add("calculateOrdnanceSpeed", (fact, context) => {
        const data = fact.actor.system;

        
        data.attributes.accel.base = data.basicAcceleration;
        data.attributes.accel.value = data.attributes.accel.base
        


        const engines = fact.items.filter(x => x.type === "ordnancePropulsion");
        for (const engine of engines) {
            const engineData = engine.system;
            let enginesize = engineData.bhpCost/data.attributes.hullPoints.base*100;
       
            
        }
        data.attributes.speed.walk.base = data.attributes.speed.value;
        data.attributes.speed.walk.value = data.attributes.speed.walk.base + data.attributes.accel.value;
        
       // data.attributes.maneuverability.value = data.attributes.maneuverability.base 

      //  let manMod = 0-Math.floor((data.attributes.speed.value-1)/4)

     //   if (manMod < 0) {
      //       data.attributes.maneuverability.value += manMod 
      //       data.attributes.maneuverability.tooltip.push("Speed ".concat(manMod)  )
      //      }
        return fact;
    });


    
}