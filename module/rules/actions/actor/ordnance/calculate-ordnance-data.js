export default function (engine) {
    engine.closures.add("calculateOrdnanceData", (fact, context) => {
        const data = fact.actor.system;
        console.log("Calculating ordnance data for ".concat(fact.actor.name),fact);

        // data.attributes.accel.base = data.basicAcceleration;
        // data.attributes.accel.value = data.attributes.accel.base

        let accelMods = 0;
        const accelTooltip = [];
        let durationMods = 0;
        const durationTooltip = [];
        // Attack accuracy is derived from installed components. Do not persist/update documents here;
        // rule-engine facts often contain synthetic item snapshots which are not updateable Documents.
        let baseAttackMods = 0;
        const baseAttackTooltip = [];

        const engines = fact.items.filter(x => x.type === "ordnancePropulsion");
        for (const engine of engines) {
            const engineData = engine.system;
            data.attributes.accel.base = engineData.accel.base;
            accelTooltip.push(engine.name.concat(" (").concat(engineData.accel.base).concat(")"));

            //    data.attributes.duration.base = engineData.duration.base;
            //   durationTooltip.push(engine.name.concat(" (").concat(engineData.duration.base).concat(")"));

            baseAttackMods += engineData.accuracy;
            baseAttackTooltip.push(engine.name.concat(" (").concat(engineData.accuracy).concat(")"));
            const engineResistance = 6 - engineData.size ;
            data.attributes.resistance.area = engineResistance
data.attributes.resistance.base = engineResistance
// data.attributes.resistance.beam = engineResistance
// data.attributes.resistance.bomb = engineResistance
//data.attributes.resistance.mine = engineResistance
//data.attributes.resistance.missile = engineResistance
//data.attributes.resistance.projectile = engineResistance
//data.attributes.resistance.special = engineResistance
//data.attributes.resistance.torpedo = engineResistance

        }

        const guidance = fact.items.filter(x => x.type === "ordnanceGuidance");
        for (const guide of guidance) {
            const guideData = guide.system;
            baseAttackMods += guideData.accuracy;
            baseAttackTooltip.push(guide.name.concat(" (").concat(guideData.accuracy).concat(")"));
        }


        const warheads = fact.items.filter(x => x.type === "ordnanceWarhead");
        for (const warhead of warheads) {
            const warheadData = warhead.system;
            const totalAttackMods = baseAttackMods + (warheadData.accuracy ?? 0);
            const totalAttackTooltip = baseAttackTooltip.concat([
                warhead.name.concat(" (").concat(warheadData.accuracy).concat(")")
            ]);

            // data.attributes.accel.base = warheadData.accel.base;
            // accelTooltip.push(warhead.name.concat(" (").concat(warheadData.accel.base).concat(")"));

            // data.attributes.duration.base = warheadData.duration.base;
            // durationTooltip.push(warhead.name.concat(" (").concat(warheadData.duration.base).concat(")"));

            // Attach derived values to the fact's warhead snapshot for downstream use.
            // (If you need persistence, do it in an explicit user action, not here.)
            if (warhead?.system) {
                warhead.system.accur = totalAttackMods;
                warhead.system.attackTooltip = totalAttackTooltip;
            } else if (warhead?.data?.system) {
                warhead.data.system.accur = totalAttackMods;
                warhead.data.system.attackTooltip = totalAttackTooltip;
            }

        }


        //  data.attributes.speed.walk.base = data.attributes.speed.value;
        //  data.attributes.speed.walk.value = data.attributes.speed.walk.base + data.attributes.accel.value;

        // data.attributes.maneuverability.value = data.attributes.maneuverability.base 

        //  let manMod = 0-Math.floor((data.attributes.speed.value-1)/4)

        //   if (manMod < 0) {
        //       data.attributes.maneuverability.value += manMod 
        //       data.attributes.maneuverability.tooltip.push("Speed ".concat(manMod)  )
        //      }

        data.attributes.accel.value = data.attributes.accel.base + accelMods;
        data.attributes.accel.tooltip = accelTooltip;
        //    data.attributes.duration.value = data.attributes.duration.base + durationMods;
        //   data.attributes.duration.tooltip = durationTooltip;
console.log(data)


        return fact;
    });



}