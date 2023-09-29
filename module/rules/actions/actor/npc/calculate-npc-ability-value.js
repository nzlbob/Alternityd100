export default function (engine) {
    engine.closures.add("calculateNpcSkillsItems", (fact, context) => {
        const data = fact.actor.system;

        for (let ability of Object.values(data.abilities)) {
            ability.value = Math.floor((ability.mod * 2) + 10);
        }

        return fact;
    });
}