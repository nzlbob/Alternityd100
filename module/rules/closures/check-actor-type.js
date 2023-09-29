import { Closure } from '../../engine/closure/closure.js';

/**
 * Check that an actor is a specific type.
 */
export default class CheckActorType extends Closure {
    /** @override */
    process(fact, context) {

//console.log("\n\n\n\nCheckActorType\n\n",fact, context,"\n\n\n")

        return fact.type === context.parameters.type;
    }
}