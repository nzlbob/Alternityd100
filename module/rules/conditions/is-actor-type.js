import CheckActorType from '../closures/check-actor-type.js';

export default function (engine) {

   // console.log("\n\n\n--------------------------------\nengine.closures.add isActorType CheckActorType,")
    engine.closures.add("isActorType", CheckActorType, { required: ['type'] });
}