export default function (engine) {
    engine.closures.add("calculateStarshipComputer", (fact, context) => {
        const data = fact.actor.system;
        const computers = fact.items.filter(x => x.type === "starshipComputer");
        
        data.attributes.computer = {
            value: 0,
            tooltip: []
        };

        if (computers && computers.length > 0) {
            const computerData = computers[0].system;

            data.attributes.computer.value = computerData.modifier;
            data.attributes.computer.tooltip.push(
                game.i18n.format("SFRPG.StarshipSheet.Modifiers.ComputerBonus", {
                    mod: computerData.modifier.toString(),
                    source: computers[0].name
                })
            );
            
        }

        return fact;
    });
}