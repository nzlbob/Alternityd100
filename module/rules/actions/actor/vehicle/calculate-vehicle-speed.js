export default function (engine) {
    engine.closures.add("calculateVehicleSpeed", (fact, context) => {
        const data = fact.actor.system;

        data.attributes.accel.value =  data.attributes.accel.base;

        data.attributes.speed.max =  data.attributes.speed.base;

        //data.attributes.speed.value =  data.attributes.speed.base;
        return fact;
    });


    
}