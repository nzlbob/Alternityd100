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


                   
    
                
                    //data.attributes.ftl.tooltip.push(`${engine.name}: ${engineData.accel.five.signedString()}`);
                
               
                // data.attributes.speed.value += engineData.speed;
               // data.attributes.speed.tooltip.push(`${engine.name}: ${engineData.speed.signedString()}`);

               // data.attributes.pilotingBonus.value += engineData.pilotingModifier;
               // data.attributes.pilotingBonus.tooltip.push(`${engine.name}: ${engineData.pilotingModifier.signedString()}`);
            } 
           


            else if (engineData.isPowered ) {
            
            if (enginesize < 5 ) {
                data.attributes.accel.value = 0;
            }
            else if (enginesize < 10 ) {
                data.attributes.accel.value += engineData.accel.five;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.five.signedString()}`);
            }
            else if (enginesize < 15 ) {
                data.attributes.accel.value += engineData.accel.ten;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.ten.signedString()}`);
            }
            else if (enginesize < 20 ) {
                data.attributes.accel.value += engineData.accel.fifteen;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.fifteen.signedString()}`);
            }
            else if (enginesize < 30 ) {
                data.attributes.accel.value += engineData.accel.twenty;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.twenty.signedString()}`);
            }
            else if (enginesize < 40 ) {
                data.attributes.accel.value += engineData.accel.thirty;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.thirty.signedString()}`);
            }
            else if (enginesize < 50 ) {
                data.attributes.accel.value += engineData.accel.forty;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.forty.signedString()}`);
            }
            else  {
                data.attributes.accel.value += engineData.accel.fifty;
                data.attributes.accel.tooltip.push(`${engine.name}: ${engineData.accel.fifty.signedString()}`);
            }
        }
            
        }

        return fact;
    });


    
}