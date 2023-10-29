import { d100A } from "../../../../d100Aconfig.js"

export default function (engine) {
    engine.closures.add("calculateStarshipCompartments", (fact, context) => {
        const data = fact.actor.system;
        if (data.frame.name) {
   //         console.log("\n Compartments \n",data.frame.system.compartment,"\n fact \n",fact)
        }
     //   console.log("\n\n\n\--------------------------------\n\n\n")
        //const shipFrame = fact.items.filter(x => x.type.== "starship");
        const shipFrame = fact.items.find(x => x.type === "starshipFrame")
        
        // frame.system
        let itemData = duplicate(shipFrame.system)
        //let itemData = shipFrame.system
      //  console.log( "Frame", itemData)
      const compartments = /*itemData.compartment? itemData.compartment:*/ duplicate(d100A.compartmentData)
      //  const compartments = itemData.compartment
        data.compartment.compartments = {}

        
   //     console.log(game.settings.get("Alternityd100", "starshipCompartments"))
   //     console.log("data.frame.system.compartment" , data.frame.system.compartment)
        var basesize 
        if ((itemData.size == "small") && (itemData.hullPoints.total<=20) ) basesize = "small2";
        else if ((itemData.size == "small") && (itemData.hullPoints.total>20) ) basesize = "small4"
        else basesize =  itemData.size;
//console.log("\n\njghfjhgfjhgf",basesize)
        if (game.settings.get("Alternityd100", "starshipCompartments") == "warships" ) 
        {
            
            data.compartment.config = d100A.shortcompartments[basesize]
            
            

        }


        const numCompartments = data.compartment.config.length
        for (let[key,tempcomp] of Object.entries(compartments)){tempcomp.contents = [] 
       // for (const [tempcomp,key] of compartments) {tempcomp.contents = [] 
            if (game.settings.get("Alternityd100", "starshipCompartments") == "warships" ) // ***this should be set to not = ***
            {

                if (data.compartment.config.includes(key) )
                {
                    tempcomp.isCompartment = true;
                    data.compartment.compartments[key] = tempcomp

                }
                else
                {
                    tempcomp.isCompartment = false; 
                }
                
             /*   if(tempcomp.durability? false : true ){
                    console.log( "mnbvbn",  tempcomp)
                    
                    tempcomp.durability = duplicate(d100A.compartmentDurability) ;
                    if (tempcomp.durability.value){
                        tempcomp.durability.mor.value =  tempcomp.durability.value
                        tempcomp.durability.wou.value =  tempcomp.durability.value*2
                        tempcomp.durability.stu.value =  tempcomp.durability.value*2
                        }
                    console.log( "tempcomp", tempcomp)
                }*/
             //   else {




       /*         }
            if (tempcomp.durability.value? true : false ){
                here
            tempcomp.durability.mor.max =  tempcomp.durability.value
            tempcomp.durability.wou.max =  tempcomp.durability.value*2
            tempcomp.durability.stu.max =  tempcomp.durability.value*2
            }
        */
            };
            
        }
       // shipFrame.update({ "system.compartment": compartments });
      //  console.log( "Durability (SWM)",shipFrame.id, shipFrame.name,  shipFrame.system.compartment.F.durability.stu.max, shipFrame.system.compartment.F.durability.wou.max,shipFrame.system.compartment.F.durability.mor.max)


                /** Compute power use. */
                const starshipComponents = fact.items.filter(x => x.type.startsWith("starship"));
                for (const component of starshipComponents) {
                    //const componentData = component.system;
        
                    const excludedComponents = ["starshipFrame"];
                    if (!excludedComponents.includes(component.type)) {
                        if (component.system.location) {     // e.g system.location = "L"
                            //let compartment = compartments.find("location",component.system.location)

                          //  var compartment = data.compartment.compartments.find(function (element) {
                         //       return element.location == component.system.location;
                         //   });
                         if (data.compartment.config.includes(component.system.location))
                         {
                     //    console.log(data.compartment.compartments[component.system.location])
                     //       console.log(data.compartment.compartments[component.system.location].contents)
                            data.compartment.compartments[component.system.location].contents.push(component)
                            //Sort items by their BHP size
                            data.compartment.compartments[component.system.location].contents.sort(function(b, a){return a.system.bhpCost - b.system.bhpCost});

                         }

                         //Unfit the item if the bay doesnt exist 
                         else component.system.location = null;

                         
        
        
                          //  data.attributes.power.value += power;
                          //  data.attributes.power.tooltip.push(`${component.name}: ${power}`);
                        }
                    }
                }


                
                for (let[key,tempcomp] of Object.entries(data.compartment.compartments)){  
                    tempcomp.overload = false

                    tempcomp.maxHull = d100A.hullTypes[data.frame?.system.hullType]?.zoneLimit
                    tempcomp.curHull = 0
                    for (let[key2,tempitem] of Object.entries(tempcomp.contents)){
                        tempcomp.curHull += tempitem.system.bhpCost
                    }

                    if(tempcomp.curHull>tempcomp.maxHull) tempcomp.overload = true
                }
                

              /*  for (const compart of data.compartment.compartments) {
                    compart.sort(function(a, b){return a.system.bhpCost - b.system.bhpCost});
                }*/

//console.log(fact.actor.name , fact)
        return fact;
    });
}