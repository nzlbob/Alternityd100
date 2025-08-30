export default function (engine) {
    engine.closures.add("calculateStarshipSpeed", (fact, context) => {
        const data = fact.actor.system;

        data.attributes.accel.value = 0;

        


        const engines = fact.items.filter(x => x.type === "starshipEngine");
        for (const engine of engines) {
            const engineData = engine.system;
            let enginesize = engineData.bhpCost/data.attributes.hullPoints.base*100;



            if (engineData.isFTL) {
                function powerbased(rate) {
                   
                    data.attributes.ftl.value = engineData.bhpCost * engineData.pcu;
                    data.attributes.ftl.value += " ly"
                    data.attributes.ftl.tooltip.push(`${engine.name}: ${engineData.accel[rate]}`);   
                    console.log(rate,data.attributes.ftl.value,engineData.bhpCost,engineData.pcu)
                }

                function defaultftl(rate) {
                    data.attributes.ftl.value = engineData.accel[rate];
                    data.attributes.ftl.tooltip.push(`${engine.name}: ${engineData.accel[rate]}`);  
                    console.log(data.attributes.ftl.value )
                }

                data.attributes.ftl.text = "Speed: "+ engineData.ftlRange+" / " +engineData.ftlDuration+ " Cooldown: " + engineData.ftlCooldown
                data.attributes.ftl.range = engineData.ftlRange
/*
                if (enginesize < 5 ) {
                    data.attributes.accel.value = "-";
                }
                else if (enginesize < 10 ) {
                    if (engineData.accel.five =="pow") {powerbased("five")}
                    else defaultftl("five") 
                }
                else if (enginesize < 15 ) {
                    console.log(engineData.accel.ten)
                    if (engineData.accel.ten =="pow") {powerbased("ten")}
                    else defaultftl("ten") 
                }
                else if (enginesize < 20 ) {
                    if (engineData.accel.fifteen =="pow") {powerbased("fifteen")}
                    else defaultftl("fifteen") 

                }
                else if (enginesize < 30 ) {
                    if (engineData.accel.twenty =="pow") {powerbased("twenty")}
                    else defaultftl("twenty") 
                }
                else if (enginesize < 40 ) {
                    if (engineData.accel.thirty =="pow") {powerbased("thirty")}
                    else defaultftl("thirty") 
                }
                else if (enginesize < 50 ) {
                    if (engineData.accel.forty =="pow") {powerbased("forty")}
                    else defaultftl("forty") 

                }
                else  {
                    if (engineData.accel.fifty =="pow") {powerbased("fifty")}
                    else defaultftl("fifty") 

                }

*/
                   
    
                
                    //data.attributes.ftl.tooltip.push(`${engine.name}: ${engineData.accel.five.toString()}`);
                
               
                // data.attributes.speed.value += engineData.speed;
               // data.attributes.speed.tooltip.push(`${engine.name}: ${engineData.speed.toString()}`);

               // data.attributes.pilotingBonus.value += engineData.pilotingModifier;
               // data.attributes.pilotingBonus.tooltip.push(`${engine.name}: ${engineData.pilotingModifier.toString()}`);
            } 
           


            else if (engineData.isPowered ) {
            
            if (enginesize < 5 ) {
                data.attributes.accel.value = 0;
            }
            else if (enginesize < 10 ) {
                data.attributes.accel.value += engineData.accel.five;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.five.toString()}`);
            }
            else if (enginesize < 15 ) {
                data.attributes.accel.value += engineData.accel.ten;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.ten.toString()}`);
            }
            else if (enginesize < 20 ) {
                data.attributes.accel.value += engineData.accel.fifteen;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.fifteen.toString()}`);
            }
            else if (enginesize < 30 ) {
                data.attributes.accel.value += engineData.accel.twenty;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.twenty.toString()}`);
            }
            else if (enginesize < 40 ) {
                data.attributes.accel.value += engineData.accel.thirty;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.thirty.toString()}`);
            }
            else if (enginesize < 50 ) {
                data.attributes.accel.value += engineData.accel.forty;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.forty.toString()}`);
            }
            else  {
                data.attributes.accel.value += engineData.accel.fifty;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.fifty.toString()}`);
            }
        }
            
        }
        data.attributes.speed.walk.base = data.attributes.speed.value;
        data.attributes.speed.walk.value = data.attributes.speed.walk.base + data.attributes.accel.value;
        
        data.attributes.maneuverability.value = data.attributes.maneuverability.base 

        let manMod = 0-Math.floor((data.attributes.speed.value-1)/4)

        if (manMod < 0) {
             data.attributes.maneuverability.value += manMod 
             data.attributes.maneuverability.tooltip.push("Speed ".concat(manMod)  )
            }
        return fact;
    });


    
}