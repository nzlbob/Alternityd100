export default function (engine) {
    engine.closures.add("calculateVehicleSpeed", (fact, context) => {
        const data = fact.actor.system;

        data.attributes.speed.accel.value =  data.attributes.speed.accel.base;


        return fact;
    });


    
}