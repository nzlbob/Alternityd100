import { Context } from './context.js';
import { ClosureRegistry } from './closure/closure-registry.js';

export default class Engine {
    constructor() {
        
        this.closures = new ClosureRegistry(this);
        this.services = {};
    }

    add(definition, options) {
        const closureOrClosures = this.closures.parse(definition);

        // if I get an array, then I assume that it is an array of definitions, and add each of them
        if (Array.isArray(closureOrClosures)) {
            closureOrClosures.forEach(clos => this.closures.add(clos.name, clos, options));
        } else {
            // non-arry case
            this.closures.add(closureOrClosures.name, closureOrClosures, options);
        }
        //console.log("add", definition, options)
    }

    reset() {
        this.closures = new ClosureRegistry(this);
        console.log(this.closures)
    }

    async process(closure, fact) {
        if (typeof closure === 'string') {
            closure = this.closures.get(closure);
        }

        const context = new Context(this);
        try {
            Hooks.callAll("beforeClosureProcessed", closure.name, fact);
            const res = await Promise.resolve(closure.process(fact, context));
            context.fact = res;
            Hooks.callAll("afterClosureProcessed", closure.name, fact);
           // console.log("process",closure, fact)
            return context;
        } catch (error) {
           // console.log("error",closure,context)
            return Promise.reject(error);
        }
    }
}