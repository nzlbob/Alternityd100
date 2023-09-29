export default function(engine) {
    engine.closures.add("calculateStarshipArmorClass", (fact, context) => {
        const data = fact.actor.system;

        const pilot = (data.crew?.pilot?.actors) ? data.crew?.pilot?.actors[0] : null;
        const sizeMod = CONFIG.SFRPG.starshipSizeMod[data.details.size] || 0;

        let pilotingRanks = pilot?.system?.skills?.pil?.ranks || 0;
        if (data.crew.useNPCCrew) {
            pilotingRanks = data.crew.npcData?.pilot?.skills?.pil?.ranks || 0;
        }
/**
        // Set up base values. 
        const forwardAC = duplicate(data.quadrants.forward.ac);
        data.quadrants.forward.ac = {
            value: 10,
            misc: (forwardAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const portAC = duplicate(data.quadrants.port.ac);
        data.quadrants.port.ac = {
            value: 10,
            misc: (portAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const starboardAC = duplicate(data.quadrants.starboard.ac);
        data.quadrants.starboard.ac = {
            value: 10,
            misc: (starboardAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const aftAC = duplicate(data.quadrants.aft.ac);
        data.quadrants.aft.ac = {
            value: 10,
            misc: (aftAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };
*/
        /** Get modifying items. */
        /*
        const armorItems = fact.items.filter(x => x.type === "starshipArmor");
        let armorItem = null;
        let armorItemData = null;
        if (armorItems && armorItems.length > 0) {
            armorItem = armorItems[0];
            armorItemData = armorItem.system;
        }

        const shieldItems = fact.items.filter(x => x.type === "starshipShield");
        let shieldItem = null;
        let shieldItemData = null;
        if (shieldItems && shieldItems.length > 0 && shieldItems[0].system.isDeflector) {
            shieldItem = shieldItems[0];
            shieldItemData = shieldItem.system;
        }
*/


/***
 * 
 * Hull Toughness
 * 
 * 
 * 
 */


const hullItem = fact.items.filter(x => x.type === "starshipFrame");

if (hullItem){

    data.details.toughness.firepower = hullItem[0].system.toughness 
    data.details.toughness.firepowerN = hullItem[0].system.firepowerN;

            
}
/***
 * 
 * Damage Control = Special kind of Desenses that aids damage check rolls
 * 
 * 
 * 
 */
        const damageControlItems = fact.items.filter(x => x.type === "starshipDefence");
        let damageControlItem = null;
        let damageControlItemData = null;
        data.attributes.damageControl.base = 0
        data.attributes.damageControl.value = 0
        data.attributes.damageControl.tooltip = "Base = 0"
        data.attributes.resistance.base = data.frame?.system.target || 0
        data.attributes.resistance.tooltip = "<p>" + (data.frame?.name || "Hull")   +": " + data.attributes.resistance.base + "</p>"
        for (const damageControlItem of damageControlItems ){
            data.attributes.damageControl.value += damageControlItem.system.damageControl? damageControlItem.system.damageControl : 0
           // ECMItem.system.targetLockBonus[key]?  console.log(key,value,ECMItem) :  console.log("No",key,ECMItem)
           data.attributes.damageControl.tooltip += "<p>" + damageControlItem.name +": " + damageControlItem.system.damageControl + "</p>"
            }

            
            
           
            for (const damageControlItem of damageControlItems ){
                for (let [k,v] of Object.entries(damageControlItem.system.resistance)){

                    data.attributes.resistance[k] += v.value || 0
    
                    // ECMItem.system.targetLockBonus[key]?  console.log(key,value,ECMItem) :  console.log("No",key,ECMItem)
                    if (v.value ){
                    data.attributes.resistance.tooltip += "<p>" + damageControlItem.name +": " +  game.i18n.localize("SFRPG.ShipSystems.starshipWeaponTypes." + k) +": " + v.value + "</p>"
                    }

                }




 
                }
    



/***
 * 
 * 
 *  ECM items : Things that add or subtrack to the sensors roll   
 * 
 */

         
        const ECMItems = fact.items.filter(x => ["starshipEngine","starshipElectronicCountermeasure","starshipSensor","starshipDefence"].includes(x.type));
        let ECMItem = null;
        let ECMItemData = null;
        if (ECMItems && ECMItems.length > 0 /*&& stealthItems[0].system.isStealth*/) {
            ECMItem = ECMItems[0];
            ECMItemData = ECMItem.system;
        }
        //console.log("\n\n\n\nECM\n",data,ECMItems,data.attributes.ECM)
        // This get rid of old variabled
        if (data.attributes.ECM.infraRed) delete data.attributes.ECM.infraRed
        if (data.attributes.ECM.EM) delete data.attributes.ECM.EM


        for (const [key,value] of Object.entries(data.attributes.ECM)){
            value.value = value.base
            //console.log(key,value)
            
            value.tooltip = "Base: " + value.base
            for (const ECMItem of ECMItems ){

            
            value.value += ECMItem.system.targetLockBonus[key].value? ECMItem.system.targetLockBonus[key].value : 0

          //  ECMItem.system.targetLockBonus[key]?  console.log(key,value,ECMItem) :  console.log("No",key,ECMItem)
            value.tooltip += "<p>" + ECMItem.name +": " + ECMItem.system.targetLockBonus[key]?.value + "</p>"
            }
        }

/***
 * Addscore
 * 
 * @ var Target - the Actor variable to amend
 * @ var title - the bonus specifc text name
 * @ var value - Value to add 
 */
        /** Apply bonuses. */
        const addScore = (target, title, value, bLocalize = true) => {
            target.value += value;
            if (bLocalize && game?.i18n) {
                target.tooltip.push(game.i18n.format(title, {value: value}));
            } else {
                target.tooltip.push(`${title}: ${value}`);
            }
        }
/*
        if (pilotingRanks > 0) {
            addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
        }

        if (sizeMod !== 0) {
            addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
        }

        if (armorItem) {
            addScore(data.quadrants.forward.ac, armorItem.name, armorItemData.armorBonus, false);
            addScore(data.quadrants.port.ac, armorItem.name, armorItemData.armorBonus, false);
            addScore(data.quadrants.starboard.ac, armorItem.name, armorItemData.armorBonus, false);
            addScore(data.quadrants.aft.ac, armorItem.name, armorItemData.armorBonus, false);
        }

        if (forwardAC?.misc < 0 || forwardAC?.misc > 0) addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", forwardAC.misc);
        if (portAC?.misc < 0 || portAC?.misc > 0) addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", portAC.misc);
        if (starboardAC?.misc < 0 || starboardAC?.misc > 0) addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", starboardAC.misc);
        if (aftAC?.misc < 0 || aftAC?.misc > 0) addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", aftAC.misc);

        if (shieldItem && shieldItemData.isDeflector) {

            if (data.quadrants.forward.shields.value > 0) addScore(data.quadrants.forward.ac, shieldItem.name, shieldItemData.armorBonus, false);
            if (data.quadrants.port.shields.value > 0) addScore(data.quadrants.port.ac, shieldItem.name, shieldItemData.armorBonus, false);
            if (data.quadrants.starboard.shields.value > 0) addScore(data.quadrants.starboard.ac, shieldItem.name, shieldItemData.armorBonus, false);
            if (data.quadrants.aft.shields.value > 0) addScore(data.quadrants.aft.ac, shieldItem.name, shieldItemData.armorBonus, false);
            
        }
        */
        return fact;
    });
}