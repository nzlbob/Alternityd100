export default function (engine) {
    engine.closures.add("calculateClasses", (fact, context) => {
       
       
        const data = fact.actor.system;
        const profession = fact.profession;
//console.log(data)
        data.profession = {};
        data.cl = 0;

        for (const cls of profession) {
            const classData = cls.system;

            const className = cls.name.slugify({replacement: "_", strict: true});
            const keyAbilityScore = classData.kas || "str";
            
            const classInfo = {
                PriSec : classData.bab,
                name: cls.name
            };
            (classInfo.PriSec == "primary")? data.details.profession.primary = classInfo : data.details.profession.secondary = classInfo 
            console.log(classInfo,data.details.profession.primary )
/*
            if (classInfo.isCaster) {
                data.cl += classInfo.levels;
            }
            */
        }

        return fact;
    });
}