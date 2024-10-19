export default function (engine) {
    engine.closures.add("calculateStarshipPower", (fact, context) => {
        const data = fact.actor.system;

        data.attributes.power.value = 0;
        data.attributes.power.max = 0;

        /** Compute max power. */
        const powerCores = fact.items.filter(x => x.type === "starshipPowerCore");
        for (const powerCore of powerCores) {
            let PowercoreBHP = 1
            if (powerCore.system.pwrPerBHP) PowercoreBHP = powerCore.system.bhpCost;
            data.attributes.power.max += powerCore.system.pcu * PowercoreBHP;

        }
        data.attributes.power.max = Math.round(data.attributes.power.max*10)/10;
        /** Compute power use. */
        const starshipComponents = fact.items.filter(x => x.type.startsWith("starship"));
        for (const component of starshipComponents) {
            const componentData = component.system;

            const excludedComponents = ["starshipFrame", "starshipPowerCore"];
            let pcu = 0
            componentData.overPowered? pcu = componentData.pcu * 2 : pcu = componentData.pcu


            if (!excludedComponents.includes(component.type)) {
                if (pcu && componentData.isPowered) {
                    let power = pcu;
                    if (componentData.isPCUPerBHP) power = pcu * componentData.bhpCost;


                    data.attributes.power.value += power;
                    data.attributes.power.tooltip.push(`${component.name}: ${power}`);
                }
            }
        }

        return fact;
    });
}