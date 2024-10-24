import { ActorSheetSFRPG } from "./base.js";
//import { d100ActorSheet } from "../../d100Actor-sheet.js";
import { AddEditSkillDialog } from "../../apps/edit-skill-dialog.js";
import { ChoiceDialog } from "../../apps/choice-dialog.js";
import { d100A } from "../../d100Aconfig.js";
 import { rollNPC } from "../../utilities.js";
import { targetResModData, d100NPCCrewStats } from "../../modifiers/d100mod.js";
import { getRangeCat, radtodeg, degtorad, raytodeg, inArc, generateUUID } from "../../utilities.js"
import { moveItemBetweenActorsAsync, getFirstAcceptableStorageIndex, ActorItemHelper, containsItems } from "../actor-inventory-utils.js";
/**
 * An Actor sheet for a starship in the SFRPG system.
 * @type {ActorSheetSFRPG}
 */
export class d100AActorSheetStarship extends ActorSheetSFRPG {
    static get AcceptedEquipment() {
        return "starshipOrdnance,augmentation,pharmaceutical,container,equipment,fusion,goods,hybrid,magic,technological,upgrade,shield,weapon,weaponAccessory,actorResource";
    }
    static StarshipActionsCache = null;

    static get defaultOptions() {
        const options = super.defaultOptions;
        foundry.utils.mergeObject(options, {
            //classes: ["sfrpg", "sheet", "actor", "starship"],
            classes: ["Alternityd100", "sheet", "actor", 'starship'],
            width: 700,
            height: 800
        });

        return options;
    }

    constructor(...args) {
        super(...args);
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/Alternityd100/templates/actors/starship-sheet-limited.html";
        return "systems/Alternityd100/templates/actors/starship-sheet-full.html";
    }

    async getData() {
        const data = super.getData();
        data.isUseWarshipsOptions =
            (game.settings.get("Alternityd100", "starshipDurability") == "warships") ? data.isUseWarshipsOptions = true : data.isUseWarshipsOptions = false;


        // let tier = parseFloat(data.system.details?.tier || 0);
        // let tiers = { 0: "0", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        // data.labels["tier"] = tier >= 1 ? String(tier) : tiers[tier] || 1;
        //console.log("Data", data)
        if (data) this._getCrewData(data);
        this._getShipStatusData(data);


        // Encrich text editors
        data.enrichedDescription = await TextEditor.enrichHTML(this.object.system.details.notes, { async: true });



        data.scanTargets = this.object.system.scanTargets

        //data.compartTable = "<td style=\"border: 0px; background-color: #eef8f8; border-color: #eef8f8; \" ></td><td>cell2_2</td><td style=\"border: 0px; background-color: #eef8f8; border-color: #eef8f8; \" ></td>"
        //data.compartTable = "<td>cell1_3</td><td>cell2_3</td><td>cell3_3</td></tr>"
        data.powerOverload = this.powerOverload
        return data;

    }

    /**
     * Process any flags that the actor might have that would affect the sheet .
     * 
     * @param {Object} data The data object to update with any crew data.
     */
    async _getShipStatusData(data) {

        let shape = []
        console.log(data)


        //actor.system.compartment.compartments
        //d100A.compartments
        let compartments = this.actor.system?.compartment.compartments
        console.log(this.actor.system?.compartment)

        //filter(item => item.isCompartment == true );
        const itemData = this.actor.system?.frame?.system

        //console.log( "value" , compartments)
        if (game.settings.get("Alternityd100", "starshipCompartments") == "warships") // ***this should be set to not = ***
        {
            var basesize
            data.numCompartments = this.actor.system.compartment.config.length
            if ((itemData?.size == "small") && (itemData?.hullPoints.total <= 20)) basesize = "small2";
            else if ((itemData?.size == "small") && (itemData?.hullPoints.total > 20)) basesize = "small4"
            else basesize = itemData?.size || 2;
            shape = d100A.starship.compartmentShape[basesize]
            data.numCompartments = d100A.starship.numCompartments[basesize]
            //let compartments = data.numCompartments
        }
        if (game.settings.get("Alternityd100", "starshipCompartments") == "standard") {
            data.numCompartments = this.actor.system?.frame?.system?.numCompartments || 2
            switch (data.numCompartments) {
                case 6:
                    shape = [[false, "F", false], [false, "FC", false], ["L", "AC", "R"], [false, "A", false]]
                    //shape = [false,true,false,false,true,false,true,true,true,false,true,false]
                    break;
                case 2:
                    shape = [[false, "F", false], [false, "A", false]]
                    //shape = [false,true,false,false,true,false,true,true,true,false,true,false]
                    break;
                default:
                    shape = []
            }
        }



        let tempCellNo = 0
        //data.compartTable = []
        const m = shape?.length;
        const n = 3;
        data.compartTable = Array.from(Array(m), () => new Array(n));
        //console.log(shape,data.numCompartments)

        for (let row = 0; row < shape?.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                tempCellNo += 1
                // console.log("data.compartTable",row,col)
                if (!shape[row][col]) data.compartTable[row][col] = { "isBlank": true, "value": tempCellNo };

                else {
                    //   console.log(d100A.compartment.super["FC"],shape[row][col],d100A.compartment.super[shape[row][col]])
                    //   console.log(compartments,shape,row,col,shape[row][col])
                    //   console.log(data.numCompartments,shape,row,col,shape[row][col],d100A.compartmentData[shape[row][col]])
                    let tempcompart = compartments[shape[row][col]];




                    //    console.log("tempcompart", tempcompart) //, tempcompart.durability
                    data.compartTable[row][col] = {
                        "title": d100A.compartment.super[shape[row][col]],
                        "name": d100A.compartment.super[shape[row][col]],
                        "isBlank": false,
                        "value": tempCellNo,
                        "systems": tempcompart.contents, //put all the systems in
                        "image": { "bad": "systems/Alternityd100/icons/conditions/alt_bad2.png", "good": "systems/Alternityd100/icons/conditions/alt_good1.png" },
                        "durability": tempcompart.durability,
                        "location": tempcompart.location,
                        "overload": tempcompart.overload,
                        "curHull": tempcompart.curHull,
                        "maxHull": tempcompart.maxHull,


                    };

                    //console.log(data.compartTable[row][col].title,"tempcompart",tempcompart)

                }
            }


        }


    }

    /**
  * Process any flags that the actor might have that would affect the sheet .
  * 
  * @param {Object} data The data object to update with any crew data.
  */
    async _getNPCCrewData(data) {


        if (actorData.crew?.useNPCCrew) {
            let NoNPCCrew = actorData.frame?.system?.crew.minimum || 0
            console.log("NoNPCCrew - ", NoNPCCrew)

            for (let crewno; crewno < NoNPCCrew; crewno++) {

            }
        }



        let crewData = this.actor.system.crew;

        if (!crewData || this.actor.system?.flags?.shipsCrew) {
            crewData = await this._processFlags(data, data.actor.flags);
        }



        const captainActors = crewData.captain.actorIds.map(crewId => game.actors.get(crewId));
        const pilotActors = crewData.pilot.actorIds.map(crewId => game.actors.get(crewId));
        const copilotActors = crewData.copilot.actorIds.map(crewId => game.actors.get(crewId));
        // const navigationActors = crewData.navigation.actorIds.map(crewId => game.actors.get(crewId));
        const communicationsActors = crewData.communications.actorIds.map(crewId => game.actors.get(crewId));
        const damageControlActors = crewData.damageControl.actorIds.map(crewId => game.actors.get(crewId));
        const defencesActors = crewData.defences.actorIds.map(crewId => game.actors.get(crewId));
        const engineerActors = crewData.engineer.actorIds.map(crewId => game.actors.get(crewId));
        const sensorsActors = crewData.sensors.actorIds.map(crewId => game.actors.get(crewId));
        const gunnerActors = crewData.gunner.actorIds.map(crewId => game.actors.get(crewId));
        // const scienceOfficerActors = crewData.scienceOfficer.actorIds.map(crewId => game.actors.get(crewId));
        // const chiefMateActors = crewData.chiefMate.actorIds.map(crewId => game.actors.get(crewId));
        // const magicOfficerActors = crewData.magicOfficer.actorIds.map(crewId => game.actors.get(crewId));
        // const passengerActors = crewData.passenger.actorIds.map(crewId => game.actors.get(crewId));
        const localizedNoLimit = game.i18n.format("SFRPG.StarshipSheet.Crew.UnlimitedMax");

        let crew = {
            captain: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Captain"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Captain") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": captainActors.length, "max": crewData.captain.limit > -1 ? crewData.captain.limit : localizedNoLimit }), actors: captainActors, dataset: { type: "shipsCrew", role: "captain" } },
            pilot: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Pilot"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Pilot") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": pilotActors.length, "max": crewData.pilot.limit > -1 ? crewData.pilot.limit : localizedNoLimit }), actors: pilotActors, dataset: { type: "shipsCrew", role: "pilot" } },
            copilot: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Copilot"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Copilot") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": copilotActors.length, "max": crewData.copilot.limit > -1 ? crewData.copilot.limit : localizedNoLimit }), actors: copilotActors, dataset: { type: "shipsCrew", role: "copilot" } },
            //    navigation: { skill: [],shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Navigation"),label: game.i18n.format("SFRPG.StarshipSheet.Crew.Navigation") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": navigationActors.length, "max": crewData.navigation.limit > -1 ? crewData.navigation.limit : localizedNoLimit}), actors: navigationActors, dataset: { type: "shipsCrew", role: "navigation" }},
            communications: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Communications"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Communications") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": communicationsActors.length, "max": crewData.communications.limit > -1 ? crewData.communications.limit : localizedNoLimit }), actors: communicationsActors, dataset: { type: "shipsCrew", role: "communications" } },
            damageControl: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.DamageControl"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.DamageControl") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": damageControlActors.length, "max": crewData.damageControl.limit > -1 ? crewData.damageControl.limit : localizedNoLimit }), actors: damageControlActors, dataset: { type: "shipsCrew", role: "damageControl" } },
            defences: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Defences"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Defences") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": defencesActors.length, "max": crewData.defences.limit > -1 ? crewData.defences.limit : localizedNoLimit }), actors: defencesActors, dataset: { type: "shipsCrew", role: "defences" } },
            engineer: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Engineers"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Engineers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": engineerActors.length, "max": crewData.engineer.limit > -1 ? crewData.engineer.limit : localizedNoLimit }), actors: engineerActors, dataset: { type: "shipsCrew", role: "engineer" } },
            sensors: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Sensors"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Sensors") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": sensorsActors.length, "max": crewData.sensors.limit > -1 ? crewData.sensors.limit : localizedNoLimit }), actors: sensorsActors, dataset: { type: "shipsCrew", role: "sensors" } },


            gunner: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Gunner"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Gunner") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": gunnerActors.length, "max": crewData.gunner.limit > -1 ? crewData.gunner.limit : localizedNoLimit }), actors: gunnerActors, dataset: { type: "shipsCrew", role: "gunner" } },
            //    scienceOfficers: { skill: [],shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.ScienceOfficers"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.ScienceOfficers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": scienceOfficerActors.length, "max": crewData.scienceOfficer.limit > -1 ? crewData.scienceOfficer.limit : localizedNoLimit}), actors: scienceOfficerActors, dataset: { type: "shipsCrew", role: "scienceOfficer" }},
            //   chiefMates: { skill: [],shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.ChiefMates"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.ChiefMates") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": chiefMateActors.length, "max": crewData.chiefMate.limit > -1 ? crewData.chiefMate.limit : localizedNoLimit}), actors: chiefMateActors, dataset: { type: "shipsCrew", role: "chiefMate" }},
            //   magicOfficers: { skill: [],shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.MagicOfficers"),label: game.i18n.format("SFRPG.StarshipSheet.Crew.MagicOfficers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": magicOfficerActors.length, "max": crewData.magicOfficer.limit > -1 ? crewData.magicOfficer.limit : localizedNoLimit}), actors: magicOfficerActors, dataset: { type: "shipsCrew", role: "magicOfficer" }},
            //   passengers: { skill: [],shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Passengers"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Passengers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", {"current": passengerActors.length, "max": crewData.passenger.limit > -1 ? crewData.passenger.limit : localizedNoLimit}), actors: passengerActors, dataset: { type: "shipsCrew", role: "passenger" }}
        };

        // Thias is pretty clunky. re write this one day

        /*
        let score = "[" + captainActors[0].system.skills.comma.base + "/" + captainActors[0].system.skills.comma.good + "/" + captainActors[0].system.skills.comma.amazing + "]" + captainActors[0].system.skills.comma.stepdie
        crew.captain.skill[0] = {label: captainActors[0].system.skills.leade.label + "-" + captainActors[0].system.skills.comma.label, score : score}
        score = "[" + captainActors[0].system.skills.space.base + "/" + captainActors[0].system.skills.space.good + "/" + captainActors[0].system.skills.space.amazing + "]" + captainActors[0].system.skills.space.stepdie
        crew.captain.skill[1] = {label: captainActors[0].system.skills.tacti.label + "-" + captainActors[0].system.skills.space.label , score : score}
        */


        for (let [key, role] of Object.entries(crew)) {
            role.actorlist = []

            for (let thisactor of role.actors) {
                let actor = {}
                console.log("\n----SkillArray\n", d100A.skillArray[key], role)

                let tempskill = {}
                let tempskillGen = {}
                let score = ""
                let label = ""


                for (let thisskill of d100A.skillArray[key]) {

                    tempskill = thisactor.system.skills[thisskill.name]
                    tempskillGen = thisactor.system.skills[thisskill.bname]
                    console.log(tempskill)
                    score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
                    label = tempskillGen.label + "-" + tempskill.label

                    actor[thisskill.name] = { actor: thisactor, tempskill: tempskill, score: score, label: label, attrib: thisskill.attrib, name: thisskill.name };

                }

                role.actorlist.push(actor)






            }


        }


        /*  if (captainActors.length){
  
              tempskill = captainActors[0].system.skills.comma
              tempskillGen = captainActors[0].system.skills.leade
              score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
              crew.captain.skill[0] = {label: tempskillGen.label +"-"+ tempskill.label , score : score, attrib : "per",name : "comma" }
              
              tempskill = captainActors[0].system.skills.space
              tempskillGen = captainActors[0].system.skills.tacti
              score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
              crew.captain.skill[1] = {label: tempskillGen.label +"-"+ tempskill.label , score : score, attrib : "int",name : "space"}
          }
  */

        let tempskill = {}
        let tempskillGen = {}
        let score = ""

        if (pilotActors.length) {
            tempskill = pilotActors[0].system.skills.spaceve
            tempskillGen = pilotActors[0].system.skills.vehicop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.pilot.skill[0] = { label: "VO-" + tempskill.label, score: score }
        }

        if (copilotActors.length) {
            tempskill = copilotActors[0].system.skills.spaceve
            tempskillGen = copilotActors[0].system.skills.vehicop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.copilot.skill[0] = { label: "VO-" + tempskill.label, score: score }
        }

        if (navigationActors.length) {
            tempskill = navigationActors[0].system.skills.systeas
            tempskillGen = navigationActors[0].system.skills.navig
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.navigation.skill[0] = { label: "NAV-" + tempskill.label, score: score }

            tempskill = navigationActors[0].system.skills.driveas
            tempskillGen = navigationActors[0].system.skills.navig
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.navigation.skill[1] = { label: "NAV-" + tempskill.label, score: score }
        }

        if (communicationsActors.length) {
            tempskill = communicationsActors[0].system.skills.commu
            tempskillGen = communicationsActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.communications.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }

        if (damageControlActors.length) {
            tempskill = damageControlActors[0].system.skills.juryr
            tempskillGen = damageControlActors[0].system.skills.technsc
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.damageControl.skill[0] = { label: "TSc-" + tempskill.label, score: score }

            tempskill = damageControlActors[0].system.skills.repai
            tempskillGen = damageControlActors[0].system.skills.technsc
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.damageControl.skill[1] = { label: "TSc-" + tempskill.label, score: score }
        }
        if (defencesActors.length) {
            tempskill = defencesActors[0].system.skills.defen
            tempskillGen = defencesActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.defences.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }
        if (engineerActors.length) {
            tempskill = engineerActors[0].system.skills.engin
            tempskillGen = engineerActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.engineer.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }
        if (sensorsActors.length) {
            tempskill = sensorsActors[0].system.skills.senso
            tempskillGen = sensorsActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.sensors.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }
        if (gunnerActors.length) {
            tempskill = gunnerActors[0].system.skills.weapo
            tempskillGen = gunnerActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.gunner.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }


        data.crew = Object.values(crew);
        console.log("Crew", data.crew)
    }

    /***
     * During a phase in which the oper- ator of a vehicle is entitled to an ac- tion, ho can attempt to 
     * perform a Moderate or Extreme maneuver, 
     * try to employ vehicular systems such as weapons or Defences, 
     * or attempt a Tactics check
     * 
     */


    /**
     * Process any flags that the actor might have that would affect the sheet .
     * 
     * @param {Object} data The data object to update with any crew data.
     */
    async _getCrewData(data) {
        let crewData = this.actor.system.crew;

        if (!crewData || this.actor.system?.flags?.shipsCrew) {
            crewData = await this._processFlags(data, data.actor.flags);
        }



        const captainActors = crewData.captain.actorIds.map(crewId => game.actors.get(crewId));
        const pilotActors = crewData.pilot.actorIds.map(crewId => game.actors.get(crewId));
        const copilotActors = crewData.copilot.actorIds.map(crewId => game.actors.get(crewId));
        //  const navigationActors = crewData.navigation.actorIds.map(crewId => game.actors.get(crewId));
        const communicationsActors = crewData.communications.actorIds.map(crewId => game.actors.get(crewId));
        const damageControlActors = crewData.damageControl.actorIds.map(crewId => game.actors.get(crewId));
        const defencesActors = crewData.defences.actorIds.map(crewId => game.actors.get(crewId));
        const engineerActors = crewData.engineer.actorIds.map(crewId => game.actors.get(crewId));
        const sensorsActors = crewData.sensors.actorIds.map(crewId => game.actors.get(crewId));
        const gunnerActors = crewData.gunner.actorIds.map(crewId => game.actors.get(crewId));
        //  const scienceOfficerActors = crewData.scienceOfficer.actorIds.map(crewId => game.actors.get(crewId));
        //  const chiefMateActors = crewData.chiefMate.actorIds.map(crewId => game.actors.get(crewId));
        //  const magicOfficerActors = crewData.magicOfficer.actorIds.map(crewId => game.actors.get(crewId));
        //  const passengerActors = crewData.passenger.actorIds.map(crewId => game.actors.get(crewId));
        const localizedNoLimit = game.i18n.format("SFRPG.StarshipSheet.Crew.UnlimitedMax");

        let crew = {
            captain: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Captain"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Captain") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": captainActors.length, "max": crewData.captain.limit > -1 ? crewData.captain.limit : localizedNoLimit }), actors: captainActors, dataset: { type: "shipsCrew", role: "captain" } },
            pilot: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Pilot"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Pilot") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": pilotActors.length, "max": crewData.pilot.limit > -1 ? crewData.pilot.limit : localizedNoLimit }), actors: pilotActors, dataset: { type: "shipsCrew", role: "pilot" } },
            copilot: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Copilot"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Copilot") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": copilotActors.length, "max": crewData.copilot.limit > -1 ? crewData.copilot.limit : localizedNoLimit }), actors: copilotActors, dataset: { type: "shipsCrew", role: "copilot" } },
            communications: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Communications"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Communications") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": communicationsActors.length, "max": crewData.communications.limit > -1 ? crewData.communications.limit : localizedNoLimit }), actors: communicationsActors, dataset: { type: "shipsCrew", role: "communications" } },
            damageControl: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.DamageControl"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.DamageControl") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": damageControlActors.length, "max": crewData.damageControl.limit > -1 ? crewData.damageControl.limit : localizedNoLimit }), actors: damageControlActors, dataset: { type: "shipsCrew", role: "damageControl" } },
            defences: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Defences"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Defences") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": defencesActors.length, "max": crewData.defences.limit > -1 ? crewData.defences.limit : localizedNoLimit }), actors: defencesActors, dataset: { type: "shipsCrew", role: "defences" } },
            engineer: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Engineers"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Engineers") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": engineerActors.length, "max": crewData.engineer.limit > -1 ? crewData.engineer.limit : localizedNoLimit }), actors: engineerActors, dataset: { type: "shipsCrew", role: "engineer" } },
            sensors: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Sensors"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Sensors") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": sensorsActors.length, "max": crewData.sensors.limit > -1 ? crewData.sensors.limit : localizedNoLimit }), actors: sensorsActors, dataset: { type: "shipsCrew", role: "sensors" } },
            gunner: { skill: [], shortlabel: game.i18n.format("SFRPG.StarshipSheet.Crew.Gunner"), label: game.i18n.format("SFRPG.StarshipSheet.Crew.Gunner") + " " + game.i18n.format("SFRPG.StarshipSheet.Crew.AssignedCount", { "current": gunnerActors.length, "max": crewData.gunner.limit > -1 ? crewData.gunner.limit : localizedNoLimit }), actors: gunnerActors, dataset: { type: "shipsCrew", role: "gunner" } },

        };

        // Thias is pretty clunky. re write this one day

        /*
        let score = "[" + captainActors[0].system.skills.comma.base + "/" + captainActors[0].system.skills.comma.good + "/" + captainActors[0].system.skills.comma.amazing + "]" + captainActors[0].system.skills.comma.stepdie
        crew.captain.skill[0] = {label: captainActors[0].system.skills.leade.label + "-" + captainActors[0].system.skills.comma.label, score : score}
        score = "[" + captainActors[0].system.skills.space.base + "/" + captainActors[0].system.skills.space.good + "/" + captainActors[0].system.skills.space.amazing + "]" + captainActors[0].system.skills.space.stepdie
        crew.captain.skill[1] = {label: captainActors[0].system.skills.tacti.label + "-" + captainActors[0].system.skills.space.label , score : score}
        */


        for (let [key, role] of Object.entries(crew)) {
            role.actorlist = []

            for (let thisactor of role.actors) {
                let actor = {}
                console.log("\n----SkillArray\n", d100A.skillArray[key], role)

                let tempskill = {}
                let tempskillGen = {}
                let score = ""
                let label = ""


                for (let thisskill of d100A.skillArray[key]) {

                    tempskill = thisactor.system.skills[thisskill.name]
                    tempskillGen = thisactor.system.skills[thisskill.bname]
                    console.log(tempskill)
                    score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
                    label = tempskillGen.label + "-" + tempskill.label

                    actor[thisskill.name] = { actor: thisactor, tempskill: tempskill, score: score, label: label, attrib: thisskill.attrib, name: thisskill.name };

                }

                role.actorlist.push(actor)






            }


        }


        /*  if (captainActors.length){
  
              tempskill = captainActors[0].system.skills.comma
              tempskillGen = captainActors[0].system.skills.leade
              score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
              crew.captain.skill[0] = {label: tempskillGen.label +"-"+ tempskill.label , score : score, attrib : "per",name : "comma" }
              
              tempskill = captainActors[0].system.skills.space
              tempskillGen = captainActors[0].system.skills.tacti
              score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
              crew.captain.skill[1] = {label: tempskillGen.label +"-"+ tempskill.label , score : score, attrib : "int",name : "space"}
          }
  */

        let tempskill = {}
        let tempskillGen = {}
        let score = ""

        if (pilotActors.length) {
            tempskill = pilotActors[0].system.skills.spaceve
            tempskillGen = pilotActors[0].system.skills.vehicop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.pilot.skill[0] = { label: "VO-" + tempskill.label, score: score }
        }

        if (copilotActors.length) {
            tempskill = copilotActors[0].system.skills.spaceve
            tempskillGen = copilotActors[0].system.skills.vehicop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.copilot.skill[0] = { label: "VO-" + tempskill.label, score: score }
        }

        /*   if (navigationActors.length){
                   tempskill = navigationActors[0].system.skills.systeas
                   tempskillGen = navigationActors[0].system.skills.navig
                   score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
                   crew.navigation.skill[0] = {label: "NAV-" + tempskill.label , score : score}
                   
                   tempskill = navigationActors[0].system.skills.driveas
                   tempskillGen = navigationActors[0].system.skills.navig
                   score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
                   crew.navigation.skill[1] = {label: "NAV-" + tempskill.label , score : score}
           }
   */
        if (communicationsActors.length) {
            tempskill = communicationsActors[0].system.skills.commu
            tempskillGen = communicationsActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.communications.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }

        if (damageControlActors.length) {
            tempskill = damageControlActors[0].system.skills.juryr
            tempskillGen = damageControlActors[0].system.skills.technsc
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.damageControl.skill[0] = { label: "TSc-" + tempskill.label, score: score }

            tempskill = damageControlActors[0].system.skills.repai
            tempskillGen = damageControlActors[0].system.skills.technsc
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.damageControl.skill[1] = { label: "TSc-" + tempskill.label, score: score }
        }
        if (defencesActors.length) {
            tempskill = defencesActors[0].system.skills.defen
            tempskillGen = defencesActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.defences.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }
        if (engineerActors.length) {
            tempskill = engineerActors[0].system.skills.engin
            tempskillGen = engineerActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.engineer.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }
        if (sensorsActors.length) {
            tempskill = sensorsActors[0].system.skills.senso
            tempskillGen = sensorsActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.sensors.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }
        if (gunnerActors.length) {
            tempskill = gunnerActors[0].system.skills.weapo
            tempskillGen = gunnerActors[0].system.skills.systeop
            score = "[" + tempskill.base + "/" + tempskill.good + "/" + tempskill.amazing + "]" + tempskill.stepdie
            crew.gunner.skill[0] = { label: "SO-" + tempskill.label, score: score }
        }


        data.crew = Object.values(crew);
        //    console.log("Crew",data.crew)
    }

    /**
     * Process any flags that the actor might have that would affect the sheet .
     * 
     * @param {Object} data The data object to update with any flag data.
     * @param {Object} flags The set of flags for the Actor
     */
    async _processFlags(data, flags) {
        let newCrew = {
            captain: {
                limit: 1,
                actorIds: []
            },
            pilot: {
                limit: 1,
                actorIds: []
            },
            copilot: {
                limit: 1,
                actorIds: []
            },
            //   navigation: {
            //       limit: 1,
            //       actorIds: []
            //   },   
            communications: {
                limit: 1,
                actorIds: []
            },
            damageControl: {
                limit: -1,
                actorIds: []
            },
            defences: {
                limit: 1,
                actorIds: []
            },
            engineer: {
                limit: -1,
                actorIds: []
            },
            sensors: {
                limit: -1,
                actorIds: []
            },

            gunner: {
                limit: -1,
                actorIds: []
            },

            /*    scienceOfficer: {
                    limit: -1,
                    actorIds: []
                },           
                chiefMate: {
                    limit: -1,
                    actorIds: []
                },
    
    
                magicOfficer: {
                    limit: -1,
                    actorIds: []
                },
                passenger: {
                    limit: -1,
                    actorIds: []
                }
    */





        };

        if (!flags?.sfrpg?.shipsCrew?.members) {
            await this.actor.update({
                "system.crew": newCrew
            });
            return newCrew;
        }

        for (const actorId of flags.sfrpg.shipsCrew.members) {
            const actor = game.actors.get(actorId);
            if (!actor) continue;

            let crewMember = actor.getFlag("sfrpg", "crewMember") || null;
            if (!crewMember) continue;

            if (crewMember.role === "captain") newCrew.captain.actorIds.push(actorId);
            else if (crewMember.role === "engineer") newCrew.engineer.actorIds.push(actorId);
            else if (crewMember.role === "gunner") newCrew.gunner.actorIds.push(actorId);
            else if (crewMember.role === "pilot") newCrew.pilot.actorIds.push(actorId);
            else if (crewMember.role === "copilot") newCrew.copilot.actorIds.push(actorId);
            else if (crewMember.role === "navigation") newCrew.navigation.actorIds.push(actorId);
            else if (crewMember.role === "scienceOfficers") newCrew.scienceOfficer.actorIds.push(actorId);
            else if (crewMember.role === "passengers") newCrew.passenger.actorIds.push(actorId);
        }

        await this.actor.update({
            "data.crew": newCrew
        });

        let cleanflags = foundry.utils.duplicate(this.actor.flags);
        delete cleanflags.sfrpg.shipsCrew;

        await this.actor.update({
            "flags.sfrpg": cleanflags
        }, { recursive: false });

        return this.actor.system.crew;
    }

    _createLabel(localizationKey, items, mounts) {
        const numLightWeapons = items.filter(x => x.data.class === "light").length;
        const numHeavyWeapons = items.filter(x => x.data.class === "heavy").length;
        const numCapitalWeapons = items.filter(x => x.data.class === "capital").length;
        const numSpinalWeapons = items.filter(x => x.data.class === "spinal").length;

        const maxLightWeapons = (mounts?.lightSlots || 0);
        const maxHeavyWeapons = (mounts?.heavySlots || 0);
        const maxCapitalWeapons = (mounts?.capitalSlots || 0);
        const maxSpinalWeapons = (mounts?.spinalSlots || 0);

        let slots = "";
        if (numLightWeapons + maxLightWeapons > 0) {
            slots += game.i18n.format("SFRPG.StarshipSheet.Weapons.LightSlots", { current: numLightWeapons, max: maxLightWeapons });
        }
        if (numHeavyWeapons + maxHeavyWeapons > 0) {
            if (slots !== "") {
                slots += ", ";
            }
            slots += game.i18n.format("SFRPG.StarshipSheet.Weapons.HeavySlots", { current: numHeavyWeapons, max: maxHeavyWeapons });
        }
        if (numCapitalWeapons + maxCapitalWeapons > 0) {
            if (slots !== "") {
                slots += ", ";
            }
            slots += game.i18n.format("SFRPG.StarshipSheet.Weapons.CapitalSlots", { current: numCapitalWeapons, max: maxCapitalWeapons });
        }
        if (numSpinalWeapons + maxSpinalWeapons > 0) {
            if (slots !== "") {
                slots += ", ";
            }
            slots += game.i18n.format("SFRPG.StarshipSheet.Weapons.SpinalSlots", { current: numSpinalWeapons, max: maxSpinalWeapons });
        }
        if (slots === "") {
            slots = game.i18n.format("SFRPG.StarshipSheet.Weapons.NotAvailable");
        }

        return game.i18n.format(localizationKey, { slots: slots });
    }

    /**
     * Organize and classify items for starship sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        //  console.log(data)
        const actorData = data.system;
        const inventory = {
            inventory: { label: game.i18n.localize("SFRPG.StarshipSheet.Inventory.Inventory"), items: [], dataset: { type: d100AActorSheetStarship.AcceptedEquipment }, allowAdd: true }
        };

        const starshipSystems = [
            // "starshipAblativeArmor",

            "starshipComputer",
            "starshipCommunications"
            //  "starshipDefence",
            //  "starshipElectronicCountermeasure",
            //  "starshipDriftEngine",
            //  "starshipFortifiedHull",
            //  "starshipReinforcedBulkhead",

            //  "starshipShield"
        ];

        //   0        1          2    3     4       5          6      7           8          9               10            
        let [support, armor, defence, sensors, mounted, unmounted, frame, powerCores, engines, primarySystems, otherSystems,
            //11               12             13     14          15
            securitySystems, expansionBays, cargo, ordnance, actorResources] = data.items.reduce((arr, item) => {
                item.img = item.img || DEFAULT_TOKEN;
                //console.log(item)
                if (item.type === "actorResource") {
                    // this._prepareActorResource(item, actorData);
                }

                if (["starshipWeapon"].includes(item.type)) {
                    const weaponArc = item?.system?.mount?.arc;
                    const weaponmounted = item?.system?.mount?.mounted;
                    //console.log(item)
                    //if (weaponArc === "forward") arr[0].push(item);
                    //else if (weaponArc === "starboard") arr[1].push(item);
                    //else if (weaponArc === "aft") arr[2].push(item);
                    //else if (weaponArc === "port") arr[3].push(item);
                    if (weaponmounted) arr[4].push(item);
                    else arr[5].push(item);
                }
                if (item.type === "starshipSensor") arr[3].push(item);
                // if (item.type === "starshipSensor") arr[9].push(item);
                else if (item.type === "starshipCrewQuarter") arr[0].push(item);
                else if (item.type === "starshipArmor") arr[1].push(item);
                else if (item.type === "starshipFrame") arr[6].push(item);
                else if (item.type === "starshipPowerCore") arr[7].push(item);
                else if (item.type === "starshipEngine") arr[8].push(item);
                else if (item.type === "starshipDefence") arr[2].push(item);

                else if (starshipSystems.includes(item.type)) arr[9].push(item);
                else if (item.type === "starshipOtherSystem") arr[10].push(item);
                else if (item.type === "starshipSecuritySystem") arr[11].push(item);
                else if (item.type === "starshipExpansionBay") arr[12].push(item);
                else if (item.type === "actorResource") arr[14].push(item);

                else if (d100AActorSheetStarship.AcceptedEquipment.includes(item.type)) arr[13].push(item);

                return arr;
            }, [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]);
        // console.log(data.items,ordnance)
        this.processItemContainment(cargo, function (itemType, itemData) {
            inventory.inventory.items.push(itemData);
        });
        data.inventory = inventory;

        let totalValue = 0;
        for (const item of cargo) {
            totalValue += (item?.quantity || 0) * (item?.price || 0);
            item.isStack = item.quantity ? item.quantity > 1 : false;
            item.isOpen = item.container?.isOpen === undefined ? true : item.container.isOpen;
        }
        data.inventoryValue = Math.floor(totalValue);

        const weapons = [].concat(mounted);
        for (const weapon of weapons) {
            //  console.log(weapon)


            if (weapon.hasCapacity) {
                weapon.capacityCurrent = weapon.getCurrentCapacity;
                weapon.capacityMaximum = weapon.getMaxCapacity;
            }
        }

        const weaponMounts = this.actor.system.frame?.weaponMounts;
        //const hasForward = weaponMounts?.forward?.lightSlots || weaponMounts?.forward?.heavySlots || weaponMounts?.forward?.capitalSlots;
        //const hasStarboard = weaponMounts?.starboard?.lightSlots || weaponMounts?.starboard?.heavySlots || weaponMounts?.starboard?.capitalSlots;
        //const hasPort = weaponMounts?.port?.lightSlots || weaponMounts?.port?.heavySlots || weaponMounts?.port?.capitalSlots;
        //const hasAft = weaponMounts?.aft?.lightSlots || weaponMounts?.aft?.heavySlots || weaponMounts?.aft?.capitalSlots;
        //const hasTurret = weaponMounts?.turret?.lightSlots || weaponMounts?.turret?.heavySlots || weaponMounts?.turret?.capitalSlots;

        // const forwardLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.ForwardArc", forward, weaponMounts?.forward);
        // const starboardLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.StarboardArc", starboard, weaponMounts?.starboard);
        //  const portLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.PortArc", port, weaponMounts?.port);
        //  const aftLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.AftArc", aft, weaponMounts?.aft);
        // const turretLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.Turret", turret, weaponMounts?.turret);
        // const mountedLabel = this._createLabel("SFRPG.StarshipSheet.Weapons.Mounted", mounted, weaponMounts?.mounted);
        const arcs = {
            //forward: { label: forwardLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasForward }},
            //starboard: { label: starboardLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasStarboard }},
            //port: { label: portLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasPort }},
            //aft: { label: aftLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasAft }},
            //turret: { label: turretLabel, items: [], dataset: { type: "starshipWeapon", allowAdd: false, isDisabled: !hasTurret }},
            mounted: { label: game.i18n.format("SFRPG.StarshipSheet.Weapons.Mounted"), items: [], dataset: { type: "starshipWeapon", allowAdd: true } },
            sensor: { label: game.i18n.format("Sensors"), items: [], dataset: { type: "starshipSensor", allowAdd: true } },
            unmounted: { label: game.i18n.format("SFRPG.StarshipSheet.Weapons.NotMounted"), items: [], dataset: { type: "starshipWeapon", allowAdd: true } }


        };

        arcs.mounted.items = mounted;
        arcs.sensor.items = sensors;
        ///arcs.port.items = port;
        //arcs.aft.items = aft;
        //arcs.turret.items = turret;
        arcs.unmounted.items = unmounted;

        data.arcs = Object.values(arcs);

        const features = {
            frame: { label: game.i18n.format("SFRPG.StarshipSheet.Features.Frame", { "current": frame.length }), items: frame, hasActions: false, dataset: { type: "starshipFrame" } },
            armor: { label: game.i18n.format("Armor"), items: armor, hasActions: false, dataset: { type: "starshipArmor" } },
            powerCores: { label: game.i18n.format("SFRPG.StarshipSheet.Features.PowerCores"), items: powerCores, hasActions: false, dataset: { type: "starshipPowerCore" } },
            engines: { label: game.i18n.format("SFRPG.StarshipSheet.Features.Engines"), items: engines, hasActions: false, dataset: { type: "starshipEngine" } },
            support: { label: game.i18n.format("Support Systems"), items: support, hasActions: false, dataset: { type: "starshipCrewQuarter" } },
            weapons: { label: game.i18n.format("SFRPG.StarshipSheet.Features.Weapons"), items: mounted, hasActions: false, dataset: { type: "starshipWeapon,starshipSensor" } },
            defence: { label: game.i18n.format("Defences"), items: defence, hasActions: false, dataset: { type: "starshipDefence" } },
            sensor: { label: game.i18n.format("Sensors"), items: sensors, hasActions: false, dataset: { type: "starshipSensor" } },
            primarySystems: { label: game.i18n.format("SFRPG.StarshipSheet.Features.PrimarySystems"), items: primarySystems, hasActions: false, dataset: { type: starshipSystems.join(',') } },
            otherSystems: { label: game.i18n.format("SFRPG.StarshipSheet.Features.OtherSystems"), items: otherSystems, hasActions: false, dataset: { type: "starshipOtherSystem" } },
            //  securitySystems: { label: game.i18n.format("SFRPG.StarshipSheet.Features.SecuritySystems"), items: securitySystems, hasActions: false, dataset: { type: "starshipSecuritySystem" } },
            //   expansionBays: { label: game.i18n.format("SFRPG.StarshipSheet.Features.ExpansionBays", {current: expansionBays.length, max: data.system.attributes.expansionBays?.value}), items: expansionBays, hasActions: false, dataset: { type: "starshipExpansionBay" } },
            ordnance: { label: game.i18n.format("SFRPG.StarshipSheet.Features.Ordnance"), items: ordnance, hasActions: false, dataset: { type: "starshipOrdnance" } },
            //  resources: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActorResources"), items: actorResources, hasActions: false, dataset: { type: "actorResource" } }

        };

        data.features = Object.values(features);

        data.activeFrame = frame.length > 0 ? frame[0] : null;
        data.hasPower = powerCores.length > 0;
        data.hasEngines = engines.filter(x => !x.isFTL).length > 0;

        data.prefixTable = {
            starshipAblativeArmor: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipAblativeArmors"),
            starshipArmor: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipArmors"),
            starshipComputer: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipComputers"),
            starshipCrewQuarter: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipCrewQuarters"),
            starshipDefence: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipDefences"),
            starshipElectronicCountermeasure: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipElectronicCountermeasures"),
            starshipDriftEngine: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipDriftEngine"),
            starshipExpansionBay: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipExpansionBays"),
            starshipFortifiedHull: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipFortifiedHulls"),
            starshipFrame: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipFrames"),
            starshipOtherSystem: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipOtherSystems"),
            starshipOrdnance: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipOrdnance"),
            starshipPowerCore: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipPowerCores"),
            starshipReinforcedBulkhead: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipReinforcedBulkheads"),
            starshipSecuritySystem: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipSecuritySystems"),
            starshipSensor: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipSensors"),
            starshipShield: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipShields"),
            starshipEngine: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipEngines"),
            starshipWeapon: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipWeapons"),
            missile: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipOrdnance.missile"),
            bomb: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipOrdnance.bomb"),
            mine: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipOrdnance.mine"),
            torp: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipOrdnance.torpedo"),
            special: game.i18n.localize("SFRPG.StarshipSheet.Features.Prefixes.StarshipOrdnance.special")
        };



        //    console.log(d100AActorSheetStarship.StarshipActionsCache);


        if (!this.actor.system.crew?.useNPCCrew) {
            data.actions = d100AActorSheetStarship.StarshipActionsCache;
        } else {
            data.actions = {};


            //  "captain", "pilot", "copilot", "sensors" , "communications", "engineer", "damageControl", "defences",  "gunner", "scienceOfficer",  "navigation","chiefMate", "magicOfficer", "openCrew", "minorCrew"
            data.actions = {
                captain: d100AActorSheetStarship.StarshipActionsCache.captain,
                pilot: d100AActorSheetStarship.StarshipActionsCache.pilot,
                copilot: d100AActorSheetStarship.StarshipActionsCache.copilot,
                communications: d100AActorSheetStarship.StarshipActionsCache.communications,
                damageControl: d100AActorSheetStarship.StarshipActionsCache.damageControl,
                defences: d100AActorSheetStarship.StarshipActionsCache.defences,
                engineer: d100AActorSheetStarship.StarshipActionsCache.engineer,
                sensors: d100AActorSheetStarship.StarshipActionsCache.sensors,
                gunner: d100AActorSheetStarship.StarshipActionsCache.gunner,


                //  "captain", "pilot", "copilot", "communications","damageControl",  "defences",  "engineer", "sensors" ,    "gunner"
            };
        }

        //console.log(this)
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {

        super.activateListeners(html);
        // console.log("HERE--",html)
        if (!this.options.editable) return;

        // Crew Tab
        html.find('.crew-view').click(event => this._onActorView(event));
        //html.find('.crew-score').click(event => this._onActionRoll(event));

        html.find('.crew-delete').click(this._onRemoveFromCrew.bind(this));
        html.find('.crew-combat').click(this._onCrewCombat.bind(this));
        let handler = ev => this._onDragCrewStart(ev);
        html.find('li.crew').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        html.find('.crew-list').each((i, li) => {
            li.addEventListener("dragover", this._onCrewDragOver.bind(this), false);
            // li.addEventListener("drop", this._onCrewDrop.bind(this), false);
        });

        html.find('li.crew-header').each((i, li) => {
            li.addEventListener("dragenter", this._onCrewDragEnter, false);
            li.addEventListener("dragleave", this._onCrewDragLeave, false);
        });

        html.find('.action .action-name h4').click(event => this._onCrewActionOpen(event));//_onActionRoll
        html.find('.action .action-image').click(event => this._onCrewActionRoll(event));
        //  html.find('.action .action-image').click(event => this._onActionRoll(event));
        html.find('.action-name2').click(event => this._onNPCreset(event));

        html.find('.crew-score').click(event => this._onSkillroll(event));

        html.find('.skill-create').click(ev => this._onCrewSkillCreate(ev));
        html.find('.skill-delete').click(this._onCrewSkillDelete.bind(this));
        html.find('.crew-role-alter').change(this._onCrewChanged.bind(this));


        html.find('.scan-refresh').click(this._onscanRefresh.bind(this));

        html.find('.systdamagebutton').click(this._onsystdamagebutton.bind(this));
        html.find('.damagecheckbutton').click(this._ondamagecheckbutton.bind(this));



        html.find('.crew-skill-mod').change(this._onCrewSkillModifierChanged.bind(this));
        html.find('.crew-skill-ranks').change(this._onCrewSkillRanksChanged.bind(this));

        html.find('.critical-edit').click(this._onEditAffectedCriticalRoles.bind(this));

        html.find('.reload').click(this._onWeaponReloadClicked.bind(this));

        html.find('.value-compt').change(event => this._onChangeCompartment(event));
        html.find('.value-equipmentStatus').change(event => this._onChangeStatus(event));
        html.find('.setCompartmentDur').change(event => this._onChangesetCompartmentDur(event));
        html.find('.clickonoff').click(event => this._onOnOff(event));
        html.find('.clickoverload').click(event => this._toggleOverload(event));

    }
    _toggleOverload(event) {
        console.log("HERE--", event)
        // _onItemRollAttack(event,attackType) {
        //     event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        console.log("User Targets", item,itemId);
        //console.log( event.target.value)
if (!item.system.isPowered){

    item.update({ "system.overPowered": false })

}
else {

    if (item.system.pcu > 0) item.update({ "system.overPowered": !item.system.overPowered });

}


      
        //console.log("User Targets", item,itemId);

        //    attackType = item.system.fireMode;
        // console.log("event",event)
        //    return item.rollAttack({event: event, attackType: attackType});
        //  }


    }

get powerOverload()

{

if (this.actor.system.attributes.power.value > this.actor.system.attributes.power.max) return true

return false

}

    _onCrewCombat(event) {


        const actorId = $(event.currentTarget).parents('.crew').data('actorId');
        console.log("Hello", actorId, event)
        const role = this.actor.getCrewRoleForActor(actorId)
        const tokena = this.token
        console.log("Hello", actorId, role)
        console.log("Token", tokena)
        const crewactor = game.actors.get(actorId);
        //if (!["npcData","useNPCCrew"].includes(ck) )
        console.log("Actor", crewactor)



        const createData = [{
            tokenId: tokena.id,
            sceneId: tokena.parent.id,
            ship: tokena.actor,
            actorId: crewactor.id,
            hidden: false,
            flags: { npcCrew: false, crewRole: role }
        }];

        const combat = this.token.combatant.combat ?? game.combats.viewed;
        const crewman = combat.createEmbeddedDocuments("Combatant", createData);

        //crewman[0].ship = createData[0].actor
        console.log("crewman", crewman)
    }

    async _onCrewActionRoll(event) {
        console.log("Ping")
        event.preventDefault();
        const actionId = event.currentTarget.closest('.action').dataset.actionId;

        const skill = event.currentTarget.parentElement.dataset.skill;

        //  const action = game.compendium.get()

        //return this.actor.useStarshipAction(actionId);

        const compendium = game.packs.get("Alternityd100.starship-actions")
        // console.log("Hello",compendium)
        const action = await compendium.getDocument(actionId)

        const role = action.system.role
        const isNPC = this.actor.system.crew.useNPCCrew
        const actorData = isNPC ? this.actor.system.crew.npcData : this.actor.system.crew[role]
        // { steps:0, event: null, skipDialog: false, staticRoll: null, chatMessage: true, noSound: false, dice: "1d20",skillflavor:"",stepbonus:0 }
        const options = { steps: 0, event: null, skipDialog: false, staticRoll: null, chatMessage: "true", noSound: false, dice: "1d20", skillflavor: "skillflavor", stepbonus: 0, degreeText: action.system.degreeText }

        if (!isNPC) {
            actorData.actors[0] ? actorData.actors[0].rollSkill(skill, options) : ui.notifications.error(`No Crew in Station`);
            console.log("GO", actionId, skill, action, actorData, this.actor.system.crew)
        }
        else {
            actorData[role].active? this.actor.rollSkill(skill, options) : ui.notifications.error(`No Crew in Station`);
          //  return rollNPC(skill,this,options,actionId)
        }

    }
    async _onCrewActionOpen(event) {
        console.log("Ping")
        event.preventDefault();
        const actionId = event.currentTarget.closest('.action').dataset.actionId;

        const skill = event.currentTarget.parentElement.dataset.skill;

        //  const action = game.compendium.get()

        //return this.actor.useStarshipAction(actionId);

        const compendium = game.packs.get("Alternityd100.starship-actions")
        console.log("Hello", compendium)
        const action = await compendium.getDocument(actionId)
        console.log("GO", actionId, skill, action)
        action.sheet.render(true)
    }



    async _onOnOff(event) {


        console.log("HERE--", event)
        // _onItemRollAttack(event,attackType) {
        //     event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        //console.log("User Targets", item,itemId);
        //console.log( event.target.value)
        if(item.system.isPowered ) {
        item.update({ "system.overPowered": false,  "system.isPowered": false })
        }
        else {
        item.update({ "system.isPowered": true })
        }
        //console.log("User Targets", item,itemId);

        //    attackType = item.system.fireMode;
        // console.log("event",event)
        //    return item.rollAttack({event: event, attackType: attackType});
        //  }


    }

    async _ondamagecheckbutton(event) {
        const data = event.currentTarget.dataset
        const contents = this.object.system.compartment.compartments[data.location]


        const actorData = this.actor.system;
        const npcCrew = actorData.crew.useNPCCrew
        const npcCrewQuality = npcCrew ? actorData.crew.npcCrewQuality : ""




        const npcSkill = d100NPCCrewStats(npcCrewQuality)

        let skillflavor = actorData.attributes.damageControl.tooltip
        let stepflavor = "Damage Check" //"Hit " + systemDmg.name
        const sensorOperator = npcCrew ? actor : actorData.crew.defences.actors[0]
        const skillId = "defen"
        let defenSkill = npcCrew ? npcSkill.skills[skillId] : sensorOperator.system.skills[skillId]
        let stepbonus = defenSkill.step + actorData.attributes.damageControl.value//+ rangesteps -  targetRes

        let defen1 = await sensorOperator.rollSkill(skillId, { steps: stepbonus, skillflavor: skillflavor, stepflavor: stepflavor })



    }
    async _onsystdamagebutton(event) {
        const data = event.currentTarget.dataset
        const contents = this.object.system.compartment.compartments[data.location]
        console.log(event, data.name, contents)
        let tothull = 0
        for (let A of contents.contents) {
            if (!["destroyed"].includes(A.system.status)) tothull += (A.system.bhpCost * 100 + 50);
        }
        const randHull = Math.ceil(Math.random() * tothull)
        //console.log (randHull,"/",tothull)
        tothull = 0
        let systemDmg = {}
        for (let A of contents.contents) {
            if (!["destroyed"].includes(A.system.status)) tothull += (A.system.bhpCost * 100 + 50);
            if (randHull <= tothull) {
                systemDmg = A
                break;
            }
        }

        console.log(systemDmg)

        // Roll the SO Defences Roll 

        const actor = systemDmg.actor;
        const actorData = actor.system;
        const npcCrew = actorData.crew.useNPCCrew
        const npcCrewQuality = npcCrew ? actorData.crew.npcCrewQuality : ""
        const npcSkill = d100NPCCrewStats(npcCrewQuality)
        //const userTargets = game.user.targets.ids

        let skillflavor = actorData.attributes.damageControl.tooltip
        let stepflavor = "Hit " + systemDmg.name
        const sensorOperator = npcCrew ? actor : actorData.crew.defences.actors[0]
        const skillId = "defen"
        let defenSkill = npcCrew ? npcSkill.skills[skillId] : sensorOperator.system.skills[skillId]
        let stepbonus = actorData.attributes.damageControl.value//+ rangesteps -  targetRes

        let defen1 = await sensorOperator.rollSkill(skillId, { steps: stepbonus, skillflavor: skillflavor, stepflavor: stepflavor })



    }


    async _onscanRefresh(event) {
        const action = event.currentTarget.dataset.scan
        
        const actorArray = await this.actor.getActiveTokens();//true, true);
        const actorToken = actorArray[0]
        const actor = this.actor
        const actorData = actor.system;
        console.log(action)
        if (action == "clear") {

            console.log(this.actor.system.scanTargets)

            let newArray = []
           return this.actor.update({ "system.scanTargets": newArray })


        }

        const targetTokens = game.scenes.viewed.tokens.filter(x => {
            return true
        })
        let maxRange = 0
        const allsensors = this.actor.items.filter(x => {
            if (x.hasScan && x.system.isPowered) {
                maxRange = Math.max(x.system.range.long, maxRange)
                return true
            }
            return false
        })


        // roll through the targets on the map update the contacts - check later to turn them into Targets
        const validScanTargets = []
        for (let token of targetTokens) {
            //   console.log(token,actorToken)
            if (!(token.id == actorToken.id)) {
                let newscan = true
                actorData.scanTargets.forEach(target => {
                    //   console.log("ID",target,target.token.id, token.id,target.token.id == token.id)
                    if (target.token.id == token.id) {

                        // delete target.token
                    //    delete target.token
                     //   target.token = { name: token.name, id: token.id, x: token.object.center.x, y: token.object.center.y }
                    //    target.size = token.actor.system.frame?.system.size || "tiny",
                    //        target.scanRes = token.actor.system.attributes.ECM,


                            validScanTargets.push(target)
                        newscan = false
                        //     console.log(target)
                    }
                })
                if (newscan) {
                    console.log(token)
                    const newscanz = {
                        token: { name: token.name, id: token.id },
                        //this.id = generateUUID()
                        hullType: token.actor.system.frame ? token.actor.system.frame.system.hullType : token.actor.system.type,
                        size: token.actor.system.frame?.system.size || "tiny",
                        scanRes: token.actor.system.attributes.ECM,
                        name: token.name,
                        sensors: [], //new Set(),
                        attackMod: 9,
                        aquired: false
                    }
                    validScanTargets.push(newscanz)
                }
            }
        }

        for (const scan of validScanTargets) {
            console.log(actorToken)

            scan.range = Math.ceil((canvas.grid.measureDistance({ x: actorToken.center.x, y: actorToken.center.y }, { x: scan.token.x, y: scan.token.y })));
            scan.ray = new Ray({ x: actorToken.center.x, y: actorToken.center.y }, { x: scan.token.x, y: scan.token.y })
            scan.angle = raytodeg(scan.ray);
            scan.collisions = await CONFIG.Canvas.polygonBackends["sight"].testCollision(scan.ray.A, scan.ray.B, { mode: "any", type: "sight" })


           const scanAll = true

            if (scanAll) {
                // for (const scan of validScanTargets) {
                // console.log(scan,allsensors,validScanTargets)
                // cycle through the sensors and update the sensors that can see the target. 
                delete scan.sensors
                scan.sensors = []
                for (let scanner of allsensors) {
                    //scan.contactScan(scanner,sensorOperator,actorToken)

                    // console.log (scan.sensors.has(scanner))
                    //this.remove("scanners")

                    //if(scan.sensors.has(scanner)) scan.sensors.delete(scanner);
                    if ((scan.range <= scanner.system.range.long) &&
                        (inArc(raytodeg(scan.ray), scanner, actorToken))
                    ) {
                        scan.sensors.push({ id: scanner.id, attBonus: scanner.system.targetingStep })
                    }

                    console.log(scan, scanner)

                    // const validTarget = await scanResult(validScan)
                    //if (validTarget){ validTargets.push(validTarget)
                    //console.log(scanner)

                }
                // console.log(scan.aquired && (!scan.sensors.length))
                // console.log("\nScan",scan.aquired ,scan.sensors.length)
                if (scan.aquired && (!scan.sensors.length)) scan.aquired = false;
   

 
            }




        }
        let x = await actor.update({ "system.scanTargets": validScanTargets })
        console.log(actor, validScanTargets, x ? x : "no X")




    }


    async _onChangesetCompartmentDur(event) {

        let actiontype = event.currentTarget.dataset.dtype;
        let category = event.currentTarget.dataset.category;
        let position = event.currentTarget.dataset.position;
        let value = parseInt(event.target.value)
        console.log(event.target.value)
        console.log(actiontype, category, position)

        let temp = foundry.utils.duplicate(this.actor.system.frame.system.compartment)
        let path = "system.compartment"
        temp[position].value = value
        //temp[position].value = value
        console.log("temp", temp)
        console.log(path, this.actor.system.frame.system.compartment[position].name)
        //if (!this.actor.system.frame.system.compartments[position].value) this.actor.system.frame.system.compartments[position].value = 0;
        const item = this.actor.items.get(this.actor.system.frame.id);
        //console.log("User Targets", item,itemId);
        //console.log( event.target.value)

        //let a = await this.actor.update ({"system.compartment": temp}) 
        let a = await item.update({ "system.compartment": temp })
        // await this.actor.system.frame.update({[path] : temp})
        //let path2 = "item.system.compartments[0]"
        //delete item.system.compartments
        console.log(this.actor.system.frame.system.compartment, item, a)
        // console.log("ID", item.id,this.actor.system.frame.id,this.actor.system.frame.system.compartment.compartments[0])  
    }

    _onChangeStatus(event) {
        console.log("HERE--", event)
        // _onItemRollAttack(event,attackType) {
        //     event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        //console.log("User Targets", item,itemId);
        //console.log( event.target.value)

        item.update({ "system.status": event.target.value })
        //console.log("User Targets", item,itemId);

        //    attackType = item.system.fireMode;
        // console.log("event",event)
        //    return item.rollAttack({event: event, attackType: attackType});
        //  }

    }



    _onChangeCompartment(event) {
        //console.log("HERE--",event)
        // _onItemRollAttack(event,attackType) {
        //     event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        //console.log("User Targets", item,itemId);
        //console.log( event.target.value)

        item.update({ "system.location": event.target.value })
        //console.log("User Targets", item,itemId);

        //    attackType = item.system.fireMode;
        // console.log("event",event)
        //    return item.rollAttack({event: event, attackType: attackType});
        //  }

    }




    /** @override */
    async x_onDrop(event) {
        event.preventDefault();

        const dragData = event.dataTransfer.getData('text/plain');
        let parsedDragData = JSON.parse(dragData);
        const uuidarray = parsedDragData.uuid.split(".")
        parsedDragData.id = uuidarray[uuidarray.length - 1]
        parsedDragData.uuidarray = uuidarray
        parsedDragData.pack = "";
        if (parsedDragData.uuidarray[0] == "Compendium") {
            let packlen = parsedDragData.uuidarray.length - 1;
            for (let a = 1; a < packlen; a++) {
                parsedDragData.pack += parsedDragData.uuidarray[a];
                if (a < packlen - 1) parsedDragData.pack += ".";
                console.log("Builder", packlen, parsedDragData.uuidarray[a], a, parsedDragData.pack)
            }

        }
        console.log("dragdata", event.dataTransfer, "dragdata", dragData, parsedDragData)
        if (!parsedDragData) {
            console.log("Unknown item data");
            return;
        }

        // return this.processDroppedData(event, parsedDragData);

        // Case - Dropped Actor
        if (parsedDragData.type === "Actor") {
            return this._onCrewDrop(event, parsedDragData);
        }

        // Case - Dropped Item
        else if (parsedDragData.type === "Item") {

            const rawItemData = await this._getItemDropData(event, parsedDragData);
            console.log(rawItemData, event, parsedDragData)
            if (rawItemData.type.startsWith("starship")) {
                let newitem = await this.actor.createEmbeddedDocuments("Item", [rawItemData]);
                //console.log(newitem)
                return newitem

            } else if (d100AActorSheetStarship.AcceptedEquipment.includes(rawItemData.type)) {
                return this.processDroppedData(event, parsedDragData);
            }
            // ****************
            //***Not an Item - Starship Item */
            // ****************



            else {
                ui.notifications.error(game.i18n.format("SFRPG.InvalidStarshipItem", { name: rawItemData.name }));
                return false;
            }
        }
        // ****************
        //***ItemCollection CODE */
        // ****************

        else if (parsedDragData.type === "ItemCollection") {
            const starshipItems = [];
            const acceptedItems = [];
            const rejectedItems = [];
            for (const item of data.items) {
                if (item.type.startsWith("starship")) {
                    starshipItems.push(item);
                } else if (d100AActorSheetStarship.AcceptedEquipment.includes(item.type)) {
                    acceptedItems.push(item);
                } else {
                    rejectedItems.push(item);
                }
            }

            if (starshipItems.length > 0) {
                await this.actor.createEmbeddedDocuments("Item", [starshipItems]);
            }

            if (acceptedItems.length > 0) {
                const acceptedItemData = foundry.utils.duplicate(data);
                acceptedItemData.items = acceptedItems;
                await this.processDroppedData(event, data);
            }

            if (rejectedItems.length > 0) {
                const rejectedItemNames = rejectedItems.map(x => x.name).join(", ");
                ui.notifications.error(game.i18n.format("SFRPG.InvalidStarshipItem", { name: rejectedItemNames }));
            }

            return true;
        }

        return false;
    }

    /**
    * Get an items data. Same as starship.js, sheet.js
    * 
    * @param {Event} event The originating drag event
    * @param {object} data The data trasfer object
    */
    async _getItemDropData(event, data) {
        let itemData = null;
        //data.id = data.uuid.slice(-16)
        console.log(event, data, data.pack)
        const actor = this.actor;

        if (data.pack) {
            const pack = game.packs.get(data.pack);
            console.log(pack, itemData, data)
            if (pack.metadata.type !== "Item") return;
            itemData = await pack.getDocument(data.id);
            //console.log(pack,itemData)
        } else if (data.system) {
            let sameActor = data.actorId === actor.id;
            if (sameActor && actor.isToken) sameActor = data.tokenId === actor.token.id;
            if (sameActor) {
                await this._onSortItem(event, data.system);
            }
            itemData = data.system;
        }

        else if (data.uuid.includes("Actor") || data.uuid.includes("Token")) {
            const splitUUID = data.uuid.split(".");
            let actorID, itemId, sceneId, tokenId;
            //
            if (splitUUID[0] === "Actor") {
                actorID = splitUUID[1];
                if (splitUUID[2] === "Item") {
                    itemId = splitUUID[3];
                }
            }
            if (splitUUID[0] === "Scene") {
                sceneId = splitUUID[1];
                if (splitUUID[2] === "Token") {
                    tokenId = splitUUID[3];
                }
                if (splitUUID[4] === "Item") {
                    itemId = splitUUID[5];
                }
            }
            data.actorId = actorID
            data.sceneId = sceneId
            data.tokenId = tokenId
            console.log(data, "data")
            const sourceActor = new ActorItemHelper(data.actorId, data.tokenId, data.sceneId);
            console.log(sourceActor, "sourceActor")
            if (!ActorItemHelper.IsValidHelper(sourceActor)) {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
                return;
            }

            itemData = await sourceActor.getItem(itemId);

        }



        else {
            let item = game.items.get(data.id);
            //console.log(item, data.uuid,data.id)
            if (!item) return;
            itemData = item;
            // itemData.name = item.name
        }
        //console.log(itemData)
        let dup = foundry.utils.duplicate(itemData)

        //console.log(dup)
        return dup;
    }

    /**
     * Handles dragenter for the crews tab
     * @param {Event} event The originating dragenter event
     */
    _onCrewDragEnter(event) {
        $(event.target).css('background', "rgba(0,0,0,0.3)");
    }

    /**
     * Handles dragleave for the crews tab
     * @param {Event} event The originating dragleave event
     */
    _onCrewDragLeave(event) {
        $(event.target).css('background', '');
    }

    /**
     * Handle dragging crew members on the sheet.
     * 
     * @param {Event} event Originating dragstart event
     */
    _onDragCrewStart(event) {
        const actorId = event.currentTarget.dataset.actorId;
        const actor = game.actors.get(actorId);

        const dragData = {
            type: "Actor",
            id: actor.id,
            data: actor.system
        };

        if (this.actor.isToken) dragData.tokenId = actorId;
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    /**
     * Handles ondragover for crew drag-n-drop
     * 
     * @param {Event} event Orgininating ondragover event
     */
    _onCrewDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    /**
     * Remove an actor from the crew.
     * 
     * @param {Event} event The originating click event
     */
    async _onRemoveFromCrew(event) {
        event.preventDefault();

        const actorId = $(event.currentTarget).parents('.crew').data('actorId');
        console.log("Hello", actorId)
        this.actor.removeFromCrew(actorId);
    }

    /**
     * Opens the sheet of a crew member.
     *
     * @param {Event} event The originating click event
     */
    async _onActorView(event) {
        event.preventDefault();

        const actorId = $(event.currentTarget).parents('.crew').data('actorId');
        let actor = game.actors.get(actorId);
        actor.sheet.render(true);
    }

    /**
     * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
     * @param {Event} event The triggering event
     */
    async _onActionRoll(event) {
        event.preventDefault();
        const actionId = event.currentTarget.closest('.action').dataset.actionId;
        const type = event.currentTarget.closest('.action').dataset.type;
        console.log("GO")
        return this.actor.useStarshipAction(actionId);
    }
    async _onNPCreset(event) {

        return this.actor.resetNPCCrew();
    }


    /**
 * Handle rolling of an skill from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
 * @param {Event} event The triggering event
 */
    async _onSkillroll(event) {
        let id = event.currentTarget.dataset.actorid;
        let role = event.currentTarget.dataset.role
        let attrib = event.currentTarget.dataset.attrib
        let name = event.currentTarget.dataset.skill
        const skillId = attrib + "." + name
        console.log(id, "\nEvent\n", event, role)

        const actor = this.actor.system.crew[role].actors.find(actor => actor.id === id)
        actor.rollSkill(skillId)
        console.log(id, "\nEvent\n", actor, role)
        // return this.actor.useStarshipAction(actionId);
    }


    // This can be removed

    async _onCrewSkillCreate(event) {
        event.preventDefault();

        const roleId = $(event.currentTarget).closest('li').data('role');

        const results = await ChoiceDialog.show(
            "Add Skill",
            "Select the skill you wish to add to the role of " + roleId + "?",
            {
                skill: {
                    name: "Skill",
                    options: Object.values(CONFIG.SFRPG.skills),
                    default: Object.values(CONFIG.SFRPG.skills)[0]
                }
            }
        );

        if (results.resolution === 'cancel') {
            return;
        }

        let skillId = null;
        for (const [key, value] of Object.entries(CONFIG.SFRPG.skills)) {
            if (value === results.result.skill) {
                skillId = key;
                break;
            }
        }

        if (!skillId) {
            return;
        }

        const crewData = foundry.utils.duplicate(this.actor.system.crew);
        crewData.npcData[roleId].skills[skillId] = {
            isTrainedOnly: false,
            hasArmorCheckPenalty: false,
            value: 0,
            misc: 0,
            ranks: 0,
            ability: "int",
            subname: "",
            mod: 0,
            enabled: true
        };

        await this.actor.update({ "data.crew": crewData });
    }

    // this is obsolete

    async _onCrewSkillDelete(event) {
        event.preventDefault();
        const roleId = $(event.currentTarget).closest('li').data('role');
        const skillId = $(event.currentTarget).closest('li').data('skill');

        this.actor.update({ [`data.crew.npcData.${roleId}.skills.-=${skillId}`]: null });
    }



    // async _onCrewNumberOfUsesChanged(event) {

    async _onCrewChanged(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const a = event.currentTarget;
        const attribute = a.dataset.item;

        const roleId = $(event.currentTarget).closest('li').data('role');

        let parsedValue = parseInt(event.currentTarget.value);
        if (Number.isNaN(parsedValue)) {
            parsedValue = 0;
        }
        if (a.type == "checkbox") parsedValue = a.checked

        console.log(attribute, roleId, event, parsedValue)
        await this.actor.update({ [`system.crew.npcData.${roleId}.${attribute}`]: parsedValue });
        this.render(false);
    }

    async _onCrewSkillModifierChanged(event) {
        //console.log("_onCrewSkillModifierChanged")
        event.preventDefault();
        event.stopImmediatePropagation();

        const roleId = $(event.currentTarget).closest('li').data('role');
        const skillId = $(event.currentTarget).closest('li').data('skill');

        let parsedValue = parseInt(event.currentTarget.value);
        if (Number.isNaN(parsedValue)) {
            parsedValue = 0;
        }

        await this.actor.update({ [`data.crew.npcData.${roleId}.skills.${skillId}.mod`]: parsedValue });
        this.render(false);
    }

    async _onCrewSkillRanksChanged(event) {
        //console.log("_onCrewSkillRanksChanged")
        event.preventDefault();
        event.stopImmediatePropagation();

        const roleId = $(event.currentTarget).closest('li').data('role');
        const skillId = $(event.currentTarget).closest('li').data('skill');

        let parsedValue = parseInt(event.currentTarget.value);
        if (Number.isNaN(parsedValue)) {
            parsedValue = 0;
        }

        await this.actor.update({ [`data.crew.npcData.${roleId}.skills.${skillId}.ranks`]: parsedValue });
        this.render(false);
    }

    /**
     * Edit critical roles.
     * 
     * @param {Event} event The originating click event
     */

    // Called when the edit button pressed on critical damage - Details Page
    async _onEditAffectedCriticalRoles(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const affectedSystem = $(event.currentTarget).data('system');

        const options = [game.i18n.localize("No"), game.i18n.localize("Yes")];

        const results = await ChoiceDialog.show(
            game.i18n.format("SFRPG.StarshipSheet.Critical.EditTitle"),
            game.i18n.format("SFRPG.StarshipSheet.Critical.EditMessage"),
            {
                captain: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Captain"),
                    options: options,
                    default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["captain"] ? options[1] : options[0]
                },
                pilot: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Pilot"),
                    options: options,
                    default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["pilot"] ? options[1] : options[0]
                },
                copilot: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Copilot"),
                    options: options,
                    default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["copilot"] ? options[1] : options[0]
                },
                /*    navigation: {
                        name: game.i18n.format("SFRPG.StarshipSheet.Role.Navigation"),
                        options: options,
                        default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["navigation"] ? options[1] : options[0]
                    },*/
                engineer: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Engineer"),
                    options: options,
                    default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["engineer"] ? options[1] : options[0]
                },
                gunner: {
                    name: game.i18n.format("SFRPG.StarshipSheet.Role.Gunner"),
                    options: options,
                    default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["gunner"] ? options[1] : options[0]
                },
                /*     scienceOfficer: {
                         name: game.i18n.format("SFRPG.StarshipSheet.Role.ScienceOfficer"),
                         options: options,
                         default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["scienceOfficer"] ? options[1] : options[0]
                     },
                     magicOfficer: {
                         name: game.i18n.format("SFRPG.StarshipSheet.Role.MagicOfficer"),
                         options: options,
                         default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["magicOfficer"] ? options[1] : options[0]
                     },
                     chiefMate: {
                         name: game.i18n.format("SFRPG.StarshipSheet.Role.ChiefMate"),
                         options: options,
                         default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["chiefMate"] ? options[1] : options[0]
                     },
                     openCrew: {
                         name: game.i18n.format("SFRPG.StarshipSheet.Role.OpenCrew"),
                         options: options,
                         default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["openCrew"] ? options[1] : options[0]
                     },
                     minorCrew: {
                         name: game.i18n.format("SFRPG.StarshipSheet.Role.MinorCrew"),
                         options: options,
                         default: this.actor.system.attributes.systems[affectedSystem].affectedRoles["minorCrew"] ? options[1] : options[0]
                     }*/
            }
        );

        const currentSystem = foundry.utils.duplicate(this.actor.system.attributes.systems[affectedSystem]);
        currentSystem.affectedRoles = {
            captain: results.result.captain === options[1],
            pilot: results.result.pilot === options[1],
            copilot: results.result.copilot === options[1],
            //   navigation: results.result.navigation === options[1],
            communications: results.result.communications === options[1],
            damageControl: results.result.damageControl === options[1],
            defences: results.result.defences === options[1],
            engineer: results.result.engineer === options[1],
            sensors: results.result.sensors === options[1],
            gunner: results.result.gunner === options[1],
            /*   scienceOfficer: results.result.scienceOfficer === options[1],
               magicOfficer: results.result.magicOfficer === options[1],
               chiefMate: results.result.chiefMate === options[1],
               openCrew: results.result.openCrew === options[1],
               minorCrew: results.result.minorCrew === options[1]*/
        };

        await this.actor.update({ [`system.attributes.systems.${affectedSystem}`]: currentSystem });
    }

    async _onWeaponReloadClicked(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.reload();
    }

    /**
     * This method is called upon form submission after form data is validated
     * 
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const tiers = { "1/4": 0.25, "1/3": 1 / 3, "1/2": 0.5 };
        let v = "data.details.tier";
        let tier = formData[v];
        tier = tiers[tier] || parseFloat(tier);
        if (tier) formData[v] = tier < 1 ? tier : parseInt(tier);

        return super._updateObject(event, formData);
    }

    static async loadStarshipSystemDamage() {
        //  const starshipPackKey = game.settings.get("Alternityd100", "Alternityd100.starship-damage");

        //const starshipActions = game.packs.get(starshipPackKey);

        //Get all the starship actions from the pack of actions
        const starshipDamage = game.packs.get("Alternityd100.starship-damage");

        console.log("-------------------------------------------------", starshipDamage)

        d100A.starshipSystemDamage = []




        return starshipDamage.getIndex().then(async (indices) => {
            for (const index of indices) {
                const entry = await starshipDamage.getDocument(index._id);
                //console.log("entry-",entry)
                d100A.starshipSystemDamage.push(entry)
                // const role = entry.system.role;




            }

            d100A.starshipSystemDamage.sort((a, b) => {
                return a.name - b.name;
            });


        })


    }
    static async ensureStarshipActions() {
        /** Populate the starship actions cache. */
        d100AActorSheetStarship.StarshipActionsCache = {};
        const tempCache = {};

        //const starshipPackKey = game.settings.get("Alternityd100", "starshipActionsSource");

        //const starshipActions = game.packs.get(starshipPackKey);

        //Get all the starship actions from the pack of actions
        const starshipActions = game.packs.get("Alternityd100.starship-actions");



        // const perks = game.packs.get("Alternityd100.perks");
        // console.log("\n-----dsf-------",starshipActions);



        return starshipActions.getIndex().then(async (indices) => {
            for (const index of indices) {
                const entry = await starshipActions.getDocument(index._id);
                //             console.log("entry-",entry)

                const role = entry.system.role;

                if (!tempCache[role]) {
                    tempCache[role] = { label: CONFIG.SFRPG.starshipRoleNames[role], actions: [] };
                }

                tempCache[role].actions.push(entry);
            }

            /** Sort them by order. */
            for (const [roleKey, roleData] of Object.entries(tempCache)) {
                //           console.log("roleData",roleData)
                roleData.actions.sort(function (a, b) { return a.order - b.order });
            }
            // not sure if this is used 
            const desiredOrder = ["captain", "pilot", "copilot", "communications", "damageControl", "defences", "engineer", "sensors", "gunner"];
            /** Automatically append any missing elements to the list at the end, in case new roles are added in the future. */
            for (const key of Object.keys(tempCache)) {
                if (!desiredOrder.includes(key)) {
                    desiredOrder.push(key);
                }
            }

            for (const key of desiredOrder) {
                d100AActorSheetStarship.StarshipActionsCache[key] = tempCache[key];
            }
        });
    }
}