export default function (engine) {
    engine.closures.add("calculateClasses", (fact, context) => {
        const data = fact.actor.system;
        const classes = fact.classes;

        data.classes = {};
        data.cl = 0;

        for (const cls of classes) {
            const classData = cls.system;

            const className = cls.name.slugify({replacement: "_", strict: true});
            const keyAbilityScore = classData.kas || "str";
            
            const classInfo = {
                keyAbilityMod: data.abilities[keyAbilityScore].mod,
                levels: classData.levels,
                keyAbilityScore: keyAbilityScore,
                skillRanksPerLevel: classData.skillRanks.value,
                isCaster: classData.isCaster
            };
            
            data.classes[className] = classInfo;

            if (classInfo.isCaster) {
                data.cl += classInfo.levels;
            }
        }

        return fact;
    });
}