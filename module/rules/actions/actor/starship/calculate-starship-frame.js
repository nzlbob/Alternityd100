import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes} from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add( "calculateStarshipFrame", (fact, context) => {
        const data = fact.actor.system;
        const modifiers = fact.modifiers;
        const frames = fact.frames;
       // console.log(fact)
        /*
        const maneuverabilityMap = {
            "clumsy" : { pilotingBonus: -2, turn: 4 },
            "poor"   : { pilotingBonus: -1, turn: 3 },
            "average": { pilotingBonus: 0, turn: 2 },
            "good"   : { pilotingBonus: 1, turn: 1 },
            "perfect": { pilotingBonus: 2, turn: 0 }
        };

        const sizeModifierMap = {
            "n/a": 0,
            "tiny": 1,
            "small": 2,
            "medium": 3,
            "large": 4,
            "huge": 5,
            "gargantuan": 6,
            "colossal": 7,
            "superColossal": 8
        };
*/


        if (!data.crew) {
            data.crew = {
                captain: {
                    limit: 1,
                    actors: []
                },
               /* chiefMate: {
                    limit: -1,
                    actors: []
                },*/
                engineer: {
                    limit: -1,
                    actors: []
                },
                gunner: {
                    limit: -1,
                    actors: []
                },
                /*magicOfficer: {
                    limit: -1,
                    actors: []
                },
                passenger: {
                    limit: -1,
                    actors: []
                },*/
                pilot: {
                    limit: 1,
                    actors: []
                },
                /*scienceOfficer: {
                    limit: -1,
                    actors: []
                }*/
            };
        }
/*
        data.currency = foundry.utils.mergeObject(data.currency || {}, {
            upb: 0
        }, {overwrite: false});

        // If galactic trade is enabled, allow starship sheets to track unspent BPs. 
        const isGalacticTradeEnabled = game.settings.get('Alternityd100', 'enableGalacticTrade');
        if (isGalacticTradeEnabled) {
            data.currency = foundry.utils.mergeObject(data.currency, {
                bp: 0
            }, {overwrite: false});
        } else if (data.currency?.bp !== null) {
            delete data.currency.bp;
        }

        const tierToBuildpoints = {
            "1/4": 25,
            "0.25": 25,
            "1/3": 30,
            "1/2": 40,
            "0.5": 40,
            "1": 55,
            "2": 75,
            "3": 95,
            "4": 115,
            "5": 135,
            "6": 155,
            "7": 180,
            "8": 205,
            "9": 230,
            "10": 270,
            "11": 310,
            "12": 350,
            "13": 400,
            "14": 450,
            "15": 500,
            "16": 600,
            "17": 700,
            "18": 800,
            "19": 900,
            "20": 1000
        };

        data.attributes.bp = {
            value: 0,
            max: tierToBuildpoints[data.details.tier],
            tooltip: []
        };





        // If galactic trade is enabled, max spent BP per tier is 5% higher. 
        if (isGalacticTradeEnabled) {
            data.attributes.bp.max = Math.floor(data.attributes.bp.max * 1.05);
        }

        data.attributes.power = {
            value: 0,
            max: 0,
            tooltip: []
        };

        data.attributes.speed = {
            value: 0,
            tooltip: []
        };

        data.attributes.turn = {
            value: 0,
            tooltip: []
        };
*/
        if (!frames || frames.length === 0) {
            data.frame = {
                name: ""
            };

            data.details.frame = "";
            data.details.size = "n/a";
            data.attributes.maneuverability = 0;
            /*data.attributes.damageThreshold = {
                value: 0,
            //    tooltip: []
            //};

            data.attributes.expansionBays = {
                value: 0,
                tooltip: []
            };
            */
            //data.attributes.complement.min = 0;
            //data.attributes.complement.max = 0;

            //data.attributes.hp.increment = 0;
            //data.attributes.hp.max = 0;
            //data.crew.gunner.limit = 0;
        } else {
            const frame = frames[0];

            data.frame = frame;
           // console.log(data.attributes)
            data.details.frame = frame.name;
            data.details.size = frame.system.size;
            data.attributes.maneuverability = frame.system.maneuverability;
            data.attributes.hullPoints.max = frame.system.hullPoints.total;
            data.attributes.hullPoints.base = frame.system.hullPoints.base;
            for (let v of Object.entries(data.attributes.ECM)){
            v.base = frame.system.attributes.scanRes
            }
            
            
            
           // console.log(data.attributes)

            /*
            data.attributes.damageThreshold = {
                value: frame.data.damageThreshold.base,
                tooltip: []
            };
            data.attributes.expansionBays = {
                value: frame.data.expansionBays,
                tooltip: []
            };
            data.attributes.complement.min = frame.data.crew.minimum;
            data.attributes.complement.max = frame.data.crew.maximum;

            data.attributes.hp.increment = frame.data.hitpoints.increment;
            data.attributes.hp.max = frame.data.hitpoints.base + Math.floor(data.details.tier / 4) * frame.data.hitpoints.increment;
            data.crew.gunner.limit = frame.data.weaponMounts.forward.lightSlots + frame.data.weaponMounts.forward.heavySlots + frame.data.weaponMounts.forward.capitalSlots
                + frame.data.weaponMounts.aft.lightSlots + frame.data.weaponMounts.aft.heavySlots + frame.data.weaponMounts.aft.capitalSlots
                + frame.data.weaponMounts.port.lightSlots + frame.data.weaponMounts.port.heavySlots + frame.data.weaponMounts.port.capitalSlots
                + frame.data.weaponMounts.starboard.lightSlots + frame.data.weaponMounts.starboard.heavySlots + frame.data.weaponMounts.starboard.capitalSlots
                + frame.data.weaponMounts.turret.lightSlots + frame.data.weaponMounts.turret.heavySlots + frame.data.weaponMounts.turret.capitalSlots;

            data.attributes.turn.value = maneuverabilityMap[data.attributes.maneuverability].turn;
            data.attributes.turn.tooltip.push(`${data.details.frame}: ${data.attributes.turn.value.toString()}`);
*/

        }
/*
        // Ensure pilotingBonus exists. 
        data.attributes.pilotingBonus = {
            value: maneuverabilityMap[data.attributes.maneuverability].pilotingBonus,
            tooltip: [game.i18n.format("SFRPG.StarshipSheet.Header.Movement.ManeuverabilityTooltip", {maneuverability: data.attributes.maneuverability})]
        };

        //* Ensure quadrants exist 
        if (!data.quadrants) {
            data.quadrants = {
                forward: {
                    shields: {
                        value: 0
                    },
                    ablative: {
                        value: 0
                    },
                    ac: {
                        value: 10,
                        misc: null
                    },
                    targetLock: {
                        value: 10,
                        misc: null
                    }
                },
                port: {
                    shields: {
                        value: 0
                    },
                    ablative: {
                        value: 0
                    },
                    ac: {
                        value: 10,
                        misc: null
                    },
                    targetLock: {
                        value: 10,
                        misc: null
                    }
                },
                starboard: {
                    shields: {
                        value: 0
                    },
                    ablative: {
                        value: 0
                    },
                    ac: {
                        value: 10,
                        misc: null
                    },
                    targetLock: {
                        value: 10,
                        misc: null
                    }
                },
                aft: {
                    shields: {
                        value: 0
                    },
                    ablative: {
                        value: 0
                    },
                    ac: {
                        value: 10,
                        misc: null
                    },
                    targetLock: {
                        value: 10,
                        misc: null
                    }
                }
            };
        }
*/
        // Compute BP 
        //const sizeModifier = sizeModifierMap[data.details.size] || 0;
        const starshipComponents = fact.items.filter(x => x.type.startsWith("starship"));
        var bhpCost = 0;
        data.attributes.hullPoints.value = 0
       // var Price = 0;
        for (const component of starshipComponents) {
            const componentData = component.system;
            //console.log(component)
            if (component.type == "starshipArmor") bhpCost = Math.round(data.attributes.hullPoints.base * componentData.bhpCost/50)/2;
            else bhpCost = componentData.bhpCost;
            
            data.attributes.hullPoints.value += bhpCost;
//console.log("------BHP COST--------\n",data.attributes.hullPoints.value, bhpCost)


            data.attributes.hullPoints.tooltip.push(`${component.name}: ${bhpCost}`);
        }


        /**
         * 
         * Calculate Financial Cost 
         */
        console.log()
        const formatterusd = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
          })
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
          })
          
          data.details.price.value = 0
        for (const component of starshipComponents) {
            const componentData = component.system;

              
            //console.log(component)
            // Fix up if no costs are entered
            if (componentData.price === null) componentData.price =0;
            if (componentData.pricePerBHP === null) componentData.pricePerBHP =0;
            if (componentData.bhpCost === null) componentData.bhpCost =0;

            let Price = parseInt (componentData.price) + parseInt (componentData.pricePerBHP) * parseInt (componentData.bhpCost);
           // console.log(Price,data.details.price.value,componentData)
            data.details.price.value += Price;
            
            data.details.price.tooltip.push(`${component.name}: ${formatter.format(Price)}`);
           // console.log("component",component,componentData,data,Price)
        }
        if (data.details.price.value > 1000000) data.details.price.value = formatter.format(data.details.price.value/1000000) + " M"
        else if (data.details.price.value > 1000) data.details.price.value = formatter.format(data.details.price.value/1000) + " K"
        else data.details.price.value = formatter.format(data.details.price.value)
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] } );
}