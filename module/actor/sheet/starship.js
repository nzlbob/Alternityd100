//import { ActorSheetSFRPG } from "./base.js";
//import { d100ActorSheet } from "../../d100Actor-sheet.js";
import { AddEditSkillDialog } from "../../apps/edit-skill-dialog.js";
import { ChoiceDialog } from "../../apps/choice-dialog.js";
import { d100A } from "../../d100Aconfig.js";
 import { rollNPC } from "../../utilities.js";
import { targetResModData, d100NPCCrewStats } from "../../modifiers/d100mod.js";
import { getRangeCat, radtodeg, degtorad, raytodeg, inArc, generateUUID, measureDistance } from "../../utilities.js"
import { moveItemBetweenActorsAsync, getFirstAcceptableStorageIndex, ActorItemHelper, containsItems } from "../actor-inventory-utils.js";
import { d100ActorSheet } from "../../d100Actor-sheet.js";
/**
 * An Actor sheet for a starship in the SFRPG system.
 * @type {ActorSheetSFRPG}
 */
export class d100AActorSheetStarship extends d100ActorSheet {
    static get AcceptedEquipment() {
        return "starshipOrdnance,augmentation,pharmaceutical,container,equipment,fusion,goods,hybrid,magic,technological,upgrade,shield,weapon,weaponAccessory,actorResource,ordnancePropulsion,ordnanceSensor,ordnanceWarhead";
    }
    static StarshipActionsCache = null;

    static get DEFAULT_OPTIONS() {
        const base = super.DEFAULT_OPTIONS;
        return foundry.utils.mergeObject(base, {
            position: { width: 700, height: 800 },
            window: { contentClasses: [...base.window.contentClasses, 'starship'] }
        });
    }

    constructor(...args) {
        super(...args);
    }

    static getStarshipActionsPack() {
        const configuredPack = game.settings.get("Alternityd100", "starshipActionsSource") || "Alternityd100.starship-actions";
        return game.packs.get(configuredPack) ?? game.packs.get("Alternityd100.starship-actions");
    }

    _getStarshipActionHullResistanceStep(role) {
        const baseResistance = Number(this.actor.system?.attributes?.resistance?.base ?? 0) || 0;
        return ["pilot", "copilot"].includes(role) ? -baseResistance : 0;
    }

    _buildStarshipActionRollOptions(action) {
        const role = String(action?.system?.role ?? "").trim();
        const hullResistanceStep = this._getStarshipActionHullResistanceStep(role);
        const localizedActionName = game.i18n.localize(action?.name ?? "");

        return {
            steps: hullResistanceStep,
            stepsLabel: ["pilot", "copilot"].includes(role) ? "Hull Resistance" : "Action Modifier",
            event: null,
            skipDialog: false,
            staticRoll: null,
            chatMessage: "true",
            noSound: false,
            dice: "1d20",
            skillflavor: localizedActionName,
            stepbonus: 0,
            degreeText: action?.system?.degreeText,
            starshipActionRole: role,
            statusActors: [this.actor]
        };
    }

        static PARTS = {
            form: { template: 'systems/Alternityd100/templates/actors/starship-sheet-full.html' }
        };

    async _prepareContext(options) {
        const data = await super._prepareContext(options);
        data.isUseWarshipsOptions =
            (game.settings.get("Alternityd100", "starshipDurability") == "warships") ? data.isUseWarshipsOptions = true : data.isUseWarshipsOptions = false;


        // let tier = parseFloat(data.system.details?.tier || 0);
        // let tiers = { 0: "0", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        // data.labels["tier"] = tier >= 1 ? String(tier) : tiers[tier] || 1;
        //console.log("Data", data)
        if (data) this._getCrewData(data);
        this._getShipStatusData(data);


        // Encrich text editors
        data.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.object.system.details.notes, { async: true });
        // NOTE: Template targets `system.details.ruleNotes` (no trailing 's').
        // Keep a fallback to legacy/mistyped `rulesNotes` so existing content still displays.
        const ruleNotes = this.object.system?.details?.ruleNotes ?? this.object.system?.details?.rulesNotes ?? "";
        data.enrichedrulesNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(ruleNotes, { async: true });

        data.scanTargets = this.object.system.scanTargets

        data.maneuverabilityPilotingBonusOptions = {
            0: "",
            1: "Ord",
            2: "Good",
            3: "Ama"
        };
        let mpp = data.system.attributes.maneuverability.value
        data.maneuversPerPhaseTooltip = "<br>" + mpp + " Maneuvers per Phase"
        if (mpp <= 0) {
            mpp = 2-mpp
            data.maneuversPerPhaseTooltip = "<br>1 Maneuver every " + mpp +" Phases."};

        //data.compartTable = "<td style=\"border: 0px; background-color: #eef8f8; border-color: #eef8f8; \" ></td><td>cell2_2</td><td style=\"border: 0px; background-color: #eef8f8; border-color: #eef8f8; \" ></td>"
        //data.compartTable = "<td>cell1_3</td><td>cell2_3</td><td>cell3_3</td></tr>"
        data.powerOverload = this.powerOverload

        // The base `d100ActorSheet` already prepares and populates `data.status.durability`.
        // This starship sheet needs to add CRI and rebuild the tracks, so make sure we don't
        // append to the already-populated arrays (which would double the rendered boxes).
        data.status = data.status ?? {};
        data.status.durability = data.status.durability ?? {};
        data.status.durability.cri = data.status.durability.cri ?? { "good": [], "pend": [], "bad": [] };
        for (const [key, track] of Object.entries(data.status.durability)) {
            if (!track || typeof track !== "object") {
                data.status.durability[key] = { "good": [], "pend": [], "bad": [] };
                continue;
            }
            track.good = [];
            track.pend = [];
            track.bad = [];
        }

      //  data.status.image = { "bad": "systems/Alternityd100/icons/conditions/alt_bad1.png", "good": "systems/Alternityd100/icons/conditions/alt_good1.png", "pend": "systems/Alternityd100/icons/conditions/alt_yell.png" }

        // load the main 
        for (let [k, v] of Object.entries(data.status.durability)) {
            // for (const [v,k] of data.status.durability) {
            for (let i = 0; i < this.actor.system?.attributes[k]?.max; i++) {
                //console.log(this.actor.system?.attributes[k].value,k,v,i)
                let good = Math.min(this.actor.system?.attributes[k].value + this.actor.system?.attributes[k].pending, this.actor.system?.attributes[k].value)
                let pending = Math.max(this.actor.system?.attributes[k].value + this.actor.system?.attributes[k].pending, this.actor.system?.attributes[k].value)


                if (good > i) v.good.push({ "value": i, "title": i - this.actor.system?.attributes[k].value });
                else if (pending > i) v.pend.push({ "value": i, "title": i - this.actor.system?.attributes[k].value });


                else v.bad.push({ "value": i, "title": i - this.actor.system?.attributes[k].value + 1 });

            }
        }


        return data;

    }

    /**
     * Process any flags that the actor might have that would affect the sheet .
     * 
     * @param {Object} data The data object to update with any crew data.
     */
    async _getShipStatusData(data) {

        let shape = []
      //  console.log(data)


        //actor.system.compartment.compartments
        //d100A.compartments
        let compartments = this.actor.system?.compartment.compartments
      //  console.log(this.actor.system?.compartment)

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

        // Provide a rotated-right representation for compact UI renderings (e.g. tooltips).
        // Rotation: top-left -> top-right, top-right -> bottom-right, etc.
        const sourceTable = Array.isArray(data.compartTable) ? data.compartTable : [];
        const rows = sourceTable.length;
        const cols = rows ? Math.max(...sourceTable.map(r => Array.isArray(r) ? r.length : 0)) : 0;
        const rotated = Array.from({ length: cols }, () => Array.from({ length: rows }));
        for (let r = 0; r < rows; r++) {
            const rowArr = sourceTable[r] ?? [];
            for (let c = 0; c < cols; c++) {
                rotated[c][rows - 1 - r] = rowArr[c];
            }
        }
        data.compartTableRot = rotated;


    }

    /**
  * Process any flags that the actor might have that would affect the sheet .
  * 
  * @param {Object} data The data object to update with any crew data.
  */
    async _getNPCCrewData(data) {


        const actorData = data?.system ?? data?.actor?.system ?? this.actor.system;

        if (actorData?.crew?.useNPCCrew) {
            let NoNPCCrew = actorData.frame?.system?.crew.minimum || 0
            console.log("NoNPCCrew - ", NoNPCCrew)

            for (let crewno; crewno < NoNPCCrew; crewno++) {

            }
        }



        const normalizeCrewData = (raw) => {
            const base = {
                captain: { limit: 1, actorIds: [] },
                pilot: { limit: 1, actorIds: [] },
                copilot: { limit: 1, actorIds: [] },
                communications: { limit: 1, actorIds: [] },
                damageControl: { limit: -1, actorIds: [] },
                defences: { limit: 1, actorIds: [] },
                engineer: { limit: -1, actorIds: [] },
                sensors: { limit: -1, actorIds: [] },
                gunner: { limit: -1, actorIds: [] }
            };

            const crew = raw && typeof raw === "object" ? raw : {};
            const normalized = { ...crew };
            for (const [role, defaults] of Object.entries(base)) {
                const roleData = (normalized[role] && typeof normalized[role] === "object") ? normalized[role] : {};
                const actorIds = Array.isArray(roleData.actorIds) ? roleData.actorIds.filter(Boolean) : [];
                const limit = Number.isFinite(roleData.limit) ? roleData.limit : defaults.limit;
                normalized[role] = { ...defaults, ...roleData, limit, actorIds };
            }
            return normalized;
        };

        const hasLegacyCrewFlags = !!this.actor.flags?.sfrpg?.shipsCrew?.members;
        let crewData = normalizeCrewData(this.actor.system.crew);

        if (!this.actor.system.crew || hasLegacyCrewFlags) {
            crewData = normalizeCrewData(await this._processFlags(data, this.actor.flags));
        }



        const captainActors = crewData.captain.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const pilotActors = crewData.pilot.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const copilotActors = crewData.copilot.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        // const navigationActors = crewData.navigation.actorIds.map(crewId => game.actors.get(crewId));
        const communicationsActors = crewData.communications.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const damageControlActors = crewData.damageControl.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const defencesActors = crewData.defences.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const engineerActors = crewData.engineer.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const sensorsActors = crewData.sensors.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const gunnerActors = crewData.gunner.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
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
        const normalizeCrewData = (raw) => {
            const base = {
                captain: { limit: 1, actorIds: [] },
                pilot: { limit: 1, actorIds: [] },
                copilot: { limit: 1, actorIds: [] },
                communications: { limit: 1, actorIds: [] },
                damageControl: { limit: -1, actorIds: [] },
                defences: { limit: 1, actorIds: [] },
                engineer: { limit: -1, actorIds: [] },
                sensors: { limit: -1, actorIds: [] },
                gunner: { limit: -1, actorIds: [] }
            };

            const crew = raw && typeof raw === "object" ? raw : {};
            const normalized = { ...crew };
            for (const [role, defaults] of Object.entries(base)) {
                const roleData = (normalized[role] && typeof normalized[role] === "object") ? normalized[role] : {};
                const actorIds = Array.isArray(roleData.actorIds) ? roleData.actorIds.filter(Boolean) : [];
                const limit = Number.isFinite(roleData.limit) ? roleData.limit : defaults.limit;
                normalized[role] = { ...defaults, ...roleData, limit, actorIds };
            }
            return normalized;
        };

        let crewData = normalizeCrewData(this.actor.system.crew);

        if (!this.actor.system.crew || this.actor.system?.flags?.shipsCrew) {
            crewData = normalizeCrewData(await this._processFlags(data, data.actor.flags));
        }


        const captainActors = crewData.captain.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const pilotActors = crewData.pilot.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const copilotActors = crewData.copilot.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        //  const navigationActors = crewData.navigation.actorIds.map(crewId => game.actors.get(crewId));
        const communicationsActors = crewData.communications.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const damageControlActors = crewData.damageControl.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const defencesActors = crewData.defences.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const engineerActors = crewData.engineer.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const sensorsActors = crewData.sensors.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const gunnerActors = crewData.gunner.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
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
           //     console.log("\n----SkillArray\n", d100A.skillArray[key], role)

                let tempskill = {}
                let tempskillGen = {}
                let score = ""
                let label = ""


                for (let thisskill of d100A.skillArray[key]) {

                    tempskill = thisactor.system.skills[thisskill.name]
                    tempskillGen = thisactor.system.skills[thisskill.bname]
               //     console.log(tempskill)
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
            navigation: {
                limit: 1,
                actorIds: []
            },
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

            scienceOfficer: {
                limit: -1,
                actorIds: []
            },
            passenger: {
                limit: -1,
                actorIds: []
            }





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

            const roleMap = {
                captain: "captain",
                pilot: "pilot",
                copilot: "copilot",
                communications: "communications",
                damageControl: "damageControl",
                defences: "defences",
                engineer: "engineer",
                sensors: "sensors",
                gunner: "gunner",
                navigation: "navigation",
                scienceOfficer: "scienceOfficer",
                scienceOfficers: "scienceOfficer",
                passenger: "passenger",
                passengers: "passenger"
            };

            const mapped = roleMap[crewMember.role];
            if (mapped && newCrew[mapped]) newCrew[mapped].actorIds.push(actorId);
        }

        await this.actor.update({
            "system.crew": newCrew
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
           
          //  unmounted: { label: game.i18n.format("SFRPG.StarshipSheet.Weapons.NotMounted"), items: [], dataset: { type: "starshipWeapon", allowAdd: true } },
            defense: { label: game.i18n.format("Defences"), items: [], dataset: { type: "starshipDefence", allowAdd: true } },
 sensor: { label: game.i18n.format("Sensors"), items: [], dataset: { type: "starshipSensor", allowAdd: true } }
        };

        arcs.mounted.items = mounted;
        arcs.sensor.items = sensors;
        ///arcs.port.items = port;
        //arcs.aft.items = aft;
        //arcs.turret.items = turret;
       // arcs.unmounted.items = unmounted;
        arcs.defense.items = defence.filter((item) => item?.system?.activeDefense === true);

        // Battery groups (Mode G) are tracked on the actor as a flag array-of-arrays.
        // Mark each starship weapon so the sheet can disable firing for non-leader battery members.
        const rawBatteries = this.actor.getFlag("Alternityd100", "batteries");
        const batteries = Array.isArray(rawBatteries)
            ? rawBatteries.map(g => Array.isArray(g) ? g.filter(Boolean) : [])
            : [];

        const batteryIndexByItemId = new Map();
        for (let groupIndex = 0; groupIndex < batteries.length; groupIndex++) {
            const group = batteries[groupIndex] ?? [];
            for (let indexInGroup = 0; indexInGroup < group.length; indexInGroup++) {
                const id = group[indexInGroup];
                if (!id) continue;
                batteryIndexByItemId.set(id, { groupIndex, indexInGroup });
            }
        }

        const applyBatteryMeta = (weapon) => {
            const info = batteryIndexByItemId.get(weapon?._id);
            weapon.isBatteryMember = !!info;
            weapon.isBatteryLeader = !!info && info.indexInGroup === 0;
            weapon.batteryGroup = info ? info.groupIndex : null;
        };

        for (const weapon of mounted) applyBatteryMeta(weapon);
        for (const weapon of unmounted) applyBatteryMeta(weapon);

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
          //  ordnance: { label: game.i18n.format("SFRPG.StarshipSheet.Features.Ordnance"), items: ordnance, hasActions: false, dataset: { type: "starshipOrdnance" } },
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
    _onRender(context, options) {
        super._onRender?.(context, options);
        const root = this.element;
        if (!root) return;

        const bind = (selector, type, handler) => {
            root.querySelectorAll(selector).forEach((el) => {
                el.addEventListener(type, handler);
            });
        };

        // Nav Computer calculator is purely client-side UI; allow it for all viewers.
        bind('button.nav-computer-calculate', 'click', (event) => this._onNavComputerCalculate(event));

        // Allow players/viewers to target scan contacts even if they cannot edit the ship.
        bind('button.tag.target', 'click', (event) => this._onTargetTokenClicked(event));
        bind('a.scan-contact-delete', 'click', (event) => this._onScanContactDelete(event));

        // Keep Target button state in sync with token targeting.
        this._attachTargetTokenHook();
        this._updateScanContactTargetButtons(root);

        if (!this.isEditable) return;

        // Crew Tab
        bind('.crew-view', 'click', (event) => this._onActorView(event));
        bind('.crew-delete', 'click', this._onRemoveFromCrew.bind(this));
        bind('.crew-combat', 'click', this._onCrewCombat.bind(this));

        const dragStartHandler = (event) => this._onDragCrewStart(event);
        root.querySelectorAll('li.crew').forEach((li) => {
            li.setAttribute('draggable', true);
            li.addEventListener('dragstart', dragStartHandler, false);
        });

        root.querySelectorAll('.crew-list').forEach((li) => {
            li.addEventListener('dragover', this._onCrewDragOver.bind(this), false);
        });

        root.querySelectorAll('li.crew-header').forEach((li) => {
            li.addEventListener('dragenter', this._onCrewDragEnter, false);
            li.addEventListener('dragleave', this._onCrewDragLeave, false);
        });

        bind('.action .action-name h4', 'click', (event) => this._onCrewActionOpen(event));
        bind('.action .action-image', 'click', (event) => this._onCrewActionRoll(event));
        bind('.action-name2', 'click', (event) => this._onNPCreset(event));
        bind('.crew-score', 'click', (event) => this._onSkillroll(event));

        bind('.skill-create', 'click', (event) => this._onCrewSkillCreate(event));
        bind('.skill-delete', 'click', this._onCrewSkillDelete.bind(this));
        bind('.crew-role-alter', 'change', this._onCrewChanged.bind(this));

        bind('.scan-refresh', 'click', this._onscanRefresh.bind(this));

        bind('.systdamagebutton', 'click', this._onsystdamagebutton.bind(this));
        bind('.damagecheckbutton', 'click', this._ondamagecheckbutton.bind(this));

        bind('.crew-skill-mod', 'change', this._onCrewSkillModifierChanged.bind(this));
        bind('.crew-skill-ranks', 'change', this._onCrewSkillRanksChanged.bind(this));

        bind('.critical-edit', 'click', this._onEditAffectedCriticalRoles.bind(this));

        bind('.reload', 'click', this._onWeaponReloadClicked.bind(this));

        bind('.value-compt', 'change', (event) => this._onChangeCompartment(event));
        bind('.value-equipmentStatus', 'change', (event) => this._onChangeStatus(event));
        bind('.setCompartmentDur', 'change', (event) => this._onChangesetCompartmentDur(event));
        bind('.clickonoff', 'click', (event) => this._onOnOff(event));
        bind('.clickoverload', 'click', (event) => this._toggleOverload(event));

        this._applyStatusTableSystemTooltips(root);
        this._activateDelayedStatusTableSystemTooltips(root);
        this._activateStatusTableSystemContextMenu(root);
    }

    _onNavComputerCalculate(event) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget;
        const row = button?.closest?.('tr') ?? this.element;

        const distanceInput = row?.querySelector?.('input.nav-computer-distance')
            ?? this.element?.querySelector?.('input.nav-computer-distance');
        const distanceUnitSelect = row?.querySelector?.('select.nav-computer-distance-unit')
            ?? this.element?.querySelector?.('select.nav-computer-distance-unit');
        const accelInput = row?.querySelector?.('input.nav-computer-accel')
            ?? this.element?.querySelector?.('input.nav-computer-accel');
        const resultEl = row?.querySelector?.('.nav-computer-result')
            ?? this.element?.querySelector?.('.nav-computer-result');

        const distanceRaw = parseFloat(distanceInput?.value ?? '');
        const distanceUnit = (distanceUnitSelect?.value ?? 'au').toString();
        const accelerationMpp = parseFloat(accelInput?.value ?? '');
        const useRelativistic = !!game?.settings?.get?.("Alternityd100", "navComputerRelativistic");

        if (!Number.isFinite(distanceRaw) || !Number.isFinite(accelerationMpp) || distanceRaw < 0 || accelerationMpp <= 0) {
            if (resultEl) {
                resultEl.textContent = '(dd-hh-mm)';
                resultEl.removeAttribute?.('data-tooltip');
              //  resultEl.removeAttribute?.('title');
            }
            ui.notifications?.warn?.('Enter a valid Distance (au) and Acceleration (Mpp > 0).');
            return;
        }

        const distanceAu = this._convertDistanceToAu(distanceRaw, distanceUnit);
        if (!Number.isFinite(distanceAu) || distanceAu < 0) {
            if (resultEl) {
                resultEl.textContent = '(dd-hh-mm)';
                resultEl.removeAttribute?.('data-tooltip');
              //  resultEl.removeAttribute?.('title');
            }
            ui.notifications?.warn?.('Unknown/invalid distance unit selection.');
            return;
        }

        const hours = this._computeNavTravelTimeHours(distanceAu, accelerationMpp);
        if (!Number.isFinite(hours)) {
            if (resultEl) {
                resultEl.textContent = '(dd-hh-mm)';
                resultEl.removeAttribute?.('data-tooltip');
              //  resultEl.removeAttribute?.('title');
            }
            ui.notifications?.warn?.('Could not calculate travel time with those values.');
            return;
        }

        // Diagnostics + tooltip support.
        // Assumption (as used elsewhere in this project):
        // 1 Mpp = 1000 km per 30 seconds / 30 seconds => 1000 km / (30s)^2.
        const KM_PER_AU = 149_597_870.7;
        const SECONDS_PER_PULSE = 30;
        const KM_PER_MPP_PER_PULSE = 1_000;
        const aKmPerS2 = accelerationMpp * (KM_PER_MPP_PER_PULSE / (SECONDS_PER_PULSE * SECONDS_PER_PULSE));

        const aMS2 = aKmPerS2 * 1_000;
        const g0 = 9.80665;
        const accelG = aMS2 / g0;

        const distanceKm = distanceAu * KM_PER_AU;

        const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
        const nf0 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

        if (resultEl) {
            if (!useRelativistic) {
                const ddhhmm = this._formatHoursToDdHhMm(hours);
                resultEl.textContent = `${hours.toFixed(2)} h (${ddhhmm})`;

                const vPeakKmPerS = Math.sqrt(aKmPerS2 * distanceKm);
                const cKmPerS = 299_792.458;
                const pctC = (vPeakKmPerS / cKmPerS) * 100;
                const note = (pctC > 100)
                    ? '<br><em>Note: peak speed > 100% c means the non-relativistic formula is being used.</em>'
                    : '';

                const tooltip = [
                    `<strong>Acceleration</strong>: ${nf.format(accelG)} g`,
                    `<strong>Peak speed</strong>: ${nf0.format(vPeakKmPerS)} km/s (${nf.format(pctC)}% c)`,
                    note
                ].filter(Boolean).join('<br>');

                resultEl.setAttribute('data-tooltip', tooltip);
              //  resultEl.setAttribute('title', tooltip.replace(/<[^>]*>/g, ''));
                return;
            }

            // Relativistic: constant proper acceleration for half, then symmetric deceleration.
            // Solve using:
            // x_half = (c^2/a) * (cosh(alpha) - 1)
            // t_half = (c/a) * sinh(alpha)
            // tau_half = (c/a) * alpha
            // v_peak = c * tanh(alpha)
            // where alpha = a * tau_half / c = acosh(1 + a*x_half/c^2)
            const cMS = 299_792_458;
            const xHalfM = (distanceKm * 1_000) / 2;
            const a = aMS2;

            const alpha = Math.acosh(1 + (a * xHalfM) / (cMS * cMS));
            const tHalfS = (cMS / a) * Math.sinh(alpha);
            const tauHalfS = (cMS / a) * alpha;

            const univHours = (2 * tHalfS) / 3600;
            const shipHours = (2 * tauHalfS) / 3600;

            const univFmt = this._formatHoursToDdHhMm(univHours);
            const shipFmt = this._formatHoursToDdHhMm(shipHours);
            resultEl.innerHTML = `U ${univHours.toFixed(2)} h (${univFmt}) <br> S ${shipHours.toFixed(2)} h (${shipFmt})`;

            const vPeakKmPerS = (cMS * Math.tanh(alpha)) / 1_000;
            const pctC = Math.tanh(alpha) * 100;
            const gamma = Math.cosh(alpha);

            const tooltip = [
                `<strong>Acceleration</strong>: ${nf.format(accelG)} g (proper)`,
                `<strong>Peak speed</strong>: ${nf0.format(vPeakKmPerS)} km/s (${nf.format(pctC)}% c)`,
                `<strong>Gamma</strong>: ${nf.format(gamma)}`
            ].join('<br>');

            resultEl.setAttribute('data-tooltip', tooltip);
          //  resultEl.setAttribute('title', tooltip.replace(/<[^>]*>/g, ''));
        }
    }

    _convertDistanceToAu(distance, unit) {
        const rawUnit = (unit ?? 'au').toString().trim().toLowerCase();
        const u = rawUnit.replace(/\s+/g, '').replace(/-/g, '');
        if (!Number.isFinite(distance)) return NaN;

        // Exact definitions where possible.
        // 1 AU = 149,597,870.7 km (IAU conventional).
        const KM_PER_AU = 149_597_870.7;
        // 1 ly = 9,460,730,472,580.8 km (Julian light-year), then divided by KM_PER_AU.
        // Using AU-per-ly directly avoids floating rounding from a huge km figure.
        const AU_PER_LY = 63_241.077088071;
        const KM_PER_MI = 1.609344;
        const KM_PER_MM = 1_000; // 1 megameteradd = 1,000 km.

        switch (u) {
            case 'au':
                return distance;
            case 'ly':
            case 'lightyear':
            case 'lightyears':
                return distance * AU_PER_LY;
            case 'km':
                return distance / KM_PER_AU;
            case 'mm':
                return (distance * KM_PER_MM) / KM_PER_AU;
            case 'mi':
            case 'mile':
            case 'miles':
                return (distance * KM_PER_MI) / KM_PER_AU;
            default:
                return NaN;
        }
    }

    _computeNavTravelTimeHours(distanceAu, accelerationMpp) {
        // User-specified formula (assumes start/end velocity = 0):
        // Time(hours) = sqrt(Distance(au) / Acceleration(Mpp)) * 6.44631399199057
        return Math.sqrt(distanceAu / accelerationMpp) * 6.44631399199057;
    }

    _formatHoursToDdHhMm(hours) {
        const totalMinutes = Math.round(hours * 60);
        const days = Math.floor(totalMinutes / (60 * 24));
        const hoursR = Math.floor((totalMinutes - days * 60 * 24) / 60);
        const minutesR = totalMinutes - days * 60 * 24 - hoursR * 60;
        const pad2 = (n) => String(n).padStart(2, '0');
        return `${pad2(days)}d ${pad2(hoursR)}h ${pad2(minutesR)}m`;
    }

    async _onTargetTokenClicked(event) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget;
        const tokenId = button?.dataset?.tokenid || button?.dataset?.tokenId || button?.closest?.('li.item')?.dataset?.itemId;
        if (!tokenId) {
            ui.notifications?.warn?.('No token id found for that contact.');
            return;
        }

        const token = canvas?.tokens?.get?.(tokenId)
            ?? canvas?.scene?.tokens?.get?.(tokenId)?.object
            ?? null;

        if (!token?.setTarget) {
            ui.notifications?.warn?.(`Token not found on the current scene (${tokenId}).`);
            return;
        }

        const nextState = !token.isTargeted;
        const releaseOthers = !event.shiftKey;
        token.setTarget(nextState, { releaseOthers });

        // Update immediately (the hook also fires, but this makes UI feel snappier).
        this._updateScanContactTargetButtons();
    }

    _attachTargetTokenHook() {
        if (this._d100aTargetTokenHookAttached) return;
        if (!Hooks?.on) return;

        this._d100aTargetTokenHookAttached = true;
        this._d100aTargetTokenHookFn = (user, token, targeted) => {
            try {
                const myUserId = game?.user?.id;
                const userId = user?.id ?? user;
                if (myUserId && userId && String(userId) !== String(myUserId)) return;

                // Only update if this sheet is currently rendered.
                if (!this.element) return;
                this._updateScanContactTargetButtons();
            } catch (err) {
                console.error(err);
            }
        };

        Hooks.on('targetToken', this._d100aTargetTokenHookFn);
    }

    _updateScanContactTargetButtons(root = this.element) {
        if (!root) return;

        const myUserId = game?.user?.id;
        root.querySelectorAll('button.tag.target').forEach((button) => {
            const tokenId = button?.dataset?.tokenid
                || button?.dataset?.tokenId
                || button?.closest?.('li.item')?.dataset?.itemId;

            const token = tokenId
                ? (canvas?.tokens?.get?.(tokenId)
                    ?? canvas?.scene?.tokens?.get?.(tokenId)?.object
                    ?? null)
                : null;

            const isTargeted = token
                ? (typeof token.isTargeted === 'boolean'
                    ? token.isTargeted
                    : Boolean(token.targeted?.has?.(myUserId)))
                : false;

            button.classList.toggle('is-targeted', Boolean(isTargeted));
        });
    }

    async close(options = {}) {
        if (this._d100aTargetTokenHookFn && Hooks?.off) {
            Hooks.off('targetToken', this._d100aTargetTokenHookFn);
        }
        this._d100aTargetTokenHookAttached = false;
        this._d100aTargetTokenHookFn = null;
        return super.close?.(options);
    }

    async _onScanContactDelete(event) {
        event.preventDefault();
        event.stopPropagation();

        const tokenId = event.currentTarget?.dataset?.tokenid ?? event.currentTarget?.dataset?.tokenId;
        if (!tokenId) {
            ui.notifications?.warn?.('No token id found for that contact.');
            return;
        }

        const current = this.actor?.system?.scanTargets ?? [];
        const next = Array.isArray(current)
            ? current.filter((t) => String(t?.token?.id ?? '') !== String(tokenId))
            : [];

        try {
            await this.actor.update({ "system.scanTargets": next });
        } catch (err) {
            console.error(err);
            ui.notifications?.error?.('You do not have permission to delete that contact.');
        }
    }

    _applyStatusTableSystemTooltips(root) {
        const escape = foundry?.utils?.escapeHTML ?? ((s) => String(s));

        root.querySelectorAll('.statusTable_3-system[data-item-id]').forEach((el) => {
            const itemId = el.dataset.itemId;
            if (!itemId) return;

            const item = this.actor.items.get(itemId);
            if (!item) return;

            const statusKey = item.system?.status ?? el.dataset.status ?? '';
            const statusLabel = d100A?.equipmentStatus?.[statusKey] ?? statusKey ?? '';

            const powered = Boolean(item.system?.isPowered);
            const overPowered = Boolean(item.system?.overPowered);

            // Keep dataset in sync so CSS reflects the current system state.
            el.dataset.status = statusKey;
            el.dataset.powered = powered ? 'true' : 'false';
            el.dataset.overpowered = overPowered ? 'true' : 'false';

            const location = el.dataset.location;
            const pcu = Number.isFinite(item.system?.pcu) ? item.system.pcu : null;

            const rows = [
                ['Type', item.type],
                location ? ['Location', location] : null,
                statusLabel ? ['Status', statusLabel] : null,
                ['Power', powered ? 'On' : 'Off'],
                ['Overpowered', overPowered ? 'Overpowered' : 'Normal'],
                pcu !== null ? ['PCU', String(pcu)] : null,
                ['Left Click', 'Toggle Power'],
                ['Left Click (Bolt)', 'Toggle Overload'],
                ['Right Click', 'Set Status'],
            ].filter(Boolean);

            const tooltip = [
                `<div class="statusTable_3-system-tooltip">`,
                `  <div class="statusTable_3-system-tooltip__title">${escape(item.name ?? '')}</div>`,
                `  <dl class="statusTable_3-system-tooltip__grid">`,
                ...rows.map(([k, v]) => `    <dt>${escape(k)}</dt><dd>${escape(v ?? '')}</dd>`),
                `  </dl>`,
                `</div>`
            ].join('');

            // Store tooltip HTML for delayed activation.
            el.dataset.statusTableTooltip = tooltip;
            el.dataset.tooltipDirection = el.dataset.tooltipDirection || 'UP';
        });
    }

    _activateDelayedStatusTableSystemTooltips(root) {
        // Attach once per render root; individual elements may change on rerender.
        if (root.dataset?.statusTable3DelayedTooltipsAttached === 'true') return;
        root.dataset.statusTable3DelayedTooltipsAttached = 'true';

        const timers = new WeakMap();
        const delayMs = 1000;
        let activeEl = null;

        const clearTimer = (el) => {
            const t = timers.get(el);
            if (t) window.clearTimeout(t);
            timers.delete(el);
        };

        const deactivate = () => {
            try {
                game?.tooltip?.deactivate?.();
            } catch (_) {
                /* ignore */
            }
        };

        const activateTooltip = (el) => {
            const html = el.dataset.statusTableTooltip;
            if (!html) return;
            const direction = el.dataset.tooltipDirection || 'UP';
            try {
                game?.tooltip?.activate?.(el, { html, direction });
                activeEl = el;
            } catch (_) {
                /* ignore */
            }
        };

        // Use mouseover/mouseout for reliable event delegation.
        root.addEventListener('mouseover', (event) => {
            const el = event.target?.closest?.('.statusTable_3-system');
            if (!el || !root.contains(el)) return;

            // Ignore movement within the same system row.
            if (event.relatedTarget && el.contains(event.relatedTarget)) return;

            // If we're entering a new row, cancel any existing tooltip.
            if (activeEl && activeEl !== el) deactivate();

            clearTimer(el);
            const timer = window.setTimeout(() => activateTooltip(el), delayMs);
            timers.set(el, timer);
        }, true);

        root.addEventListener('mouseout', (event) => {
            const el = event.target?.closest?.('.statusTable_3-system');
            if (!el || !root.contains(el)) return;

            // Ignore movement within the same system row.
            if (event.relatedTarget && el.contains(event.relatedTarget)) return;

            clearTimer(el);
            if (activeEl === el) activeEl = null;
            deactivate();
        }, true);

        // Also cancel if focus shifts / context menu opens.
        root.addEventListener('contextmenu', (event) => {
            const el = event.target?.closest?.('.statusTable_3-system');
            if (!el || !root.contains(el)) return;
            clearTimer(el);
            if (activeEl === el) activeEl = null;
            deactivate();
        }, true);
    }

    _activateStatusTableSystemContextMenu(root) {
        // ContextMenu is namespaced under foundry.applications.ux in v13+.
        const ContextMenuImpl = foundry?.applications?.ux?.ContextMenu?.implementation;
        if (!ContextMenuImpl) return;

        const setStatus = async (target, statusKey) => {
            const el = target?.[0] ?? target;
            const itemId = el?.dataset?.itemId;
            if (!itemId) return;
            const item = this.actor.items.get(itemId);
            if (!item) return;

            await item.update({ 'system.status': statusKey });

            // Update UI datasets immediately (tooltip generator will also keep this in sync).
            el.dataset.status = statusKey;
        };

        const items = [
            {
                name: d100A?.equipmentStatus?.normal ?? 'Normal',
                icon: '<i class="fas fa-circle"></i>',
                callback: (li) => setStatus(li, 'normal')
            },
            {
                name: d100A?.equipmentStatus?.degraded ?? 'Degraded',
                icon: '<i class="fas fa-exclamation-triangle"></i>',
                callback: (li) => setStatus(li, 'degraded')
            },
            {
                name: d100A?.equipmentStatus?.knocked ?? 'Knocked Out',
                icon: '<i class="fas fa-ban"></i>',
                callback: (li) => setStatus(li, 'knocked')
            },
            {
                name: d100A?.equipmentStatus?.destroyed ?? 'Destroyed',
                icon: '<i class="fas fa-skull"></i>',
                callback: (li) => setStatus(li, 'destroyed')
            }
        ];

        // Only attach once per render.
        if (root.dataset?.statusTable3ContextMenuAttached === 'true') return;
        root.dataset.statusTable3ContextMenuAttached = 'true';
        new ContextMenuImpl(root, '.statusTable_3-system', items, { jQuery: false });
    }

    activateListeners(html) {
        // AppV2 no longer uses this; listeners are bound in _onRender.
        ui.notifications?.warn?.(
            "d100AActorSheetStarship.activateListeners called - use _onRender(context, options) for AppV2."
        );
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
        const crewElement = event.currentTarget.closest('.crew');
        const actorId = crewElement?.dataset?.actorId;
        if (!actorId) return;
        console.log("Hello", actorId, event)
        const role = this.actor.getCrewRoleForActor(actorId)
        const tokena = this.actor.istoken? this.token : this.actor.getActiveTokens()[0]
        console.log("Hello", actorId, role, this)
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
            flags: { d100A: { npcCrew: false, crewRole: role } }
        }];

        const combat = tokena.combatant.combat ?? game.combats.viewed;
        const crewman = combat.createEmbeddedDocuments("Combatant", createData);

        //crewman[0].ship = createData[0].actor
        console.log("crewman", crewman)
    }

    async _onCrewActionRoll(event) {
        console.log("Ping")
        event.preventDefault();
        const actionId = event.currentTarget.closest('.action').dataset.actionId;

        const skill = event.currentTarget.parentElement.dataset.skill;

        const compendium = this.constructor.getStarshipActionsPack();
        if (!compendium) return ui.notifications.error("Starship actions compendium not found.");
        const action = await compendium.getDocument(actionId)
        if (!action) return ui.notifications.error("Starship action not found.");

        const role = action.system.role
        const isNPC = this.actor.system.crew.useNPCCrew
        const actorData = isNPC ? this.actor.system.crew.npcData : this.actor.system.crew[role]
        const options = this._buildStarshipActionRollOptions(action);

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

        const compendium = this.constructor.getStarshipActionsPack();
        if (!compendium) return ui.notifications.error("Starship actions compendium not found.");
        console.log("Hello", compendium)
        const action = await compendium.getDocument(actionId)
        if (!action) return ui.notifications.error("Starship action not found.");
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


      //  actorData[role].active? this.actor.rollSkill(skill, options) : ui.notifications.error(`No Crew in Station`);

        const npcSkill = d100NPCCrewStats(npcCrewQuality)

        let skillflavor = actorData.attributes.damageControl.tooltip
        let stepflavor = "Damage Check" //"Hit " + systemDmg.name
        const defenOperator = npcCrew ? this.actor : actorData.crew.defences.actors[0]
        const skillId = "defen"
        let defenSkill = npcCrew ? npcSkill.skills[skillId] : defenOperator.system.skills[skillId]
        let stepbonus = defenSkill.step + actorData.attributes.damageControl.value//+ rangesteps -  targetRes

        let defen1 = await defenOperator.rollSkill(skillId, { steps: stepbonus, skillflavor: skillflavor, stepflavor: stepflavor })



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
        let stepflavor = "Hit on " + systemDmg.name
                const escape = foundry?.utils?.escapeHTML ?? ((s) => String(s));
                const actorName = escape(actor?.name ?? "");
                const systemName = escape(systemDmg?.name ?? "");

                const chatmessage = `
<div class="Alternityd100 chat-card">
    <header class="card-header">
        <div class="item-info">

            <div class="item-stepflavor">Rolls Hit on ${systemName}</div>
        </div>
    </header>

</div>`;

                await ChatMessage.create({
                        content: chatmessage,
                        speaker: ChatMessage.getSpeaker({ actor })
                });
        const defenOperator = npcCrew ? actor : actorData.crew.defences.actors[0]
        const skillId = "defen"
        let defenSkill = npcCrew ? npcSkill.skills[skillId] : defenOperator.system.skills[skillId]
        let stepbonus = actorData.attributes.damageControl.value//+ rangesteps -  targetRes

        let defen1 = await defenOperator.rollSkill(skillId, { steps: stepbonus, skillflavor: skillflavor, stepflavor: stepflavor })



    }


    async _onscanRefresh(event) {
        const action = event.currentTarget.dataset.scan
        
        const actorArray = await this.actor.getActiveTokens();//true, true);
        const actorToken = actorArray[0]
        const actor = this.actor
        const actorData = actor.system;
        console.log(action)
        if (!actorToken) {
            ui?.notifications?.warn?.("No active token found for this actor.");
            return;
        }
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
                        const updated = foundry.utils.duplicate(target);
                        const center = token.object?.center;
                        updated.token = {
                            name: token.name,
                            id: token.id,
                            img: token.texture?.src,
                            x: center?.x ?? token.x,
                            y: center?.y ?? token.y
                        };
                        if (token.actor) {
                            updated.size = token.actor.system.frame?.system.size || "tiny";
                            updated.scanRes = token.actor.system.attributes.ECM;
                        }
                        updated.name = token.name;

                        validScanTargets.push(updated)
                        newscan = false
                        //     console.log(target)
                    }
                })
                if (newscan) {
                    console.log(token)
                    if (!token.actor) {
                        ui.notifications.warn("Token " + token.name + " has no valid actor")
                        continue;
                    }
                    const center = token.object?.center;
                    const newscanz = {
                        token: {
                            name: token.name,
                            id: token.id,
                            img: token.texture?.src,
                            x: center?.x ?? token.x,
                            y: center?.y ?? token.y
                        },
                        //this.id = generateUUID()
                        size: token.actor.system.frame?.system.size || "tiny",
                        scanRes: token.actor.system.attributes.ECM,
                        name: token.name,
                        sensors: [], //new Set(),
                        attackMod: 9,
                        aquired: false,
                        image: "systems/Alternityd100/icons/roles/icons8-proximity-sensor-100.png"
                    }
                    validScanTargets.push(newscanz)
                }
            }
        }

        for (const scan of validScanTargets) {
            console.log(actorToken,scan)

            const sourceCenter = actorToken.object?.center ?? actorToken.center ?? { x: actorToken.x, y: actorToken.y };
            const targetPoint = scan?.token ? { x: scan.token.x, y: scan.token.y } : null;
            if (!targetPoint || !Number.isFinite(targetPoint.x) || !Number.isFinite(targetPoint.y)) continue;

            scan.range = Math.ceil((measureDistance({ x: sourceCenter.x, y: sourceCenter.y }, targetPoint)));
            scan.ray = new foundry.canvas.geometry.Ray({ x: sourceCenter.x, y: sourceCenter.y }, targetPoint)
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
        if (event?.currentTarget?.style) {
            event.currentTarget.style.background = "rgba(0,0,0,0.3)";
        }
    }

    /**
     * Handles dragleave for the crews tab
     * @param {Event} event The originating dragleave event
     */
    _onCrewDragLeave(event) {
        if (event?.currentTarget?.style) {
            event.currentTarget.style.background = "";
        }
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
        const crewElement = event.currentTarget.closest('.crew');
        const actorId = crewElement?.dataset?.actorId;
        if (!actorId) return;
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
        const crewElement = event.currentTarget.closest('.crew');
        const actorId = crewElement?.dataset?.actorId;
        if (!actorId) return;
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
        const roleId = event.currentTarget.closest('li')?.dataset?.role;
        if (!roleId) return;

        const results = await ChoiceDialog.show(
            "Add Skill",
            "Select the skill you wish to add to the role of " + roleId + "?",
            {
                skill: {
                    name: "Skill",
                    options: Object.values(CONFIG.d100A.skills),
                    default: Object.values(CONFIG.d100A.skills)[0]
                }
            }
        );

        if (results.resolution === 'cancel') {
            return;
        }

        let skillId = null;
        for (const [key, value] of Object.entries(CONFIG.d100A.skills)) {
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
        const row = event.currentTarget.closest('li');
        const roleId = row?.dataset?.role;
        const skillId = row?.dataset?.skill;
        if (!roleId || !skillId) return;

        this.actor.update({ [`data.crew.npcData.${roleId}.skills.-=${skillId}`]: null });
    }



    // async _onCrewNumberOfUsesChanged(event) {

    async _onCrewChanged(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const a = event.currentTarget;
        const attribute = a.dataset.item;
        const roleId = event.currentTarget.closest('li')?.dataset?.role;
        if (!roleId) return;

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
        const row = event.currentTarget.closest('li');
        const roleId = row?.dataset?.role;
        const skillId = row?.dataset?.skill;
        if (!roleId || !skillId) return;

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
        const row = event.currentTarget.closest('li');
        const roleId = row?.dataset?.role;
        const skillId = row?.dataset?.skill;
        if (!roleId || !skillId) return;

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
        const affectedSystem = event.currentTarget?.dataset?.system;
        if (!affectedSystem) return;

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
        const starshipActions = d100AActorSheetStarship.getStarshipActionsPack();
        if (!starshipActions) return;



        // const perks = game.packs.get("Alternityd100.perks");
        // console.log("\n-----dsf-------",starshipActions);



        return starshipActions.getIndex().then(async (indices) => {
            for (const index of indices) {
                const entry = await starshipActions.getDocument(index._id);
                //             console.log("entry-",entry)

                const role = entry.system.role;

                if (!tempCache[role]) {
                    tempCache[role] = { label: CONFIG.d100A.starshipRoleNames?.[role] ?? role, actions: [] };
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