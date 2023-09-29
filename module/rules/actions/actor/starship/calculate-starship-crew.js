export default function (engine) {
    engine.closures.add("calculateStarshipCrew", (fact, context) => {
        const data = fact.actor.system;

        data.crew = mergeObject(data.crew, {
            captain: {
                limit: 1,
                actorIds: []
            },
       /*     chiefMate: {
                limit: -1,
                actorIds: []
            },*/
            engineer: {
                limit: -1,
                actorIds: []
            },
            gunner: {
                limit: -1,
                actorIds: []
            },
          /*  magicOfficer: {
                limit: -1,
                actorIds: []
            },
            passenger: {
                limit: -1,
                actorIds: []
            },*/
            pilot: {
                limit: 1,
                actorIds: []
            },
            copilot: {
                limit: 1,
                actorIds: []
            },
            /*navigation: {
                limit: 1,
                actorIds: []
            },*/
            communications: {
                limit: 1,
                actorIds: []
            },
            damageControl: {
                limit: -11,
                actorIds: []
            },
            defences: {
                limit: 1,
                actorIds: []
            },
            sensors: {
                limit: -1,
                actorIds: []
            },
           /* scienceOfficer: {
                limit: -1,
                actorIds: []
            },*/
            npcData: {}
        }, {overwrite: false});

        if (!data.crew.npcData) {
            data.crew.npcData = {};
        }


        data.crew.gunner.limit = -1,
//["captain", "pilot", "copilot", "sensors" , "communications", "engineer", "damageControl", "defences",  "gunner", "scienceOfficer",  "navigation","chiefMate", "magicOfficer", "openCrew", "minorCrew"];
        /** Ensure NPC data is properly populated. */
        data.crew.npcData = mergeObject(data.crew.npcData, {
            captain: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            },
            pilot: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            },
            copilot: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            },
            sensors: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            },
            communications: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            },
            engineer: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            },
            damageControl: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            },
            defences: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            },
           gunner: {
            active:null,
            number:null,
            abilities: {},
            numberOfUses: null,
            numberOfActionsMax: null,
            numberOfActionsValue: null 
            },
 /*           
            scienceOfficer: {
                active:null,
                number:null,
                abilities: {},
                numberOfUses: null,
                numberOfActionsMax: null,
                numberOfActionsValue: null 
            }
            magicOfficer: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            },

            navigation: {
                abilities: {},
                numberOfUses: null,
                skills: {}
            },




*/
        }, {overwrite: false});

        for (let [key, crew] of Object.entries(data.crew)) {
            if (key === "npcData" || key === "useNPCCrew" || key === "npcCrewQuality") {
                continue;
            }

            if (!crew.actorIds) {
                crew.actorIds = []
            }

            crew.actors = [];
            const deadActors = [];
            for (const crewActorId of crew.actorIds) {
                const foundCrew = game?.actors?.get(crewActorId);
                if (game?.actors && !foundCrew) {
                    deadActors.push(crewActorId);
                    continue;
                }

                crew.actors.push(foundCrew);
            }

            if (deadActors.length > 0) {
             //   console.log(`Found ${deadActors.length} non-existent actors for starship '${fact.actor?.system?.name || fact.actorId}', crew type: ${key}`);
                for (const deadActorId of deadActors) {
                    const deadActorIndex = crew.actorIds.indexOf(deadActorId);
                    if (deadActorIndex > -1) {
                        crew.actorIds.splice(deadActorIndex, 1);
                    }
                }
            }
        }

        return fact;
    });
}