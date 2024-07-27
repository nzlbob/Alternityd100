import { Mix } from "../utils/custom-mixer.js";
import { ItemActivationMixin } from "./mixins/item-activation.js";
import { ItemCapacityMixin } from "./mixins/item-capacity.js";
import { AbilityTemplate } from "../pixi/ability-template.js";
import { Diced100 } from "../dice.js";
import RollContext from "../rolls/rollcontext.js";
import { SFRPG } from "../config.js";
import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../modifiers/types.js";
import SFRPGModifier from "../modifiers/modifier.js";
import d100AModifier from "../modifiers/modifier.js";
import d100AModifierApplication from "../apps/modifier-app.js";
import StackModifiers from "../rules/closures/stack-modifiers.js";
import { d100A } from "../d100Aconfig.js"
//import { TargetsTable } from "../../lib-targeting/src/TargetsTable.js";
//import { NPCTargeting } from "../../lib-targeting/src/NPCTargeting.js";
import { attackModData, d100stepdie } from "../modifiers/d100mod.js";
import { targetResModData, d100NPCCrewStats } from "../modifiers/d100mod.js";
import { d100Actor } from "../d100actor.js";
import { rollStarshipLauncherAttack } from "./item-ordnance-utils.js"
import { getRangeCat, radtodeg, degtorad, raytodeg, inArc, generateUUID } from "../utilities.js"

//import {d100stepdie } from "../modifiers/d100mod.js";
export class ItemSFRPG extends Mix(Item).with(ItemActivationMixin, ItemCapacityMixin) {
    // export class ItemSFRPG extends (Item) {    

    /* -------------------------------------------- */
    /*  Item Properties                             */
    /* -------------------------------------------- */

    /**
     * Does the Item implement an attack roll as part of its usage
     * @type {boolean}
     */
    get xxcanBeActivated() {

        if (this.type === "vehicleSystem") {
            return true
        }
        return false
    }

    get hasAttack() {
        if (this.type === "starshipWeapon") return true;
        if (["meleeW"].includes(this.system.weaponType)) { this.system.actionType = "mwak" }
        if (["rangedW", "explos", "heavyW"].includes(this.system.weaponType)) { this.system.actionType = "rwak" }
        if ((["psionic"].includes(this.system.type))&& (["ranged"].includes(this.system.psiEffectType))) { this.system.actionType = "rsak" }
        //console.log("--------------hasAttack----------\n")
        return ["mwak", "rwak", "msak", "rsak"].includes(this.system.actionType);
    }

    get hasScan() {
        if (this.type === "starshipSensor") return true;
        return false
    }
    get isSkilled() {
        if (this.system.isSkilled) return true;
        return false
    }
    get isCybertech() {
        if (this.type === "augmentation") return true;
        return false
    }
    get hasDamage() {
        if (this.type === "starshipWeapon") return true;
        //console.log(this)
        const orddice = !!(this.system.damage?.ord?.dice && this.system.damage?.ord?.type)
        const weaponthing = ["weapon", "shield","psionic"].includes(this.type)
        const a = ["weapon", "shield","psionic"].includes(this.type) ? orddice && (weaponthing || this.system.equipped) : false;
        return a;
    }

    get isLauncher() {
        if (this.type === "starshipWeapon") {
            return (
                this.system.weaponType === "missile"
                || this.system.weaponType === "bomb"
                || this.system.weaponType === "mine"
                || this.system.weaponType === "torp"
                || this.system.weaponType === "special"
            );
        }
    }

    get hasDefence() {
        //if (this.data.type === "starshipWeapon") return true;
        //const orddice = !!(this.system.damage.ord.dice && this.system.damage.ord.type)
        const armourthing = ["equipment", "shield", "helmet"].includes(this.type)
        const a = ["equipment", "shield"].includes(this.type) ? (armourthing && this.system.equipped) : false;
        // console.log("--------------A----------\n",a, ["equipment", "shield"].includes(this.data.type), armourthing, this.system.equipped, this)
        return a;
    }


    //not used
    get hasOtherFormula() {
        return ("formula" in this.system) && this.system.formula?.trim().length > 0;
    }

    //not used
    get isAoE() {
        if (["area","scan"].includes(this.system.psiEffectType)) return true
        return (["indirfi", "throw","areaeff","setexp"].includes(this.system.skill)) && this.system.blastArea.long > 0;
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasSave() {
        const saveData = this.system?.save;
        if (!saveData) {
            return false;
        }

        const hasType = !!saveData.type;
        return hasType;
    }
    /**
     * Does the Item implement a saving throw as part of its usage
     * @type {boolean}
     */
    get hasPsionic() {
        const saveData = this.type === "psionic";
        if (!saveData) {
            return false;
        }

        //const hasType = !!saveData.type;
        return saveData;
    }
    get hasCapacity() {
        //console.log("\n\n\n*******hasCapacity()**********\n\n\n")
        if (this.type === "starshipWeapon") {

            return (
                this.system.weaponType === "tracking"
                || this.system.weaponType === "missile"
                || this.system.weaponType === "bomb"
                || this.system.weaponType === "mine"
                || this.system.special["mine"]
                || this.system.special["transposition"]
                || this.system.special["orbital"]
                || this.system.special["rail"]
                || this.system.special["forcefield"]
                || this.system.special["limited"]
            );
        }

        return (this.getMaxCapacity() > 0);
    }
    /* -------------------------------------------- */
    /*	Data Preparation														*/
    /* -------------------------------------------- */

    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();
        const C = CONFIG.SFRPG;
        const labels = {};
        const item = this;
        const itemData = item.system;
        const actorData = item.parent ? item.parent.system : null;
        item.system.type = item.type
//console.log("Here", itemData.type,itemData)
        if (actorData && ["psionic"].includes(itemData.type)) {

            itemData.base = Math.floor((actorData.abilities[itemData.ability]?.value + itemData.rank)) || itemData.base ; 
            itemData.good =  Math.floor(itemData.base/2) ; 
            itemData.amazing =  Math.max(1,Math.floor(itemData.base/4)) 
//console.log(actorData.abilities.per.value)
            console.log("Here", itemData.base, actorData)

        }


        if (this.type == "starshipDefensiveCountermeasure") this.type = "starshipDefence"
        // console.log("C",C,"dtaa",data,"Actor",actorData)

        // Spell Level,  School, and Components
        if (this.type === "spell") {
            labels.level = C.spellLevels[level];
            labels.school = C.spellSchools[school];
        }

        // Feat Items
        else if (this.type === "feat") {
            const act = itemData.activation;
            if (act && act.type) labels.featType = system.damage.length ? "Attack" : "Action";
            else labels.featType = "Passive";
        }

        // Equipment Items
        else if (this.type === "equipment") {
            itemData.firepowerN = 1;
            if (itemData.firepower == "G") itemData.firepowerN = 2;
            else if (itemData.firepower == "A") itemData.firepowerN = 3;
            else if (itemData.firepower == "AS") itemData.firepowerN = 4;
            else if (itemData.firepower == "AL") itemData.firepowerN = 5;
            else if (itemData.firepower == "AM") itemData.firepowerN = 6;
            else if (itemData.firepower == "AH") itemData.firepowerN = 7;
            else if (itemData.firepower == "ASH") itemData.firepowerN = 8;
        }

        else if (this.type === "weapon") {
            //console.log("Prepare Data",itemData)

            //if melee set mode to melee
            if (itemData.weaponType == "meleeW") {
                itemData.fireMode = "melee";
                //console.log("More Data",itemData);
            }
            //check if current fire mode is allowed
            if (["rangedW", "heavyW"].includes(itemData.weaponType)) {
                if (itemData.fireMode) {
                    if (itemData.mode[itemData.fireMode]) {
                    }
                    // if the attack mode is un supported select the lowest ROF as default
                    else {
                        if (itemData.mode.auto) itemData.fireMode = "auto"
                        if (itemData.mode.burst) itemData.fireMode = "burst"
                        if (itemData.mode.fire) itemData.fireMode = "fire"
                    }
                }
                //Any other weapon set as fire
                else { itemData.fireMode = "fire" }
            }
            //console.log(itemData.firepower)
            itemData.firepowerN = 1;
            if (itemData.firepower == "G") itemData.firepowerN = 2;
            else if (itemData.firepower == "A") itemData.firepowerN = 3;
            else if (itemData.firepower == "GD") itemData.firepowerN = 2;
            else if (itemData.firepower == "L") itemData.firepowerN = 3;
            else if (itemData.firepower == "M") itemData.firepowerN = 4;
            else if (itemData.firepower == "H") itemData.firepowerN = 5;
            else if (itemData.firepower == "SH") itemData.firepowerN = 6;


        }
        // Starshup Hull HP Calculation
        else if (this.type == "starshipFrame") {
            //  console.log(itemData);

            let SW = itemData.durability + itemData.durability;
            let MO = Math.round(SW / 2);
            let CR = Math.round(MO / 2);
            //
            itemData.attributes.wou.base = SW;
            itemData.attributes.wou.value = SW;
            itemData.attributes.stu.base = SW;
            itemData.attributes.stu.value = SW;
            itemData.attributes.mor.base = MO;
            itemData.attributes.mor.value = MO;
            itemData.attributes.cri.base = CR;
            itemData.attributes.cri.value = CR;

            itemData.firepowerN = 1;
            if (itemData.toughness == "good") itemData.firepowerN = 2;
            else if (itemData.toughness == "small") itemData.firepowerN = 3;
            else if (itemData.toughness == "light") itemData.firepowerN = 4;
            else if (itemData.toughness == "medium") itemData.firepowerN = 5;
            else if (itemData.toughness == "heavy") itemData.firepowerN = 6;
            else if (itemData.toughness == "super") itemData.firepowerN = 7;

            // Calculate hull points
            if (itemData.size == "small") itemData.hullPoints.size = 0;
            else if (itemData.size == "light") itemData.hullPoints.size = Math.round(itemData.hullPoints.base * 0.1);
            else if (itemData.size == "medium") itemData.hullPoints.size = Math.round(itemData.hullPoints.base * 0.2);
            else if (itemData.size == "heavy") itemData.hullPoints.size = Math.round(itemData.hullPoints.base * 0.3);
            else if (itemData.size == "super") itemData.hullPoints.size = Math.round(itemData.hullPoints.base * 0.5);

            itemData.hullPoints.total = itemData.hullPoints.size + itemData.hullPoints.base + itemData.hullPoints.bonus
            //let basesize ="";
            // Calculate number of compartments
            if (game.settings.get("Alternityd100", "starshipCompartments") == "warships") {
                if (itemData.size == "small" && itemData.hullPoints.size <= 20) itemData.basesize = "small2";
                else if (itemData.size == "small" && itemData.hullPoints.size > 20) itemData.basesize = "small4"
                else itemData.basesize = itemData.size;


                //***********This can be deleted after testing */    
                /*   This is for the old PHB method of damage where each compartment has HP
                
                                    for (let[key,tempcomp] of Object.entries(itemData.compartment)){
                                  //      console.log( "Durability",  tempcomp, tempcomp.value)
                                        tempcomp.durability.mor.max =  tempcomp.value;
                                        tempcomp.durability.wou.max =  tempcomp.value*2;
                                        tempcomp.durability.stu.max =  tempcomp.value*2;
                                       // console.log( "Durability (S)",  tempcomp.durability.stu.value,"/", tempcomp.durability.stu.max,"\nDurability (W)" ,tempcomp.durability.wou.value,"/",tempcomp.durability.wou.max,"\nDurability (M)",tempcomp.durability.mor.value,"/",tempcomp.durability.mor.max)
                                           // load the main 
                
                
                
                        for ( let [k, v] of Object.entries(tempcomp.durability) ) {
                            v.good=[];
                            v.bad = [];
                            // for (const [v,k] of data.status.durability) {
                             for (let i = 0; i < v.max;i++)
                             {
                             //    console.log(this.actor.system?.attributes[k].value,k,v,i)
                                 if (v.value > i ) v.good.push(i);
                                 else v.bad.push(i);
                     
                             }
                              }
                                   
                                   
                                   
                                    }
                */
                //*************************************************************

                /**    console.log( "itemData.compartments?", itemData.compartments? true : false )
                 if (itemData.compartments? true : false )  { delete itemData.compartments; console.log("Old Compartments deleted")};
                 if  (/*itemData.compartment? false : true ) {
                     itemData.compartment={"size": basesize, "compartments" : foundry.utils.duplicate(d100A.compartments[basesize]) }; 
                                  
                 };   
                 if  (itemData.compartment.size != basesize) {
                     itemData.compartment={"size": basesize, "compartments" : foundry.utils.duplicate(d100A.compartments[basesize]) };              
                 }; 

           */

            }
            else {
                for (let [key, tempcomp] of Object.entries(itemData.compartment)) {
                    console.log("Durability", tempcomp, tempcomp.value)
                    tempcomp.durability.mor.max = tempcomp.value;
                    tempcomp.durability.wou.max = tempcomp.value * 2;
                    tempcomp.durability.stu.max = tempcomp.value * 2;
                    console.log("Durability (SWM)", tempcomp.durability.stu.max, tempcomp.durability.wou.max, tempcomp.durability.mor.max)
                }
            }

        }
        else if (this.type == "starshipWeapon") {
            // Define mounts
            itemData.skill = "weapo"
            if (["standard", "fixed", "turret"].includes(itemData.mount.type)) {
                itemData.mount.mounted = true;
                itemData.mount.isStandard = false;
                itemData.mount.isFixed = false;
                itemData.mount.isTurret = false;
                if (itemData.mount.type == "standard") itemData.mount.isStandard = true;
                if (itemData.mount.type == "fixed") itemData.mount.isFixed = true;
                if (itemData.mount.type == "turret") itemData.mount.isTurret = true;
            }
            if (itemData.mount.type == "unmounted") itemData.mount.mounted = false;


            if (["beam", "projectile"].includes(itemData.weaponType)) {
                if (itemData.fireMode) {
                    if (itemData.mode[itemData.fireMode]) {
                    }
                    // if the attack mode is un supported select the lowest ROF as default
                    else {
                        if (itemData.mode.auto) itemData.fireMode = "auto"
                        if (itemData.mode.burst) itemData.fireMode = "burst"
                        if (itemData.mode.fire) itemData.fireMode = "fire"
                        if (itemData.mode.battery) itemData.fireMode = "battery"
                    }
                }
                //Any other weapon set as fire
                else { itemData.fireMode = "fire" }
            }
            //console.log(itemData.firepower)
            itemData.firepowerN = 1;
            if (itemData.firepower == "G") itemData.firepowerN = 2;
            else if (itemData.firepower == "A") itemData.firepowerN = 3;
            else if (itemData.firepower == "GD") itemData.firepowerN = 2;
            else if (itemData.firepower == "L") itemData.firepowerN = 3;
            else if (itemData.firepower == "M") itemData.firepowerN = 4;
            else if (itemData.firepower == "H") itemData.firepowerN = 5;
            else if (itemData.firepower == "SH") itemData.firepowerN = 6;



        }
        else if (this.type == "starshipOrdnance") {
            // Calculate parts
            ///console.log("\n\n\n\n",)
            itemData.attributes.size = 1
            itemData.accur = itemData.propAcc + itemData.guidanceAccur + itemData.warAccur;
            itemData.price = itemData.propCost + itemData.guidanceCost + itemData.warCost;
            // console.log("\n\n\n\n",itemData.accur,this,"\n\n\n\n")               
        }



        // Activated Items
        //console.log(itemData)
        if (itemData.hasOwnProperty("activation")) {
            //console.log(this)
            // Ability Activation Label
            let act = itemData.activation || {};
            if (act) labels.activation = [
                act.cost,
                act.type === "none" ? null : C.abilityActivationTypes[act.type]
            ].filterJoin(" ");

            let tgt = itemData.target || {};
            if (tgt.value && tgt.value === "") tgt.value = null;

            labels.target = [tgt.value].filterJoin(" ");

            let area = itemData.area || {};
            if (["none", "touch", "personal"].includes(area.units)) area.value = null;
            if (typeof area.value === 'number' && area.value === 0) area.value = null;
            if (["none"].includes(area.units)) area.units = null;

            labels.area = [area.value, C.distanceUnits[area.units] || null, C.spellAreaShapes[area.shape], C.spellAreaEffects[area.effect]].filterJoin(" ");

            // Range Label
            let rng = itemData.range || {};
            if (["none", "touch", "personal"].includes(rng.units) || (rng.value === 0)) {
                rng.value = null;
            }
            if (["none"].includes(rng.units)) rng.units = null;
            labels.range = [rng.value, C.distanceUnits[rng.units] || null].filterJoin(" ");

            // Duration Label
            let dur = itemData.duration || {};
            labels.duration = [dur.value].filterJoin(" ");
        }

        //   This causes error  Added && false to kill process
        // Item Actions
        if (itemData.hasOwnProperty("actionType" && false)) {
            // Damage
            let dam = itemData.damage || {};
            console.log(this, "\n", itemData)
            if (dam.parts) labels.damage = dam.parts.map(d => d[0]).join(" + ").replace(/\+ -/g, "- ");
        }

        // Assign labels and return the Item
        this.labels = labels;

        //      let hasCapacity = hasCapacity();


    }

    async processData() {

        //    console.log("Process Data")
        return game.Alternityd100.engine.process("process-items", {

            item: this,
            itemData: this.system,
            owner: {
                actor: this.actor,
                actorData: this.actor?.system,
                token: this.actor?.token,
                scene: this.actor?.token?.parent
            }
        });
    }

    /**
     * Check to ensure that this item has a modifiers data object set, if not then set it. 
     * These will always be needed from hence forth, so we'll just make sure that they always exist.
     * 
     * @param {Object}      data The item data to check against.
     * @param {String|Null} prop A specific property name to check.
     * 
     * @returns {Object}         The modified data object with the modifiers data object added.
     */
    _ensureHasModifiers(data, prop = null) {
        if (!hasProperty(data, "modifiers")) {
            //console.log(`Starfinder | ${this.name} does not have the modifiers data object, attempting to create them...`);
            data.modifiers = [];
        }

        return data;
    }

    /* -------------------------------------------- */

    /**
     * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
     * @return {Promise}
     */
    async roll() {
        let htmlOptions = { secrets: this.actor?.isOwner || true, rollData: this.system };
        htmlOptions.rollData.owner = this.actor?.system;

        // Basic template rendering data
        const token = this.actor.token;
        const templateData = {
            actor: this.actor,
            tokenId: token ? `${token.parent.id}.${token.id}` : null,
            item: this,
            data: this.getChatData(htmlOptions),
            labels: this.labels,
            hasAttack: this.hasAttack,
            isLauncher: this.islauncher,
            hasDamage: this.hasDamage,
            hasDefence: this.hasDefence,
            hasSave: this.hasSave,
            hasOtherFormula: this.hasOtherFormula
        };

        if (this.type === "spell") {
            let descriptionText = foundry.utils.duplicate(templateData.data.description.short || templateData.data.description.value);
            if (descriptionText?.length > 0) {
                // Alter description by removing non-eligble level tags.
                const levelTags = [
                    { level: 0, tag: "level_0" },
                    { level: 1, tag: "level_1" },
                    { level: 2, tag: "level_2" },
                    { level: 3, tag: "level_3" },
                    { level: 4, tag: "level_4" },
                    { level: 5, tag: "level_5" },
                    { level: 6, tag: "level_6" }
                ];

                for (const { level, tag } of levelTags) {
                    const shouldShowEx = level === this.system.level;
                    const startTagEx = `[${tag}_only]`;
                    const endTagEx = `[/${tag}_only]`;

                    const shouldShowInc = level <= this.system.level;
                    const startTagInc = `[${tag}]`;
                    const endTagInc = `[/${tag}]`;

                    if (shouldShowEx) {
                        let tagStartIndex = descriptionText.indexOf(startTagEx);
                        while (tagStartIndex != -1) {
                            descriptionText = descriptionText.replace(startTagEx, "");
                            tagStartIndex = descriptionText.indexOf(startTagEx);
                        }

                        let tagEndIndex = descriptionText.indexOf(endTagEx);
                        while (tagEndIndex != -1) {
                            descriptionText = descriptionText.replace(endTagEx, "");
                            tagEndIndex = descriptionText.indexOf(endTagEx);
                        }
                    } else {
                        let tagStartIndex = descriptionText.indexOf(startTagEx);
                        let tagEndIndex = descriptionText.indexOf(endTagEx);
                        while (tagStartIndex != -1 && tagEndIndex != -1) {
                            descriptionText = descriptionText.substr(0, tagStartIndex) + descriptionText.substr(tagEndIndex + endTagEx.length);
                            tagStartIndex = descriptionText.indexOf(startTagEx);
                            tagEndIndex = descriptionText.indexOf(endTagEx);
                        }
                    }

                    if (shouldShowInc) {
                        let tagStartIndex = descriptionText.indexOf(startTagInc);
                        while (tagStartIndex != -1) {
                            descriptionText = descriptionText.replace(startTagInc, "");
                            tagStartIndex = descriptionText.indexOf(startTagInc);
                        }

                        let tagEndIndex = descriptionText.indexOf(endTagInc);
                        while (tagEndIndex != -1) {
                            descriptionText = descriptionText.replace(endTagInc, "");
                            tagEndIndex = descriptionText.indexOf(endTagInc);
                        }
                    } else {
                        let tagStartIndex = descriptionText.indexOf(startTagInc);
                        let tagEndIndex = descriptionText.indexOf(endTagInc);
                        while (tagStartIndex != -1 && tagEndIndex != -1) {
                            descriptionText = descriptionText.substr(0, tagStartIndex) + descriptionText.substr(tagEndIndex + endTagInc.length);
                            tagStartIndex = descriptionText.indexOf(startTagInc);
                            tagEndIndex = descriptionText.indexOf(endTagInc);
                        }
                    }
                }

                if (templateData.data.description.short) {
                    templateData.data.description.short = descriptionText;
                } else {
                    templateData.data.description.value = descriptionText;
                }
            }
        }

        // Render the chat card template
        const templateType = ["tool", "pharmaceutical"].includes(this.type) ? this.type : "item";
        const template = `systems/Alternityd100/templates/chat/${templateType}-card.html`;
        const html = await renderTemplate(template, templateData);

        // Basic chat message data
        const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: token ? ChatMessage.getSpeaker({ token: token }) : ChatMessage.getSpeaker({ actor: this.actor })
        };

        // Toggle default roll mode
        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
        if (rollMode === "blindroll") chatData["blind"] = true;

        // Create the chat message
        return ChatMessage.create(chatData, { displaySheet: false });
    }

    /* -------------------------------------------- */
    /*  Chat Cards                                  */
    /* -------------------------------------------- */

    async getChatData(htmlOptions) {
        const data = foundry.utils.duplicate(this.system);
        const labels = this.labels;

        // Rich text description
        data.description.value = await TextEditor.enrichHTML(data.description.value, htmlOptions);

        // Item type specific properties
        const props = [];
        const fn = this[`_${this.type}ChatData`];
        if (fn) fn.bind(this)(data, labels, props);

        // General equipment properties
        const equippableTypes = ["weapon", "equipment", "shield"];
        if (data.hasOwnProperty("equipped") && equippableTypes.includes(this.type)) {
            props.push(
                { name: data.equipped ? "Equipped" : "Not Equipped", tooltip: null },
                { name: data.proficient ? "Proficient" : "Not Proficient", tooltip: null }
            );
        }

        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
            props.push(
                { name: labels.target, tooltip: null },
                { name: labels.area, tooltip: null },
                { name: labels.activation, tooltip: null },
                { name: labels.range, tooltip: null },
                { name: labels.duration, tooltip: null }
            );
        }

        if (data.hasOwnProperty("capacity")) {
            props.push({
                name: labels.capacity,
                tooltip: null
            });
        }

        if (this.type === "container") {
            if (this.actor) {
                let wealth = 0;
                const containedItems = this._getContainedItems();
                for (const item of containedItems) {
                    wealth += item.system.quantity * item.system.price;
                }
                wealth = Math.floor(wealth);

                const wealthString = new Intl.NumberFormat().format(wealth);
                const wealthProperty = game.i18n.format("SFRPG.CharacterSheet.Inventory.ContainedWealth", { wealth: wealthString });
                props.push({
                    name: wealthProperty,
                    tooltip: null
                });
            }
        }

        // Filter properties and return
        data.properties = props.filter(p => !!p && !!p.name);
        return data;
    }

    _getContainedItems() {
        const contents = this.system.container?.contents;
        if (!contents || !this.actor) {
            return [];
        }

        const itemsToTest = [this];
        const containedItems = [];
        while (itemsToTest.length > 0) {
            const itemToTest = itemsToTest.shift();

            const contents = itemToTest?.system?.container?.contents;
            if (contents) {
                for (const content of contents) {
                    const containedItem = this.actor.items.get(content.id);
                    if (containedItem) {
                        containedItems.push(containedItem);
                        itemsToTest.push(containedItem);
                    }
                }
            }
        }

        return containedItems;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for equipment type items
     * @private
     */
    _equipmentChatData(data, labels, props) {
        props.push(
            { name: CONFIG.SFRPG.armorTypes[data.armor.type], tooltip: null },
            { name: labels.eac || null, tooltip: null },
            { name: labels.kac || null, tooltip: null }
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for weapon type items
     * @private
     */
    _weaponChatData(data, labels, props) {
        props.push(
            { name: CONFIG.d100A.weaponTypes[data.weaponType], tooltip: null },
            ...Object.entries(data.properties).filter(e => e[1] === true)
                .map(e => ({ name: CONFIG.SFRPG.weaponProperties[e[0]], tooltip: CONFIG.SFRPG.weaponPropertiesTooltips[e[0]] })
                )
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for pharmaceutical type items
     * @private
     */
    _consumableChatData(data, labels, props) {
        props.push(
            { name: CONFIG.SFRPG.consumableTypes[data.consumableType], tooltip: null },
            { name: this.getRemainingUses() + "/" + this.getMaxUses() + " Charges", tooltip: null }
        );
        data.hasCharges = this.getRemainingUses() >= 0;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for goods type items
     * @private
     */
    _goodsChatData(data, labels, props) {
        props.push(
            { name: "Goods", tooltip: null },
            data.bulk ? { name: `Bulk ${data.bulk}`, tooltip: null } : null
        );
    }

    /**
     * Prepare chat card data for technological type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _technologicalChatData(data, labels, props) {
        props.push(
            { name: "Technological", tooltip: null },
            data.bulk ? { name: `Bulk ${data.bulk}`, tooltip: null } : null,
            data.hands ? { name: `Hands ${data.hands}`, tooltip: null } : null
        );
    }

    /**
     * Prepare chat card data for hybrid type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _hybridChatData(data, labels, props) {
        props.push(
            { name: "Hybrid", tooltip: null },
            data.bulk ? { name: `Bulk ${data.bulk}`, tooltip: null } : null,
            data.hands ? { name: `Hands ${data.hands}`, tooltip: null } : null
        );
    }

    /**
     * Prepare chat card data for magic type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _magicChatData(data, labels, props) {
        props.push(
            "Magic",
            data.bulk ? { name: `Bulk ${data.bulk}`, tooltip: null } : null,
            data.hands ? { name: `Hands ${data.hands}`, tooltip: null } : null
        );
    }

    /**
     * Prepare chat card data for armor upgrades
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _upgradeChatData(data, labels, props) {
        let armorType = "";

        if (data.armorType === 'any') {
            armorType = "Any"
        } else {
            armorType = CONFIG.SFRPG.armorTypes[data.armorType];
        }

        props.push(
            { name: "Armor Upgrade", tooltip: null },
            data.slots ? { name: `Slots ${data.slots}`, tooltip: null } : null,
            { name: `Allowed armor ${armorType}`, tooltip: null }
        );
    }

    _augmentationChatData(data, labels, props) {
        props.push(
            { name: "Augmentation", tooltip: null },
            data.type ? { name: CONFIG.SFRPG.augmentationTypes[data.type], tooltip: null } : null,
            data.system ? { name: CONFIG.SFRPG.augmentationSytems[data.system], tooltip: null } : null
        );
    }

    /**
     * Prepare chat card data for weapon fusions
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _fusionChatData(data, labels, props) {
        props.push(
            { name: "Weapon Fusion", tooltip: null },
            data.level ? { name: `Level ${data.level}`, tooltip: null } : null
        );
    }

    _starshipWeaponChatData(data, labels, props) {
        props.push(
            { name: "Starship Weapon", tooltip: null },
            data.weaponType ? { name: CONFIG.SFRPG.starshipWeaponTypes[data.weaponType], tooltip: null } : null,
            data.class ? { name: CONFIG.SFRPG.starshipWeaponClass[data.class], tooltip: null } : null,
            data.range ? { name: CONFIG.SFRPG.starshipWeaponRanges[data.range], tooltip: null } : null,
            data.mount.mounted ? { name: game.i18n.localize("SFRPG.Items.ShipWeapon.Mounted"), tooltip: null } : { name: game.i18n.localize("SFRPG.Items.ShipWeapon.NotMounted"), tooltip: null },
            data.speed > 0 ? { name: game.i18n.format("SFRPG.Items.ShipWeapon.Speed", { speed: data.speed }), tooltip: null } : null
        );
    }

    /**
     * Prepare chat card data for shield type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _shieldChatData(data, labels, props) {
        const wieldedBonus = (data.proficient ? data.bonus.wielded : 0) || 0;
        const alignedBonus = (data.proficient ? data.bonus.aligned : 0) || 0;

        props.push(
            { name: game.i18n.localize("SFRPG.Items.Shield.Shield"), tooltip: null },
            { name: game.i18n.format("SFRPG.Items.Shield.AcMaxDex", { maxDex: (data.dex || 0).toString() }), tooltip: null },
            { name: game.i18n.format("SFRPG.Items.Shield.ArmorCheck", { acp: (data.acp || 0).toString() }), tooltip: null },
            { name: game.i18n.format("SFRPG.Items.Shield.Bonuses", { wielded: wieldedBonus.toString(), aligned: alignedBonus.toString() }), tooltip: null },
            data.proficient ? { name: game.i18n.localize("SFRPG.Items.Proficient"), tooltip: null } : { name: game.i18n.localize("SFRPG.Items.NotProficient"), tooltip: null }
        );
    }

    /* -------------------------------------------- */

    /**
     * Render a chat card for Spell type data
     * @return {Object}
     * @private
     */
    _spellChatData(data, labels, props) {

        // Spell properties
        props.push(
            { name: labels.level, tooltip: null }
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for items of the "Feat" type
     */
    _featChatData(data, labels, props) {
        // Feat properties
        props.push(
            { name: data.requirements, tooltip: null }
        );
    }

    _perkChatData(data, labels, props) {
        props.push(
            { name: "Perk", tooltip: null },
            data.abilityMod.ability ? { name: `Ability ${CONFIG.SFRPG.abilities[data.abilityMod.ability]}`, tooltip: null } : null,
            data.skill ? { name: `Skill ${CONFIG.SFRPG.skills[data.skill]}`, tooltip: null } : null
        );
    }
    _flawChatData(data, labels, props) {
        props.push(
            { name: "Flaw", tooltip: null },
            data.abilityMod.ability ? { name: `Ability ${CONFIG.SFRPG.abilities[data.abilityMod.ability]}`, tooltip: null } : null,
            data.skill ? { name: `Skill ${CONFIG.SFRPG.skills[data.skill]}`, tooltip: null } : null
        );
    }
    _achievementChatData(data, labels, props) {
        props.push(
            { name: "Achievement", tooltip: null },
            data.abilityMod.ability ? { name: `Ability ${CONFIG.SFRPG.abilities[data.abilityMod.ability]}`, tooltip: null } : null,
            data.skill ? { name: `Skill ${CONFIG.SFRPG.skills[data.skill]}`, tooltip: null } : null
        );
    }

    _raceChatData(data, labels, props) {
        props.push(
            { name: "Species", tooltip: null },
            data.type ? { name: data.type, tooltip: null } : null,
            data.subtype ? { name: data.subtype, tooltip: null } : null
        );
    }

    _vehicleAttackChatData(data, label, props) {
        props.push(
            data.ignoresHardness ? game.i18n.localize("SFRPG.VehicleAttackSheet.Details.IgnoresHardness") + " " + data.ignoresHardness : null
        );
    }

    _vehicleSystemChatData(data, label, props) {

        if (data.senses && data.senses.usedForSenses == true) {
            // We deliminate the senses by `,` and present each sense as a separate property
            let sensesDeliminated = data.senses.senses.split(",");
            for (let index = 0; index < sensesDeliminated.length; index++) {
                var sense = sensesDeliminated[index];
                props.push(sense);
            }
        }
    }

    /* -------------------------------------------- */
    /*  Item Rolls - Attack, Damage, Saves, Checks  */
    /* -------------------------------------------- */

    /**
     * Place an attack roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.attackRoll logic for the core implementation
     * 
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     * fire:
     * burstfire
     * autofire
     */
    async rollAttack(options = {}) {
        if (this.isAoE) this.rollAoEAttack(options)
        if (!this.isAoE) this.rollNormalAttack(options)


    }

    async rollAoEAttack(options = {}) {
        const item = this;
        const actor = this.actor;
        const itemData = this.system;
        const isWeapon = this.hasAttack
        const actorData = this.actor.system;
        const actorArray = this.actor.getActiveTokens(true, true);
        let actorToken = actorArray[0]
        const rollData = foundry.utils.duplicate(actorData);
        let template = "systems/Alternityd100/templates/dialogs/attack-dialog.hbs";
        let parts = [];
        let targetData = [];
        let dialogOptions = {}
        let staticRoll = null;
        var onClose
        const fastForward = (options.skipDialog === true)

        if (!actorToken) {
            //const tokens = game.canvas.activeLayer.controlled.filter(t => t.inCombat );


            actorToken = game.canvas.activeLayer.controlled[0].document
        }

        if (!actorToken) NoTokenWarn()
        if (this.type === "vehicleAttack") return this._rollVehicleAoEAttack(options);

        let target = {
            units: game.scenes.current.grid.units,
            distance: 0,
            accur: 0
        };

        /*****************************************
         * Deal with Modifiers - This is SFRPG but can modify for items that at step bonus's
         *****************************************/

        /*****************************************
         * Deal with Define Critical threshold  - This is needs to incorporate things like "Unlucky" and "Lucky" 
         *****************************************/
        let crit = 1;
        /*****************************************
         * Deal with Skill 
         *****************************************/
        itemData.hasDamage = this.hasDamage;
        //itemData.hasCapacity = this.hasCapacity();
        itemData.hasdefence = this.hasdefence;
        itemData.hasAttack = this.hasAttack;
        rollData.item = itemData;

        console.log("rollData", rollData, actorData)
        let weaponskill = rollData.item.skill;
        const isSkill = !(["starship"].includes(actorData.type));
        const isStarshipweapon = (["starship"].includes(actorData.type));

        var skl = {};
        var skl2 = {};

        if (isSkill) { // Get the skill object of the Character shooter Starship weapon skills are selected after selecting crew
            skl = rollData.skills[weaponskill];
            skl2 = weaponskill;
        }
        if (!isSkill) skl2 = weaponskill;

        /* --------------------------------------------
        //   Automatic weapon attack modes  AWAMode  ????     
        ****/
        let title = ""
        if (isSkill) title = skl.label + " (" + itemData.fireMode + ") | " + item.name;
        else { title = itemData.name + " - " + itemData.fireMode + "."; }


        target.accur = parseInt(itemData.accur)

        const rollContext = new RollContext();
        rollContext.addContext("owner", this.actor);
        rollContext.addContext("item", this, itemData);
        rollContext.setMainContext("owner");

        this.actor?.setupRollContexts(rollContext);
        let targetflavor = " Targets:("
        const props = ["something", "2.jghf"];
        let options2 = { event: null, skipDialog: false, staticRoll: null, chatMessage: true, noSound: false, dice: "1d20" }
        return Diced100.attackAoE({
            /// Remember to stick the Variable you want available here



            parts: parts,
            //data: this.actor.data,
            //stepbonus: 1,
            //useMeasureTemplate = this.hasTemplate && game.settings.get("pf1", "placeMeasureTemplateOnQuickRolls"),

            useMeasureTemplate: true,
            rollType: "rollAttack",
            rollSkill: weaponskill,
            rollContext: rollContext,
            //title: title,
            flavor: this.system?.chatFlavor,
            stepflavor: "",
            targetflavor: targetflavor,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: crit,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null

            },
            onClose: this._onAttackRollClose.bind(this, options),
            actor: this.actor,
            item: this,
            target: target,
            targets: null, //targettedTokenData,
            targetData: targetData,
            numberOfAttacks: 1,
            event: options.event,
            fastForward: options.skipDialog === true,
            staticRoll: options.staticRoll,
            //parts,
            stepbonus: parseInt(skl.step),
            ordinary: skl.base,
            good: skl.good,
            amazing: skl.amazing,
            dice: options.dice,
            data: rollData,
            subject: { skill: weaponskill },
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            //chatTemplate: "systems/Alternityd100/templates/chat/attack-roll2.hbs",
            chatTemplate: "systems/Alternityd100/templates/chat/attack-roll.hbs",
            //chatTemplate: "systems/Alternityd100/templates/chat/roll-ext.hbs",
            template: "systems/Alternityd100/templates/dialogs/attack-dialog.hbs",
            chatTemplateData: { hasProperties: props.length > 0, properties: props },
            chatMessage: options2.chatMessage,
            noSound: options2.noSound,
            compendiumEntry: null,
            isStarshipweapon: isStarshipweapon,
            skl: skl,
            actorToken: actorToken


        });


    }
    /*****************************************
    * rollNormalAttack 
    *****************************************/
    async rollNormalAttack(options = {}) {
        const item = this;
        const itemData = this.system;
        const isWeapon = ["weapon", "shield"].includes(this.type);
        const actorData = this.actor.system;
        const actorArray = this.actor.getActiveTokens(true, true);
        let actorToken = actorArray[0]

        console.log("Options", options, this, actorArray);
        if (!actorToken) {
            const tokens = game.canvas.activeLayer.controlled.filter(t => t.inCombat);


            actorToken = tokens[0].document
        }

        console.log("Options", options, this, actorToken);
        if (!actorToken) NoTokenWarn()

        if (!this.hasAttack) {
            throw new Error("You may not place an Attack Roll with this Item.");
        }


        if (this.type === "vehicleAttack") return this._rollVehicleAttack(options);

        /* -------------------------------------------- */
        // This finds the active targets and stores the data - Should make this a function to destroy the temp variables.
        /* -------------------------------------------- */



        let numberOfActiveTargets = 0 || Math.min(game.user.targets.ids.length, 3)
        let target = null;
        let targetData = [];
        let targettedActor = [];
        let targettedToken = [];
        let targettedTokenData = [];
        console.log(numberOfActiveTargets)
        if (numberOfActiveTargets == 0) {
            targetData[0] = { Name: "No Target", token: {} }
            //targetData[0].Name = "No Target"
            targetData[0].units = game.scenes.current.grid.units
            targetData[0].distance = 0
            targetData[0].dmgtype = { ord: "", goo: "", ama: "" };
            //rgetData[0].token = {}
            console.log(targetData, targetData[0].Name)
        }



        for (let x = 0; x < numberOfActiveTargets; x++) {

            target = findTokenById(game.user.targets.ids[x]);
            targettedToken[x] = target
            targettedTokenData[x] = target.document
            targettedActor[x] = game.actors.get(target.document.actorId);
            targetData[x] = {};
            targetData[x].Name = target.name;
            console.log("targetData[x].Name", targetData[x].Name);
            //targetData[x].distance = Math.ceil(Math.round(canvas.grid.measureDistance({x: actorToken.x, y: actorToken.y}, {x: target.x, y: target.y}),2));
            let tempdistx = canvas.grid.measureDistance({ x: actorToken.x, y: actorToken.y }, { x: target.x, y: target.y })
            let tempdisty = actorToken.elevation - target.document.elevation
            const tempdistxy = ((tempdistx ** 2) + (tempdisty ** 2)) ** 0.5


            console.log("Dist", tempdistx, tempdisty, tempdistx ** 2, tempdisty ** 2)
            console.log("Range", tempdistxy)
            let tempdist = tempdistxy.toFixed(1)
            console.log("Range", tempdist)
            tempdist = Math.ceil(tempdist)
            // console.log("Range",tempdist)
            //console.log("Range",Math.ceil(Math.round(canvas.grid.measureDistance({x: actorToken.x, y: actorToken.y}, {x: target.x, y: target.y})),1) )
            targetData[x].distance = tempdist
            targetData[x].aspect = this.findHitLocation(actorToken, target.document)
            targetData[x].units = game.scenes.current.grid.units
            targetData[x].resMod = {}; // Fill the resistance modifier array
            if (["character", "npc"].includes(target.actor.system.type)) {
                targetData[x].resMod.dex = target.actor.system.abilities.dex.resModValue;
                targetData[x].resMod.str = target.actor.system.abilities.str.resModValue;
                targetData[x].resMod.con = target.actor.system.abilities.con.resModValue;
                targetData[x].resMod.int = target.actor.system.abilities.int.resModValue;
                targetData[x].resMod.wil = target.actor.system.abilities.wil.resModValue;
                targetData[x].resMod.per = target.actor.system.abilities.per.resModValue;
            }
            targetData[x].token = targettedTokenData[x]
            targetData[x].dmgtype = { ord: "", goo: "", ama: "" };
            targetData[x]._id = targettedToken[x].id

            console.log("targetData", targetData[0], targetData, targetData.length);
        }

        let targetflavor = " Targets:(" + numberOfActiveTargets + ") "
        console.log(targetData, targetData[0].Name)

        /*****************************************
         * Spin off for Starship Launchers
         *****************************************/
        if (this.type === "starshipWeapon") {
            if (this.isLauncher) return rollStarshipLauncherAttack(this, options, targetData, actorToken);
            else {
                //return this._rollStarshipAttack(options);
            }
        }


        const parts = [];

        /*****************************************
         * Deal with Modifiers - This is SFRPG but can modify for items that at step bonus's
         *****************************************/

        let acceptedModifiers = [SFRPGEffectType.ALL_ATTACKS];
        if (["msak", "rsak"].includes(this.system.actionType)) {
            acceptedModifiers.push(SFRPGEffectType.SPELL_ATTACKS);
        } else if (this.system.actionType === "rwak") {
            acceptedModifiers.push(SFRPGEffectType.RANGED_ATTACKS);
        } else if (this.system.actionType === "mwak") {
            acceptedModifiers.push(SFRPGEffectType.MELEE_ATTACKS);
        }

        if (isWeapon) {
            acceptedModifiers.push(SFRPGEffectType.WEAPON_ATTACKS);
            acceptedModifiers.push(SFRPGEffectType.WEAPON_PROPERTY_ATTACKS);
        }

        let modifiers = this.actor.getAllModifiers();
        modifiers = modifiers.filter(mod => {
            if (mod.effectType === SFRPGEffectType.WEAPON_ATTACKS) {
                if (mod.valueAffected !== this.system.weaponType) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_ATTACKS) {
                if (!this.system.properties[mod.valueAffected]) {
                    return false;
                }
            }
            return (mod.enabled || mod.modifierType === "formula") && acceptedModifiers.includes(mod.effectType);
        });

        let stackModifiers = new StackModifiers();
        modifiers = stackModifiers.process(modifiers, null);

        const rolledMods = [];
        const addModifier = (bonus, parts) => {
            if (bonus.modifierType === "formula") {
                rolledMods.push(bonus);
                return;
            }
            let computedBonus = bonus.modifier;
            parts.push({ score: computedBonus, explanation: bonus.name });
            return computedBonus;
        };

        Object.entries(modifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return 0;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    addModifier(bonus, parts);
                }
            } else {
                addModifier(mod[1], parts);
            }

            return 0;
        }, 0);
        // console.log("modifiers", modifiers,stackModifiers)

        /*****************************************
         * Deal with Define Critical threshold  - This is needs to incorporate things like "Unlucky" and "Lucky" 
         *****************************************/
        // 
        let crit = 1;
        //if ( this.data.type === "weapon" ) crit = this.actor.getFlag("sfrpg", "weaponCriticalThreshold") || 20;

        // Define Roll Data
        const rollData = foundry.utils.duplicate(actorData);

        // Add hasSave to roll


        itemData.hasDamage = this.hasDamage;
        //itemData.hasCapacity = this.hasCapacity();
        itemData.hasdefence = this.hasdefence;
        itemData.hasAttack = this.hasAttack;
        rollData.item = itemData;

        console.log("rollData", rollData, actorData,itemData)
        let weaponskill = rollData.item.skill;
        const isSkill = !(["starship"].includes(actorData.type));
        const isStarshipweapon = (["starship"].includes(actorData.type));

        var skl = {};
        var skl2 = {};

        if (isSkill) { // Get the skill object of the Character shooter Starship weapon skills are selected after selecting crew
           
           if (itemData.type == "psionic") {
            skl = itemData
            skl2 = itemData.name
            itemData.base = Math.floor((actorData.abilities[itemData.ability]?.value + itemData.rank))  ; 
            itemData.good =  Math.floor(itemData.base/2) ; 
            itemData.amazing =  Math.max(1,Math.floor(itemData.base/4)) 

           }
           if (!(itemData.type == "psionic")) {
            skl = rollData.skills[weaponskill]
            skl2 = weaponskill
           }
        }
        if (!isSkill) { // Get the skill object of the Character shooter Starship weapon skills are selected after selecting crew
            // skl = rollData.skills[weaponskill]
            skl2 = "weapo"
        }
        console.log("itemData.skill", skl)
        let title = ""
        if (isSkill) title = /*game.settings.get('Alternityd100', 'useCustomChatCards') ? skill : */skl.label + " (" + itemData.fireMode + ") | " + item.name;
        else {
            title = /*game.settings.get('Alternityd100', 'useCustomChatCards') ? skill :*/ itemData.name + " - " + itemData.fireMode + ".";

            console.log("itemData.skill", itemData.skill, weaponskill)

        }
        //let rangecat = ""

        /* --------------------------------------------
        //   Automatic weapon attack modes  AWAMode
        
        ** For Automatic 4th shot should attack first selected target
        ** Includes Pistol Double Tap PHB 75
                 -------------------------------------------- */
        let AWAModeMod = [0]
        console.log(targetData, targetData[0].Name)
        if (["dtap"].includes(itemData.fireMode) && ["pisto", "sling", "bow"].includes(skl2)) { //  Pistol  Bow and sling Double Tap PHB 75

            if (skl.ranks > 5) {
                AWAModeMod = [1, 2];
                if (numberOfActiveTargets == 1) {
                    numberOfActiveTargets = 2;
                }
                targetData[1] = targetData[0].duplicate // This makes sure that dtap is not used on 2 different targets
            }
        }
        if (["burst"].includes(itemData.fireMode)) AWAModeMod = [-1];
        if (["auto"].includes(itemData.fireMode)) {
            AWAModeMod = [1, 2, 3];// default for auto fire
            if (["smg"].includes(skl2)) {
                if (skl.ranks > 5) AWAModeMod = [0, 1, 2];
                if (skl.ranks > 8) AWAModeMod = [0, 1, 2, 3];
            }
        }
        /* -------------------------------------------- */
        // work out haw many targets vs shots
        /* -------------------------------------------- */
        const numberOfAttacks = AWAModeMod.length
        for (let a = 0; a < (numberOfActiveTargets - numberOfAttacks); a++) {

            targetData.pop()
        }

        // Fill the Target array with targetData[0] duplicates
        for (let a = 0; a < (numberOfAttacks - numberOfActiveTargets); a++) {


            targetData[a + numberOfActiveTargets] = Object.assign({}, targetData[0])

            //targetData[a + numberOfActiveTargets] = {Name: targetData[0]?.Name }
            //targetData[a + numberOfActiveTargets].token = targetData[0]?.token;
            //targetData[a + numberOfActiveTargets]._id = targetData[0]?._id;
            //targetData[a + numberOfActiveTargets].Name = targetData[0].Name
            //targetData[a + numberOfActiveTargets].resMod = targetData[0]?.resMod;
            //targetData[a + numberOfActiveTargets].distance = targetData[0]?.distance
        }
        numberOfActiveTargets = targetData.length

        for (let targetedToken of targetData) {

            /* -------------------------------------------- */
            // SIT MODS */
            /* -------------------------------------------- */
            console.log("targetedToken", targetedToken, targetData)
            /*********************
             *   1 Base Skill- 
             ********************/
            //Not a modifier itself, but a vital first step in determining the bonus or penalty in any situation. Every broad skill check and every feat check has a base situation die of +d4, The base situ- ation die for specialty skill checks is +d0, Some profession benefits can improve these base situation dice.

            targetedToken.skillStep = skl.step;
            /*************************************
             * 2, Opponent's resistance modifier - 
             **********************************/
            //When a hero employs a skill against an opponent the opponent's resistance modifier may have to be considered. Table P10: SKILLS & RESISTANCE Modifiers, on the facing page, lists the skills that cause resistance modifiers to come into play.
            if (targetedToken.Name == "No Target") ui.notifications.error("No Target Selected");

            if (!isStarshipweapon) {
                if (targetedToken.token) targetedToken.resPenalty = targetResModData(skl, targetedToken.resMod);
                else targetedToken.resPenalty = 0

            }
            if (isStarshipweapon) {

                targetedToken.resPenalty = -2
                //token.actor.system.attributes.resistance

                const targetResistance = targetedToken.token.actor.system.attributes.resistance
                console.log("targettedToken", targetedToken, targetResistance, itemData.weaponType)
                targetedToken.resPenalty = targetResistance[itemData.weaponType] + targetResistance.base

                //targettedToken
                console.log("targetResModData", targetedToken.resPenalty, targetResistance[itemData.weaponType], targetResistance.base);
            }

            console.log(skl);




            /*********************
             * 3. range modifiers
             ********************/

            /*Table P14; Throw Situation Modifiers on page 57 in this chapter: 
            Table P14: Throw Situ a hum Modifiers
            Type of Object          Short       Medium      Long
            Designed far throwing   -1 step     +1 step     +2 steps
            Not for throwing        +1 step     +2 steps    +3 steps
            Heavy                   +4 steps    -           -
            */


            /*            
            Table P21: Heavy Weapons Range Modifiers on page 68 in Chapter 4: Skills; and 
            Table PHI: Heavy Weapons Range Modifiers
            Range   Direct      Indirect 
            Short   -1 step     +5 
            Medium  None        -2 steps 
            Long    +1 step     None
            
            
            Table P22: Range Modifiers by Weapon Type on page 73 in Chapter 4; Skills.
            Table P22 Range Modifiers by Weapon Type
            Weapon          Short       Medium      Long
            Primitive*      -1 step      +1 step     +3 steps
            Pistol          -1 step     +1 step     +3 steps
            Rifle           -1 step     None        +l step
            Submachine gun  -1 step     +1 step     +3 steps
            * Bow, crossbow, sling only; flintlocks use figures for pistol or riffe, as appropriate
                    
                        
                    */

            targetedToken.rangecat = getRangeCat(targetedToken, item)




            /* -------------------------------------------- 
            * 4. Ranged Weapon Rank Benefits PHB75.
             -------------------------------------------- */

            //This benefit comes into play when the hero achieves rank 3 in any of the Primitive Ranged Weapons specialties (bow, crossbow, /Jin t lock, or Hing), or in Modern Ranged Weapons-rf/le. 
            let distancePrecision = 0
            if ([34].includes(skl.broadid) || ["rifle"].includes(skl2)) {
                if (skl.ranks > 2 && (targetedToken.rangecat == "medium")) targetedToken.rangecat = "short";
                if (skl.ranks > 2 && (targetedToken.rangecat == "long")) distancePrecision = -1;

            }

            //It also applies for a hero who has achieved rank 5 in Modem Ranged Weapons-pistoJ.    
            if (["pisto"].includes(skl2)) {
                if (skl.ranks > 4 && (targetedToken.rangecat == "medium")) targetedToken.rangecat = "short";
                if (skl.ranks > 4 && (targetedToken.rangecat == "long")) distancePrecision = -1;

            }
            console.log(isSkill, skl)
            if (isSkill && (!(skl.type == "psionic"))) targetedToken.rangemod = attackModData(rollData.item.weaponType, skl2, targetedToken.rangecat);
            if (isSkill && (skl.type == "psionic")) targetedToken.rangemod = skl.rangeMod[targetedToken.rangecat];
            if (!isSkill) targetedToken.rangemod = 0;

            targetedToken.rangemod += distancePrecision
            /*******************
             * *5  Cover Modifier  - This needs work to fix / implement the conditions on the token / character
             ********************/
            /*
            If an opponent in a combat scene uses cover to protect himself from a ranged attack, a modifier is assigned to the hero's situation die. There are three types of cover, each with its own modifier;
            Light cover (*1 step penalty to opponent) refers to either the type of material the target is hiding behind (sometargetedToken without much stopping power, such as bushes, light-weight doors, garbage cans) or how much ol the target is exposed (half of the target's body or more).
            Medium cover (+2 step penalty) indicates that the target is hiding behind material with good stopping power (heavy wood, brick, or mid- weight metal) or that less than one quarter of the target is exposed.
            Heavy cover f+3 step penalty) indicates that the target is hiding behind almost impenetrable material (steel or some other heavy metal, a bulkhead or vault door, or a solid stone wail) or that the target is almost completely hidden from view,
            */
            targetedToken.covermod = 0
            if (targetedToken.token.actor.system.conditions.coverlight) targetedToken.covermod = 1;
            if (targetedToken.token.actor.system.conditions.covermedium) targetedToken.covermod = 2;
            if (targetedToken.token.actor.system.conditions.coverheavy) targetedToken.covermod = 3;
           
            //const status = targetedToken.token.statusEffects.find(element=> element.id = dead)
            //if (status,isActive) targetedToken.covermod = 1 

            /**********************
             * 6   Dodge Modifier
             *********************/
            targetedToken.dodgemod = 0
            if (targetedToken.token.actor.system.conditions.dodgecri) targetedToken.dodgemod = -2;
            if (targetedToken.token.actor.system.conditions.dodgeord) targetedToken.dodgemod = 1;
            if (targetedToken.token.actor.system.conditions.dodgegoo) targetedToken.dodgemod = 2;
            if (targetedToken.token.actor.system.conditions.dodgeama) targetedToken.dodgemod = 3;


            console.log(targetedToken)
            /* If he doesn l have a chance to get behind some cover, an opponent in a combat scene can declare that he J s dodging to make it more difficult for a hero to hit him. A dodge can be used against any attack, but it most often comes into play against ranged attacks, De pending on the success oi an Acrobatics-dodge skill check, the hero receives a +1, +2. or +3 penalty to his attack. De pending on the success oi an Acrobatics-dodge skill check, the hero re- ceives a +1, +2. or +3 penalty to his attack.
            /*************************
             * 7   Skill Situation
             ************************/

            /*The use of a skill in certain conditions can provide either a bonus or a penalty to the situation die. Several of the skill descriptions in Chapter 4: Skills contain lists oi situation modifiers that should be considered when a hero tries to use the skill. situation modifiers that should be considered when a hero tries to use the skill.
            
            
            /***
             *        8 GM Situation
             **/

            /* Gamemaster can decide that this is an Easy situation and award the hero a -1 step bonus. On the other hand, a hero might be atop a speeding train, trying to keep his bal- ance while taking a shot. The Gamemaster can decide that this is a Hard situation and assign the hero a +2 step penalty. The Gamemaster won't always as- sign additional modifiers based on the situation, but he or she has that option if the scene demands it. For example, if a hero is firing from high ground at surprised opponents in the open, the Gamemaster can decide that this is an Easy situation and award the hero a -1 step bonus. On the other hand, a hero might be atop a speeding train, trying to keep his bal- ance while taking a shot. The Gamemaster can decide that this is a Hard situation and assign the hero a +2 step penalty.
            
            /***
             * 
             * 9-Combat Movement Effects
             * 
             *  */

            /*        Table P11: Combat Movement Effects
                    Type of Rest r a ctians
                    Move & Penalties
                    All-out: No actions
                    Sprint +3 steps
                    Run  +2 steps
                    Walk No penalty
                    Easy Swim +2 steps
                    Swim  No actions
                    Glide +1 step
                    Fly +2steps
             /****
              * 
              * 10 Table P12: ENCUMBRANCE
              * 
              *  */
            /*        
            Load    Move    Penalty
            STRX2   100%    O
            STRX4   75%     +1
            STRX5   50%     +2
            STRX6   25%     +3
            
                    */
            /****
             * STARSHIP ATTACKS
             * Example: A destroyer moves into the same hex that an en- emy battleship occupies (the battleship moved earlier in the round). The commander of the destroyer declares that his ship is located in the battleship's zero-port arc. He also de- clares that the battleship is in the destroyer's forward arc of fire, since he intends to torpedo it in just a moment.
            Range
            Over the great distances of a typical space battle, energy weapons slowly disperse and the smallest inaccuracy in a projectile creates a miss of thousands of kilometers. Range is counted in hexes from the firing ship to the target not count- ing the hex the firing ship is in (that would be a range of 0).
            If you're playing with miniatures, you'll find that some miniatures actually take up two or three hexes on a map sheet. The ship itself would be microscopic if the miniature was scaled correctly to the map, so use the highest mast or tower on the miniature as the hex the ship is actually locat- ed in.
            Attack Rolls
            An attack roll is a normal crew check. Like other checks, it begins at a bonus of +d0. An attack roll is modified by the following conditions:
            • Weapon base accuracy
            • Target size modifier
            • Range modifier
            • Fire control modifier
            • Target defences
            • Fixed mount penalty (+3 steps if not on direct line)
            Weapon accuracy is a property of the weapon itself. Record it on your ship record sheet under the weapon de- scription.
            Target size modifier is a characteristic of the ship, noted on your ship record sheet. Small ships are harder to hit than big ships.
            Missiles have a +4 step target size modifier.
            Range modifier depends on the weapon's range character- istics. A weapon may have a range of 2/4/8 hexes, indicat- ing that a shot of 0-2 hexes is Short range, 3-4 hexes is Medium range, and 5-8 hexes is Long range.
            Medium range attacks suffer a +1 step penalty.
            Long range attacks suffer a +2 step penalty.
            Fire control reflects the power of the attacking ship's com- puters and fire control systems. Mark it on your ship record sheet.
            Target defences account for defensive systems that make the ship harder to hit-jammers, deflection inducers, chaff, and so on These should be described on the ship record sheet of the target vessel.
            The fixed mount penalty means that a weapon housed in a fixed mount suffers a +3 step penalty to any attacks that are not along a direct line of hexes. A weapon in a fixed mount forward can fire into the forward arc, but suffers a
             + 3 step penalty to the attack roll unless the target is direct- ly ahead
            
            
            */




        }   // End Of for (let[key6,targetedToken] of Object.entries(targetData)){  console.log("stats",key6,targetedToken,targetedToken)

        //console.log("targetData=",targetData)

        // const targetflavor =" Target(s): "+targetData[0].Name
        //console.log("rollData",rollData,"itemData" , itemData, title, itemData.name)
        //Warn the user if there is no ammo left
        //title +="- ";
        const usage = itemData.usage?.value || 0;
        const availableCapacity = this.getCurrentCapacity();
        if (availableCapacity < usage) {
            ui.notifications.warn(game.i18n.format("SFRPG.ItemNoUses", { name: this.data.name }));
        }
        //console.log("---This5",this.system.actionType)
        const rollContext = new RollContext();
        rollContext.addContext("owner", this.actor);
        rollContext.addContext("item", this, itemData);
        rollContext.setMainContext("owner");

        this.actor?.setupRollContexts(rollContext);

        /** Create additional modifiers. */
        const additionalModifiers = [
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Character.Charge"), modifier: "-2", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Character.Flanking"), modifier: "+2", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Character.FightDefensively"), modifier: "-4", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Character.FullAttack"), modifier: "-4", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Character.HarryingFire"), modifier: "+2", enabled: false, notes: game.i18n.format("SFRPG.Rolls.Character.HarryingFireTooltip") } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Character.Nonlethal"), modifier: "-4", enabled: false } }
        ];

        /** Apply bonus rolled mods from relevant attack roll formula modifiers. */
        for (const rolledMod of rolledMods) {
            additionalModifiers.push({
                bonus: rolledMod
            });
        }

        rollContext.addContext("additional", { name: "additional" }, { modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
        parts.push("@additional.modifiers.bonus");
        //console.log("---This6",this.system.actionType)





        const props = ["something", "2.jghf"];
        let options2 = { event: null, skipDialog: false, staticRoll: null, chatMessage: true, noSound: false, dice: "1d20" }

        //Prelim method for attack base skill + Target resistance Penalty + Range + Accuracy 

        for (let a = 0; a < numberOfAttacks; a++) {
            targetData[a].AWAModeMod = AWAModeMod[a]
            targetData[a].attackbonus = targetData[a].AWAModeMod
            targetData[a].accur = parseInt(itemData.accur||0)


        }

        return Diced100.attackRoll({
            /// Remember to stick the Variable you want available here



            parts: parts,
            //data: this.actor.data,
            //stepbonus: 1,
            //useMeasureTemplate = this.hasTemplate && game.settings.get("pf1", "placeMeasureTemplateOnQuickRolls"),

            useMeasureTemplate: true,
            rollType: "rollAttack",
            rollSkill: weaponskill,
            rollContext: rollContext,
            //title: title,
            flavor: this.system?.chatFlavor,
            stepflavor: "",
            targetflavor: targetflavor,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: crit,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null

            },
            onClose: this._onAttackRollClose.bind(this, options),
            actor: this.actor,
            item: this,
            targets: targettedTokenData,
            targetData: targetData,
            numberOfAttacks: numberOfAttacks,
            event: options.event,
            fastForward: options.skipDialog === true,
            staticRoll: options.staticRoll,
            //parts,
            stepbonus: parseInt(skl.step),
            ordinary: skl.base,
            good: skl.good,
            amazing: skl.amazing,
            dice: options.dice,
            data: rollData,
            subject: { skill: weaponskill },
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            //chatTemplate: "systems/Alternityd100/templates/chat/attack-roll2.hbs",
            chatTemplate: "systems/Alternityd100/templates/chat/attack-roll.hbs",
            //chatTemplate: "systems/Alternityd100/templates/chat/roll-ext.hbs",
            template: "systems/Alternityd100/templates/dialogs/attack-dialog.hbs",
            chatTemplateData: { hasProperties: props.length > 0, properties: props },
            chatMessage: options2.chatMessage,
            noSound: options2.noSound,
            compendiumEntry: null,
            isStarshipweapon: isStarshipweapon,
            skl: skl,
            actorToken: actorToken


        });

    }

    /*****************************************
    * rollNormalAttack 
    *****************************************/
    async rollScan(options = {}) {
        const skillId = "senso"
        const item = this;
        const itemData = this.system;
        const isSensor = ["starshipSensor", "Blank"].includes(this.type);
        const actor = this.actor;
        const actorData = actor.system;
        const npcCrew = actorData.crew.useNPCCrew
        const npcCrewQuality = npcCrew ? actorData.crew.npcCrewQuality : ""
        const npcSkill = d100NPCCrewStats(npcCrewQuality)
        const userTargets = game.user.targets.ids


        const sensorOperator = npcCrew ? actor : actorData.crew.sensors.actors[0]
        const actorArray = await this.actor.getActiveTokens();//true, true);
        const actorToken = actorArray[0]
        let maxRange = 0
        //let targetData = []
        let scanAll = options.scanAll || false
        //console.log(scanAll)
        scanAll = true
        //delete 
        //actor.system.scanTargets = []
        //target = findTokenById(game.user.targets.ids[x]);


        // allsensors = all powered sensors    
        const allsensors = actor.items.filter(x => {
            if (x.hasScan && x.system.isPowered) {
                maxRange = Math.max(x.system.range.long, maxRange)
                return true
            }
            return false
        })

        if (!actorToken) NoTokenWarn()

        if (!this.hasScan) {
            throw new Error("You may not scan with this Item.");
        }

        const targetTokens = game.scenes.viewed.tokens.filter(x => {

            return true

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
                        delete target.token
                        target.token = { name: token.name, id: token.id, x: token.object.center.x, y: token.object.center.y }
                        target.size = token.actor.system.frame?.system.size || "tiny",
                            target.scanRes = token.actor.system.attributes.ECM,


                            validScanTargets.push(target)
                        newscan = false
                        //     console.log(target)
                    }
                })
                if (newscan) {
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


            /****
             * 
             * Scan All contacts to get turn them into Targets
             * 
             *  */

            //scan.sensors = new Set(),
            //let fumble = 20
            let fumble = npcCrew ? 20 : sensorOperator.system.attributes.fumble

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
                //console.log("\nScan",scan.aquired ,scan.sensors.length)

                /*
                PHB 89
                A sensors specialist can operate all shipboard and personal sensor gear with precision, attempt to scan ships or planets, and analyze those readings in a short period of time. He can use- the data to provide bonuses to a weapons or Defences operator,
                
                
                Each ship may attempt one sensor check per sensor per enemy ship in range. For instance, if a destroyer has three sensor systems and there are two contacts in range, the player controlling the destroyer rolls three checks against each target-one for each sensor system. The following modifiers apply:
                 Condition Modifier
                 Long range +3 steps
                 Medium range +1 step
                 Short range +0
                 Range 1 hex or less -3 steps 
                 Contact size by ship
                 Contact fired in preceding round -3 steps 
                 
                 Table G47: DMG
                Space Detection Modifiers
                
                Obscurity   Modifier
                Critical    +3
                Marginal    none
                Ordinary    -1
                Good        -2
                Amazing     -3
                
                 Many sensors have specific advantages or disadvantages. For example, ships equipped with 
                 EM detectors gain a -2 step bonus to sensor checks against contacts that are using active radar systems.
                
                 The detecting ship is reduced to 0 stun, wound, mortal, or compartment points;
                • The detecting ship suffers a hit that knocks out the sensor used to acquire the target;
                • The target moves into a sensor shadow of the detecting ship.
                • The detecting ship fails to provide power to the sensor used to acquire the target.
                • The target moves beyond the sensor's maximum range. (arc?)
                
                The primary function of the sensors officer in com ha ( is to analyze the enemy ship with a successful System Operation-censors skill check, identifying the function of each ol (he enemy ship's compartments.
                There are two ways in which sensors can assist an attack. By spendmg an action, the sensors operator can improve the odds of a successful hit. The sensors operator's skill check may provide a modifier to the weapons operator in the next available phase. 
                Critical Failure, +2 penalty: Failure, no modi her; Ordinary 1 bonus; Good, - 2 bonus; Amazing,-3 bonus.
                
                Second, the sensors operator can spend an action attempting to target a specific compartment of an enemy vessel, To do this, the sensors operator must have an action in tbs same phase in which a successful shot is fired. If the weapons officer generates a hit, the sensors operator then rolls a System Operation -sensors check. The result allows the sensor operator to adjust the random hit determination of compartments (see ' Damage." below): 
                Critical Failure, weapon shot misses target completely; Failure, no modifier; 
                Ordinary, adjust d20 compartment roll by +l. Good, adjust roll by +2; Amazing, adjust roll by +3.
                */


                let scanSkill = npcCrew ? npcSkill.skills[skillId] : sensorOperator.system.skills[skillId]

                if (!scan.aquired) {

                    for (let sensor of scan.sensors) {
                        //console.log(sensor,itemData)
                        const sensorData = allsensors.find(item => item.id === sensor.id)

                        //console.log(sensorData,allsensors,scan)
                        // Range Steps
                        let rangesteps = 0

                        if (scan.range < sensorData.system.range.long) rangesteps = 3
                        if (scan.range < sensorData.system.range.medium) rangesteps = 1
                        if (scan.range < sensorData.system.range.short) rangesteps = 0
                        if (scan.range < 1) rangesteps = -3

                        // Target Resistance

                        const targetRes = scan.scanRes[sensorData.system.sensorType].value

                        // Add it all up
                        let stepbonus = scanSkill.step + rangesteps - targetRes
                        console.log(scanSkill.step, rangesteps, targetRes, scan)
                        // Build the tooltip
                        let skillflavor = "Skill: " + "System Operation - Sensors"
                        skillflavor += "<br>Skill Step: " + scanSkill.step
                        skillflavor += "<br>Situation: "
                        skillflavor += "<br>Accuracy: "
                        skillflavor += "<br>Fire Mode: "
                        skillflavor += "<br>Movement: "
                        skillflavor += "<br>Range Mod: " + rangesteps
                        skillflavor += "<br>Scan Resistance: " + (0 - targetRes)
                        skillflavor += "<br>Cover Mod: "
                        skillflavor += "<br>Dodging Mod: "
                        // console.log("Scan ",scan,sensor)
                        // console.log("\nScanRes Laser ",scan.scanRes.laser )
                        // console.log("\nScanner ",itemData.sensorType, )
                        let stepflavor = sensorData.name + " vs. " + scan.size
                        // Wait to make the roll
                        let scan1 = await sensorOperator.rollSkill(skillId, { steps: stepbonus, skillflavor: skillflavor, stepflavor: stepflavor })
                        //scan1.roll = scan1.rolls[0]    
                        scan1.sensorOperator = sensorOperator
                        scan1.skill = npcCrew ? npcSkill.skills[skillId] : sensorOperator.system.skills[skillId]
                        console.log(scan1)
                        if (scan1.roll.total > scan1.skill.base) { scan1.degree = null };
                        if (scan1.roll.total <= scan1.skill.base) { scan1.degree = "short" };
                        if (scan1.roll.total <= scan1.skill.good) { scan1.degree = "medium" };
                        if (scan1.roll.total <= scan1.skill.amazing) { scan1.degree = "long" };
                        if (scan1.roll.isFumble) { scan1.degree = null };
                        if (scan1.roll.isCrit) { scan1.degree = "long" };
                        //console.log("scan1.degree",scan1,scan1.degree)
                        if (scan1.degree) { scan.aquired = true; console.log("Aquired", sensor) }


                    }
                }
            }

            /****
             * 
             * Scan Specific Target to get Data
             * 
             *  */
            if (!scanAll) {

            }

        }
        let x = await actor.update({ "system.scanTargets": validScanTargets })
        console.log(actor, validScanTargets, x ? x : "no X")

        async function xscanResult(validScan) {


            let target = validScan

            /*
            {scan:d100token
            range:
            
            }
            
            */
            gcgcghcghc
            let scan1 = { chatmessage: await sensorOperator.rollSkill("senso") }

            scan1.roll = scan1.chatmessage.rolls

            scan1.sensorOperator = sensorOperator
            scan1.skill = sensorOperator.system.skills.senso
            if (scan1.roll.total > scan1.skill.ordinary) { scan1.degree = null };
            if (scan1.roll.total <= scan1.skill.ordinary) { scan1.degree = "short" };
            if (scan1.roll.total <= scan1.skill.good) { scan1.degree = "medium" };
            if (scan1.roll.total <= scan1.skill.amazing) { scan1.degree = "long" };
            if (scan1.roll[0].terms[0].results[0].result >= fumble) { scan1.degree = null };
            if (scan1.roll[0].terms[0].results[0].result == 1) { scan1.degree = "long" };


            console.log(target)
            return target




        }
        // console.log("\nOptions\n",options,"\nItem\n",this,"\nactor\n",actor,"\nallsensors\n",allsensors,"\ntargetTokens\n",targetTokens)//,"\nvalidTargets\n",validTargets);

        /* -------------------------------------------- */
        // This finds the active targets and stores the data - Should make this a function to destroy the temp variables.
        /* -------------------------------------------- */


    }



    /**
     * Handle updating item capacity when the attack dialog closes.
     *
     * @param {Html} html The html from the dailog
     * @param {Array} parts The parts of the roll
     * @param {Object} data The data
     * 
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     */
    _onAttackRollClose(options, roll, formula, finalFormula) {
        if (!roll) {
            return;
        }

        const itemData = foundry.utils.duplicate(this.system);
        const targets = true;
        let shotsfired = 1;
        //console.log("---ThisCLOSe1",this.system.actionType)
        if (itemData.fireMode == "dtap") { shotsfired = 2 };
        if (itemData.fireMode == "burst") { shotsfired = 3 };
        if (itemData.fireMode == "auto") { shotsfired = 9 };
        /*if (itemData.hasOwnProperty("usage") && !options.disableDeductAmmo) {
          */
        //console.log("FIRE")
        if (true) {
            const usage = itemData.usage;
            //console.log("FIRE")
            /*if (usage.per && ["round", "shot"].includes(usage.per)) {
                this.consumeCapacity(usage.value);*/
            if (true) {
                this.consumeCapacity(shotsfired);
            } else if (usage.per && ['minute'].includes(usage.per)) {
                if (game.combat) {
                    const round = game.combat.current.round || 0;
                    if (round % 10 === 1) {
                        this.consumeCapacity(usage.value);
                    }
                } else {
                    ui.notifications.info("Currently cannot deduct ammunition from weapons with a usage per minute outside of combat.");
                }
            }
        }

        Hooks.callAll("attackRolled", { actor: this.actor, item: this, roll: roll, formula: { base: formula, final: finalFormula }, rollMetadata: options?.rollMetadata });
        // console.log("---ThisCLOSe2",this.system.actionType)
        const rollDamageWithAttack = game.settings.get("Alternityd100", "rollDamageWithAttack");
        if (rollDamageWithAttack && !options.disableDamageAfterAttack) {
            this.rollDamage({});
        }
    }




    /**
     * Attack Rolls
    *An attack roll is a normal crew check. Like other checks, it begins at a bonus of +d0. An attack roll is modified by the following conditions:
    • Weapon base accuracy
    • Target size modifier
    • Range modifier
    • Fire control modifier
    • Target defences
    • Fixed mount penalty (+3 steps if not on direct line)
     * 
     * Place an attack roll for a starship using an item.
     * @param {Object} options Options to pass to the attack roll
     * 
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     */
    async _rollStarshipAttack(options = {}) {
        //console.log("_rollStarshipAttack")
        const parts = ["max(@gunner.attributes.baseAttackBonus.value, @gunner.skills.pil.ranks)", "@gunner.abilities.dex.mod"];

        const title = game.settings.get('Alternityd100', 'useCustomChatCards') ? game.i18n.format("SFRPG.Rolls.AttackRoll") : game.i18n.format("SFRPG.Rolls.AttackRollFull", { name: this.name });

        if (this.hasCapacity) {
            if (this.getCurrentCapacity() <= 0) {
                ui.notifications.warn(game.i18n.format("SFRPG.StarshipSheet.Weapons.NoCapacity"));
                return false;
            }
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this.system);
        rollContext.addContext("weapon", this, this.system);
        rollContext.addContext("skill", "weapo");
        rollContext.setMainContext("");

        this.actor?.setupRollContexts(rollContext, ["gunner"]);

        /** Create additional modifiers. */
        const additionalModifiers = [
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.ComputerBonus"), modifier: "@ship.attributes.computer.value", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.CaptainDemand"), modifier: "4", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.CaptainEncouragement"), modifier: "2", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.ScienceOfficerLockOn"), modifier: "2", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.SnapShot"), modifier: "-2", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.FireAtWill"), modifier: "-4", enabled: false } },
            { bonus: { name: game.i18n.format("SFRPG.Rolls.Starship.Broadside"), modifier: "-2", enabled: false } }
        ];
        rollContext.addContext("additional", { name: "additional" }, { modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
        parts.push("@additional.modifiers.bonus");



        console.log("\n****************Data to Diced100.attackRoll***************\n",
            "event", options.event,
            "parts", parts,
            "rollContext", rollContext,
            "title", title,
            "speaker", ChatMessage.getSpeaker({ actor: this.actor }),

            "dialogOptions", options


        )

        return await Diced100.attackRoll({
            event: options.event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: 20,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            },
            onClose: (roll, formula, finalFormula) => {
                if (roll) {
                    const rollDamageWithAttack = game.settings.get("Alternityd100", "rollDamageWithAttack");
                    if (rollDamageWithAttack && !options.disableDamageAfterAttack) {
                        this.rollDamage({});
                    }

                    if (this.hasCapacity() && !options.disableDeductAmmo) {
                        this.consumeCapacity(1);
                    }

                    Hooks.callAll("attackRolled", { actor: this.actor, item: this, roll: roll, formula: { base: formula, final: finalFormula }, rollMetadata: options?.rollMetadata });
                }
            }
        });

        /*
        
        return Diced100.attackRoll({
            /// Remember to stick the Variable you want available here
        
        
        
            parts: parts,
            //data: this.actor.data,
            //stepbonus: 1,
            
            rollType: "rollAttack",
            //rollSkill: "weapo",
            rollContext: rollContext,
            //title: title,
            flavor: this.system?.chatFlavor,
            stepflavor:"",
            targetflavor: targetflavor,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: crit,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
              
            },
            onClose: this._onAttackRollClose.bind(this, options),
            actor: this.actor, 
            item: this, 
            targets: targettedTokenData,
            targetData: targetData,
            numberOfAttacks: numberOfAttacks,
            event: options.event,
            fastForward: options.skipDialog === true,
            staticRoll: options.staticRoll,
            //parts,
            stepbonus: attackbonus,
            ordinary: skl.base,
            good: skl.good,
            amazing: skl.amazing,
            dice: options.dice,
            data: rollData,
            subject: { skill: weaponskill },
            title: title ,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            //chatTemplate: "systems/Alternityd100/templates/chat/attack-roll2.hbs",
            chatTemplate: "systems/Alternityd100/templates/chat/attack-roll.hbs",
            //chatTemplate: "systems/Alternityd100/templates/chat/roll-ext.hbs",
            template: "systems/Alternityd100/templates/dialogs/attack-dialog.hbs",
            chatTemplateData: { hasProperties: props.length > 0, properties: props },
            chatMessage: options2.chatMessage,
            noSound: options2.noSound,
            compendiumEntry: null,
            
        
        
        });
        
        */
    }

    /**
     * Place an attack roll for a vehicle using an item.
     * @param {Object} options Options to pass to the attack roll
     */
    async _rollVehicleAttack(options = {}) {

        // TODO: Take vehicle's negative attack modifiers
        const parts = []

        const title = game.settings.get('sfrpg', 'useCustomChatCards') ? game.i18n.format("SFRPG.Rolls.AttackRoll") : game.i18n.format("SFRPG.Rolls.AttackRollFull", { name: this.name });

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this.data);
        rollContext.addContext("weapon", this, this.data);
        rollContext.setMainContext("");

        return await DiceSFRPG.attackRoll({
            event: options.event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            critical: 20,
            dialogOptions: {
                left: options.event ? options.event.clientX - 80 : null,
                top: options.event ? options.event.clientY - 80 : null
            },
            onClose: (roll, formula, finalFormula) => {
                if (roll) {
                    const rollDamageWithAttack = game.settings.get("sfrpg", "rollDamageWithAttack");
                    if (rollDamageWithAttack && !options.disableDamageAfterAttack) {
                        this.rollDamage({});
                    }

                    if (this.hasCapacity() && !options.disableDeductAmmo) {
                        this.consumeCapacity(1);
                    }

                    Hooks.callAll("attackRolled", { actor: this.actor, item: this, roll: roll, formula: { base: formula, final: finalFormula }, rollMetadata: options?.rollMetadata });
                }
            }
        });
    }

    /* -------------------------------------------- */
    /*The toughness rating of the armor, either Ordinary (O) or Good (G). (The Amazing (Af armor rating is reserved for vehicles; 
        see Chapter 12.) A weapon with an Ordinary rating has its damage degraded by one level (mortal to wound, wound to stun, 
            or stun to no damage) when used against armor with a Good rating. Armor with an Ordinary rating pro- ides the wearer 
            with no such benefit.
            In addition to being able to absorb damage, armor that's especially thick or tough protects its wearer in another way 
            — by causing the type of dam- he or she suffers to be degraded*
lore's how it works: If a character using a weapon of Ordinary fire- rer gets a successful hit against someone wearing armor with a Good Highness rating* the severity of the primary damage is degraded by one 3 — mortal damage becomes wound damage, wound damage turns and stun damage is negated. Secondary damage is calculated original damage is degraded*
Example: A character wearing a body tank (Good toughness) is tar- by an enemy wielding a quantum rifle (energy weapon* Ordinary lower)* The enemy gels an Amazing success and deals out 6 points of mortal damage* This damage is immediately degraded to 6 wounds* and then 3 points of secondary stun damage are assessed* The result of the armor roll for the body tank (2d4+2 vs, En) Is 5* meaning that only 1 point of wound damage gets through to the wearer. Also* because the charac- ter in the body tank has rank 2 in Armor Operat Lon-powered armor* he is able to shake off 1 point of the secondary damage* (See "Armor Opera- tion Hank Benefits'" on page 66 in Chapter it Skiffs*) What started out as a potentially lethal hit has ended up causing only 1 point oi wound dam- age and 2 points oi stun damage*
Nofe; When a character is struck by a weapon whose damage will de- grade against his armor* he is not subject to being knocked out as the re- sult of being bit by an Amazing success (as set forth on page 53 of Chap- ter 3; Heroes in Action)*
Some vehicles (see Chapter 12) and other objects have Amazing tough- ness ratings. Even a weapon of Good firepower has Its damage degraded against such an object, and damage done by weapons of Ordinary fire- power is degraded twice — mortal damage becomes stun damage* and wounds and stuns are Ignored.
The Gamemasfer Guide contains more Information on the toughness ratings of various objects.
    */
    /**
     * Place a damage roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the DiceSFRPG.damageRoll logic for the core implementation
     */
    async rollDamage({ event } = {}, options = {}) {
        const itemData = this.system;
        const actorData = this.actor.getRollData(); //this.actor.system;

        const isWeapon = ["weapon", "shield"].includes(this.type);
        const isHealing = this.system.actionType === "heal";

        if (!this.hasDamage) {
            throw new Error("You may not make a Damage Roll with this Item.");
        }

        if (this.type === "starshipWeapon") return this._rollStarshipDamage({ event: event });
        if (this.type === "vehicleAttack") return this._rollVehicleDamage({ event: event });

        // Determine ability score modifier
        //let abl = itemData.ability;
        //console.log(itemData);
        //if (!abl && (this.type === "spell")) abl = actorData.attributes.spellcasting || "int";
        //else if (!abl) abl = "str";
        //console.log("this.actor", this.actor,"\nitemData\n", itemData,"\noptions\n", options)
        // Define Roll parts
        /** @type {DamageParts[]} */
        const parts = itemData.damage.parts.map(part => part);
        const parts2 = parts
        //console.log("parts2", parts2);
        //parts[0]=itemData.damage.ord.dice;
        //parts[1]="1d10";


        let acceptedModifiers = [SFRPGEffectType.ALL_DAMAGE];
        if (["msak", "rsak"].includes(this.system.actionType)) {
            acceptedModifiers.push(SFRPGEffectType.SPELL_DAMAGE);
        } else if (this.system.actionType === "rwak") {
            acceptedModifiers.push(SFRPGEffectType.RANGED_DAMAGE);
        } else if (this.system.actionType === "mwak") {
            acceptedModifiers.push(SFRPGEffectType.MELEE_DAMAGE);
        }

        if (isWeapon) {
            acceptedModifiers.push(SFRPGEffectType.WEAPON_DAMAGE);
            acceptedModifiers.push(SFRPGEffectType.WEAPON_PROPERTY_DAMAGE);
        }

        let modifiers = this.actor.getAllModifiers();
        modifiers = modifiers.filter(mod => {
            if (!acceptedModifiers.includes(mod.effectType)) {
                return false;
            }

            if (mod.effectType === SFRPGEffectType.WEAPON_DAMAGE) {
                if (mod.valueAffected !== this.system.weaponType) {
                    return false;
                }
            } else if (mod.effectType === SFRPGEffectType.WEAPON_PROPERTY_DAMAGE) {
                if (!this.system.properties[mod.valueAffected]) {
                    return false;
                }
            }
            return (mod.enabled || mod.modifierType === "formula");
        });

        let stackModifiers = new StackModifiers();
        modifiers = stackModifiers.process(modifiers, null);

        const rolledMods = [];
        const addModifier = (bonus, parts) => {
            if (bonus.modifierType === "formula") {
                rolledMods.push(bonus);
                return;
            }

            //console.log(`Adding ${bonus.name} with ${bonus.modifier}`);
            let computedBonus = bonus.modifier;
            parts.push({ formula: computedBonus, explanation: bonus.name });
            return computedBonus;
        };

        Object.entries(modifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return 0;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    addModifier(bonus, parts);
                }
            } else {
                addModifier(mod[1], parts);
            }

            return 0;
        }, 0);

        // Define Roll Data
        const rollData = foundry.utils.mergeObject(duplicate(actorData), {
            item: itemData,
            //mod: actorData.abilities[abl].mod
        });

        let title = '';
        if (game.settings.get('Alternityd100', 'useCustomChatCards')) {
            if (isHealing) {
                title = game.i18n.localize("SFRPG.Rolls.HealingRoll");
            } else {
                title = game.i18n.localize("SFRPG.Rolls.DamageRoll");
            }
        } else {
            if (isHealing) {
                title = game.i18n.format("SFRPG.Rolls.HealingRollFull", { name: this.data.name });
            } else {
                title = game.i18n.format("SFRPG.Rolls.DamageRollFull", { name: this.data.name });
            }
        }

        const rollContext = new RollContext();
        rollContext.addContext("owner", this.actor, rollData);
        rollContext.addContext("item", this, itemData);
        rollContext.setMainContext("owner");

        this.actor?.setupRollContexts(rollContext);

        /** Create additional modifiers. */
        const additionalModifiers = [];
        for (const rolledMod of rolledMods) {
            additionalModifiers.push({
                bonus: rolledMod
            });
        }

        if (additionalModifiers.length > 0) {
            rollContext.addContext("additional", { name: "additional" }, { modifiers: { bonus: "n/a", rolledMods: additionalModifiers } });
            parts.push({ formula: "@additional.modifiers.bonus", explanation: game.i18n.localize("SFRPG.Rolls.Dialog.SituationalBonus") });
        }
        console.log("event\t", event,
            "\nitemData\t", itemData,
            "\nparts\t", parts,
            "\ncriticalData\t", itemData.critical,
            "\nrollContext\t", rollContext,
            "\ntitle\t", title,
            "\nflavor\t", itemData.chatFlavor,
            "\nspeaker\t", ChatMessage.getSpeaker({ actor: this.actor })
        )
        // Call the roll helper utility
        return Diced100.damageRoll({
            event: event,
            parts: parts,
            criticalData: itemData.critical,
            rollContext: rollContext,
            title: title,
            data: itemData,
            flavor: itemData.chatFlavor,
            actor: this.actor,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", { actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: { base: formula, final: finalFormula }, rollMetadata: options?.rollMetadata });
                }
            }
        });
    }

    async _rollVehicleDamage({ event } = {}, options = {}) {
        const itemData = this.system;

        if (!this.hasDamage) {
            ui.notifications.error(game.i18n.localize("SFRPG.VehicleAttackSheet.Errors.NoDamage"))
        }

        // const [parts, damageTypes] = itemData.damage.parts.reduce((acc, cur) => {
        //     if (cur.formula && cur.formula.trim() !== "") acc[0].push(cur.formula);
        //     if (cur.types) {
        //         const filteredTypes = Object.entries(cur.types).filter(type => type[1]);
        //         const obj = { types: [], operator: "" };

        //         for (const type of filteredTypes) {
        //             obj.types.push(type[0]);
        //         }

        //         if (cur.operator) obj.operator = cur.operator;

        //         acc[1].push(obj);
        //     }

        //     return acc;
        // }, [[], []]);

        const parts = itemData.damage.parts.map(part => part);

        let title = '';
        if (game.settings.get('Alternityd100', 'useCustomChatCards')) {
            title = game.i18n.localize("SFRPG.Rolls.DamageRoll");
        } else {
            title = game.i18n.format("SFRPG.Rolls.DamageRollFull", { name: this.name });
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("vehicle", this.actor);
        rollContext.addContext("item", this, this.data);
        rollContext.addContext("weapon", this, this.data);
        rollContext.setMainContext("");

        return DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                skipUI: true,
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", { actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: { base: formula, final: finalFormula }, rollMetadata: options?.rollMetadata });
                }
            }
        });
    }

    async _rollStarshipDamage({ event } = {}, options = {}) {
        const itemData = this.system;

        if (!this.hasDamage) {
            throw new Error("you may not make a Damage Roll with this item");
        }

        const parts = itemData.damage.parts.map(part => part);

        let title = '';
        if (game.settings.get('Alternityd100', 'useCustomChatCards')) {
            title = game.i18n.localize("SFRPG.Rolls.DamageRoll");
        } else {
            title = game.i18n.format("SFRPG.Rolls.DamageRollFull", { name: this.name });
        }

        /** Build the roll context */
        const rollContext = new RollContext();
        rollContext.addContext("ship", this.actor);
        rollContext.addContext("item", this, this.data);
        rollContext.addContext("weapon", this, this.data);
        rollContext.setMainContext("");

        this.actor?.setupRollContexts(rollContext, ["gunner"]);

        return DiceSFRPG.damageRoll({
            event: event,
            parts: parts,
            rollContext: rollContext,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", { actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: { base: formula, final: finalFormula }, rollMetadata: options?.rollMetadata });
                }
            }
        });
    }

    /* -------------------------------------------- */

    /**
     * Adjust a cantrip damage formula to scale it for higher level characters and monsters
     * @private
     */
    _scaleCantripDamage(parts, level, scale) {
        const add = Math.floor((level + 1) / 6);
        if (add === 0) return;
        if (scale && (scale !== parts[0])) {
            parts[0] = parts[0] + " + " + scale.replace(new RegExp(Roll.diceRgx, "g"), (match, nd, d) => `${add}d${d}`);
        } else {
            parts[0] = parts[0].replace(new RegExp(Roll.diceRgx, "g"), (match, nd, d) => `${parseInt(nd) + add}d${d}`);
        }
    }
    /**
     * Place an defence roll for armor using an item.
     * @param {event} options Options to pass to the attack roll
     * @param {item}
     * @param {actor} 
     */

    async rollBlankDefence(event, itemB, actorB) {
        const button = event.currentTarget;
        //console.log(event,button)
        const defenceData = {}

        const action = ""  //button.dataset.action;
        const type = "" //button.dataset.type;
        const value = "0" // button.dataset.value;

        const armor = actorB.itemTypes.equipment.filter(i => i.system.equipped)
        const actorData = actorB.actorData


        defenceData.value = value;
        defenceData.type = type;
        defenceData.armor = armor;
        defenceData.actor = actorB;
        defenceData.action = "applyDamage";
        defenceData.dmgtype = "stu" ///button.dataset.dmgtype;
        defenceData.firepower = "O" //button.dataset.firepower;
        //console.log("\n----tokenData-------------\n",tokenData,actorB)
        //console.log("\n----armor-------------\n",armor[0], game.items,armor)
        let item = armor[0];
        //console.log("\n----armor-------------\n",item)
        //const chatCardActor = this._getChatCardActor(card);
        //let contrActor = canvas.tokens.controlled;
        //console.log(event,item,actorB,actorData)
        /*if (!event.shiftKey) {
         defenceData.actor = actorB
         
     
         }
         else (defenceData.actor = contrActor)
         */
        //console.log("\n----event.shiftKey-------------\n",defenceData.actor);

        if (armor.length) {
            return armor[0].rollDefence({ defenceData: defenceData });
        }
        else {
            throw new Error("You have no armor!!");
            return null
        }
    }
    /* -------------------------------------------- */

    /**
     * Adjust a cantrip damage formula to scale it for higher level characters and monsters
     * @private
     */

    async rollDefence({ defenceData: defenceData }) {
        let item = this
        console.debug
        console.trace(defenceData)
        let value = defenceData.value

        console.log("----rollDefence-------------", "\n Action ", defenceData, "\n item ", item) //, "\n Value ",defenceData.value, "\n card ", "\n Actor \n ",defenceData.actor)
        //console.log("----onChatCardAction-------------",event,tokenId,sceneId,tokenData)
        //let value = defenceData.value
        const template = "systems/Alternityd100/templates/dialogs/defensive-dialog.hbs";
        let dialogData = {
            //formula: defenceData.value,
            damage: defenceData.value,
            action: defenceData.action,
            firepower: defenceData.firepower,
            dmgtype: defenceData.dmgtype,
            type: defenceData.type,
            rollMode: game.settings.get("core", "rollMode"),
            action: defenceData.action,
            rollModes: CONFIG.Dice.rollModes,
            d100A: d100A,
            defenceData: defenceData,
            //step: "0 steps Average",
            tokenData: defenceData.actor,
            //tokenId: tokenId,
            contrActor: defenceData.actor,

        };


        const html = await renderTemplate(template, dialogData);


        let d = new Dialog({
            title: "Defensive - " + defenceData.actor.name,
            template: "systems/Alternityd100/templates/chat/roll-dialog.hbs",
            content: html,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Defend",
                    callback: (html) => this.rollDefence2(dialogData, html),
                    //callback: (html) => resolve((roll = _roll(parts, staticRoll != null ? staticRoll : -1, html))),
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => console.log("Chose Two")
                }
            },
            default: "two",
            onChange: html => console.log(),
            render: html => console.log(),
            close: html => console.log(),
        });
        d.render(true);



        /*        const itemData = this.data;
                const isDefence = ["armor", "shield"].includes(this.data.type);
            
                const actorData = this.actor.system;
          //console.log(" rollDefence",actorData ,itemData);
        
                
        
                //console.log("Options",options,this.actor);
                const actorToken = this.actor._sheet.token;
                if (!this.hasAttack) {
                    throw new Error("You may not place an Attack Roll with this Item.");
                }
        
                if (this.type === "starshipWeapon") return this._rollStarshipAttack(options);
                if (this.type === "vehicleAttack") return this._rollVehicleAttack(options);
                */
    }
    /* -------------------------------------------- */

    /**
     * After the Defence dialog is "rolled", update the attack modifiers
     * 
     */
    async rollDefence2(dialogData, form) {

        dialogData.firepower = form ? form.find('[name="firepower"]').val() : 0;
        dialogData.type = form ? form.find('[name="type"]').val() : 0;
        dialogData.dmgtype = form ? form.find('[name="dmgtype"]').val() : 0;
        dialogData.damage = form ? parseInt(form.find('[name="damage"]').val()) : 0;




        // console.log("buttons: one",dialogData)


        return Diced100.d100AdefenceRoll({
            //event: event,
            data: dialogData,

            title: "title",
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            /* dialogOptions: {
                 width: 400,
                 top: event ? event.clientY - 80 : null,
                 left: window.innerWidth - 710
             },*/

            onClose: (roll, formula, finalFormula, isCritical) => {
                if (roll) {
                    Hooks.callAll("damageRolled", { actor: this.actor, item: this, roll: roll, isCritical: isCritical, formula: { base: formula, final: finalFormula }, rollMetadata: options?.rollMetadata });
                }
            }
        });




    }

    _postDefendMessage(rollData) {

        // Render the chat card template
        const templateData = {
            actor: this.actor,
            item: this,
            tokenId: this.actor.token?.id,
            action: "Defends",
            rollData: rollData

        };
        //console.log(rollData)
        const template = `systems/Alternityd100/templates/chat/item-defend-card.html`;
        const renderPromise = renderTemplate(template, templateData);
        renderPromise.then((html) => {
            // Create the chat message
            const chatData = {
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: html,
                sound: true ? CONFIG.sounds.dice : null,
            };

            ChatMessage.create(chatData, { displaySheet: false });
        });

    }



    async rollFormula(options = {}) {
        const itemData = this.system;
        const actorData = this.actor.getRollData();
        if (!itemData.formula) {
            throw new Error("This Item does not have a formula to roll!");
        }

        // Define Roll Data
        const rollContext = new RollContext();
        rollContext.addContext("item", this, itemData);
        rollContext.setMainContext("item");
        if (this.actor) {
            rollContext.addContext("owner", this.actor);
            rollContext.setMainContext("owner");
        }

        this.actor?.setupRollContexts(rollContext);

        const title = game.i18n.localize(`SFRPG.Items.Action.OtherFormula`);
        const rollResult = await DiceSFRPG.createRoll({
            rollContext: rollContext,
            rollFormula: itemData.formula,
            title: title,
            mainDie: null
        });

        if (!rollResult) return;

        const preparedRollExplanation = DiceSFRPG.formatFormula(rollResult.formula.formula);
        const content = await rollResult.roll.render({ breakdown: preparedRollExplanation });

        ChatMessage.create({
            flavor: `${title}${(itemData.chatFlavor ? " - " + itemData.chatFlavor : "")}`,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: content,
            rollMode: game.settings.get("core", "rollMode"),
            roll: rollResult.roll,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            sound: CONFIG.sounds.dice
        });
    }

    /* -------------------------------------------- */

    /**
     * Use a pharmaceutical item
     */
    async rollConsumable(options = {}) {
        const itemData = this.system;
        const labels = this.labels;
        const formula = itemData.damage ? labels.damage : itemData.formula;

        // Submit the roll to chat
        if (formula) {
            Roll.create(formula).toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `Consumes ${this.name}`
            });
        } else {
            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `Consumes ${this.name}`
            })
        }

        // Deduct consumed charges from the item
        if (itemData.uses.autoUse) {
            const quantity = itemData.quantity;
            const remainingUses = this.getRemainingUses();

            // Deduct an item quantity
            if (remainingUses <= 1 && quantity > 1) {
                this.update({
                    'quantity': Math.max(remainingUses - 1, 0),
                    'uses.value': this.getMaxUses()
                });
            }

            // Optionally destroy the item
            else if (remainingUses <= 1 && quantity <= 1 && itemData.uses.autoDestroy) {
                this.actor.deleteEmbeddedDocuments("Item", [this.id]);
            }

            // Deduct the remaining charges
            else {
                this.update({ 'uses.value': Math.max(remainingUses - 1, 0) });
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Perform an ability recharge test for an item which uses the d6 recharge mechanic
     * @prarm {Object} options
     */
    async rollRecharge(options = {}) {
        const data = this.system;
        if (!data.recharge.value) return;

        // Roll the check
        const rollObject = Roll.create("1d6");
        const roll = await rollObject.evaluate({ async: true });
        const success = roll.total >= parseInt(data.recharge.value);

        // Display a Chat Message
        const rollMode = game.settings.get("core", "rollMode");
        const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            flavor: `${this.name} recharge check - ${success ? "success!" : "failure!"}`,
            whisper: (["gmroll", "blindroll"].includes(rollMode)) ? ChatMessage.getWhisperRecipients("GM") : null,
            blind: rollMode === "blindroll",
            roll: roll,
            speaker: ChatMessage.getSpeaker({
                actor: this.actor,
                alias: this.actor.name
            })
        };

        // Update the Item data
        const promises = [ChatMessage.create(chatData)];
        if (success) promises.push(this.update({ "data.recharge.charged": true }));
        return Promise.all(promises);
    }

    /* -------------------------------------------- */

    findHitLocation(actorToken, target) {
        console.log(actorToken, target.object)
        const ray = new Ray({ x: actorToken.object.center.x, y: actorToken.object.center.y }, { x: target.object.center.x, y: target.object.center.y })
        const angle = raytodeg(ray) + 180;

        var aspect
        const arcAngle = Math.normalizeDegrees(angle - target.rotation)
        //   if (item.system.mount.arc.front) {
        // console.log(arcAngle)
        if ((arcAngle > 300) || (arcAngle < 60)) aspect = "fwd"

        // if (item.system.mount.arc.aft) {
        // console.log(arcAngle)
        if ((arcAngle > 120) && (arcAngle < 240)) aspect = "aft"

        //  if (item.system.mount.arc.port) {
        // console.log(arcAngle)
        if ((arcAngle > 239) && (arcAngle < 301)) aspect = "port"

        //    if (item.system.mount.arc.stbd) {
        // console.log(arcAngle)
        if ((arcAngle > 59) && (arcAngle < 121)) aspect = "stbd"




        console.log(aspect, angle, arcAngle, ray, actorToken, target)

        return aspect



    }


    /* -------------------------------------------- */






    /* -------------------------------------------- */

    static chatListeners(html) {
        //    console.log("----chatlistener-------------")
        html.on('click', '.card-buttons button', this._onChatCardAction.bind(this));
        html.on('click', '.item-name', this._onChatCardToggleContent.bind(this));
        html.on('click', '.ac button', this._onDefenceChatCardAction.bind(this));
        html.on('click', '.HitLoc button', this._onRollHitLocation2.bind(this));
        html.on('click', '.ApplyPending button', this._onApplyPending.bind(this));
        //html.on('click', '.ac button', this._onChatCardAction.bind(this));

    }
    /* -------------------------------------------- */


    static async _onApplyPending(event) {
        // getElementById("p1").innerHTML = "New text!";
        console.log(event,this)
        event.currentTarget.innerHTML = "Applied";
        event.currentTarget.style.backgroundColor = "lightgreen"

        console.log(parseInt(game.settings.get("Alternityd100", "starshipHitLocLen")), game.settings.get("Alternityd100", "starshipHitLocLen"))
        const button = event.currentTarget;
        const tokenId = button.dataset.tokenid;
        const actorId = button.dataset.actorid;
        const aspect = button.dataset.aspect;
        const targetToken = await findTokenById(tokenId)
        const realActor = await game.actors.get(actorId)
        console.log("targetToken", button.dataset)
        console.log("targetToken", targetToken)
        console.log("realActor", realActor)
        const actor = targetToken ? targetToken.actor : realActor //  game.actors.get(actorId);
        const token = null  //this.actor.token;
        const stun = parseInt(button.dataset.stun, 10);
        const wound = parseInt(button.dataset.wound, 10);
        const mortal = parseInt(button.dataset.mortal, 10);
        const critical = parseInt(button.dataset.critical, 10);



        console.log("tokenId", tokenId)
        console.log("button.dataset", button.dataset)
        console.log("targetToken", targetToken)
        console.log("actor", actor)
        const myupdate = foundry.utils.duplicate(actor.system.attributes);
        myupdate.stu.pending -= stun
        myupdate.wou.pending -= wound
        myupdate.mor.pending -= mortal

        if (actor.isSpaceActor) myupdate.cri.pending -= critical;

        actor.update({ "system.attributes": myupdate })
        console.log(this)
        const chatData2 = [{
            flavor: actor.name + " damaged: " + stun + "s/" + wound + "w/" + mortal + "m.",
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            sound: CONFIG.sounds.notification
        }];
        await CONFIG.ChatMessage.documentClass.create(chatData2);
        ui.notifications.info("Damage Applied")

    }

    static async _onRollHitLocation2(event) {


        console.log(parseInt(game.settings.get("Alternityd100", "starshipHitLocLen")), game.settings.get("Alternityd100", "starshipHitLocLen"))




        let SAA = new Promise((resolve) => {
            const buttonz = {}
            for (let numbut = 0; numbut <= game.settings.get("Alternityd100", "starshipHitLocLen"); numbut++) {
                buttonz[numbut] = { label: "±" + numbut, callback: () => resolve(this._onRollHitLocation(event, numbut)) }
            }
            const dialogData = {
                title: game.i18n.localize("Hit Location Adjustment"),//.format(itemData.name),
                content: game.i18n.localize("Adjustment to random compartment hit location"),//.format(itemData.name),
                buttons: buttonz,
                close: () => {
                    resolve(false);
                },
                default: 0,
            };
            // if (!allowSpell) delete dialogData.buttons.spell;
            new Dialog(dialogData, { classes: ["dialog", "pf1", "create-pharmaceutical"] }).render(true);
        });

        console.log(SAA)

    }



    static async _onRollHitLocation(event, numbut) {
        const button = event.currentTarget;
        const tokenId = button.dataset.targetid;
        const atttokenid = button.dataset.atttokenid;
        const aspect = button.dataset.aspect;
        const targetToken = await findTokenById(tokenId)
        const attackingToken = findTokenById(atttokenid)
        const token = null  //this.actor.token;
        const targetSize = targetToken.actor.system.frame.system.basesize
        console.log(d100A.hitLocation, targetToken, targetToken.actor.system.details, numbut)
        const die = d100A.hitLocation[targetSize].die
        const roll = await Roll.create('1d' + die).evaluate({ async: true });


        let location = "F"
        let locArray = []
        console.log(roll, targetToken.actor, targetSize, aspect)
        const LowVal = roll.total - numbut
        const HiVal = roll.total + numbut
        for (let [k, values] of Object.entries(d100A.hitLocation[targetSize][aspect])) {
            for (let v of values) {
                if ((LowVal <= v) && (HiVal >= v)) {
                    locArray.push(d100A.compartmentData[k].name)
                    // location = d100A.compartmentData[k].name;
                    break;
                }
            }
        }

        const itemData = targetToken.actor.system


        const templateData = {
            actor: this.actor,
            //tokenId: token ? `${token.parent.id}.${token.id}` : null,
            item: this,
            //data: this.getChatData(htmlOptions),
            labels: this.labels,
            hasAttack: this.hasAttack,
            isLauncher: this.islauncher,
            hasDamage: this.hasDamage,
            hasDefence: this.hasDefence,
            hasSave: this.hasSave,
            hasOtherFormula: this.hasOtherFormula,
            roll: roll.toJSON(),
            formula: roll.formula,
            total: roll.total,
            degree: location,
            flavor: "Hit location and Skill Offset +/- " + numbut,
            hitLoc: locArray //["L","R","Mid"]
        };
        console.log("\n----tokenData-------------\n", tokenId, targetToken)
        console.log("\n----tokenData-------------\n", button.dataset, aspect)



        const templateType = ["tool", "pharmaceutical"].includes(this.type) ? this.type : "item";
        //const template = `systems/Alternityd100/templates/chat/${templateType}-card.html`;
        const template = `systems/Alternityd100/templates/chat/roll-hitLoc.hbs`;
        const html = await renderTemplate(template, templateData);
        let a = 0
        console.log(ChatMessage.getSpeaker({ token: attackingToken }))
        // Basic chat message data
        const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: targetToken ? ChatMessage.getSpeaker({ token: targetToken }) : ChatMessage.getSpeaker({ actor: this.actor }),
            sound: a === 0 ? CONFIG.sounds.dice : null,
            roll: roll.toJSON(),
            formula: roll.formula
        };
        await roll.toMessage(chatData);
        // Toggle default roll mode
        //     let rollMode = game.settings.get("core", "rollMode");
        //     if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
        //    if (rollMode === "blindroll") chatData["blind"] = true;

        // Create the chat message
        //    ChatMessage.create(chatData, { displaySheet: false });

        const msgData = {
            //  speaker: speaker,
            //  flavor: flavor,
            //  stepflavor:stepflavor,
            //  rollMode: rollMode,
            sound: a === 0 ? CONFIG.sounds.dice : null,
        };
        //if (subject) setProperty(msgData, "flags.pf1.subject", subject);

        //    await roll.toMessage(chatData);

    }

    static async _onDefenceChatCardAction(event) {
        //event.preventDefault();
        //const itemId = event.currentTarget.closest('.item').dataset.itemId;
        //const item = this.actor.items.get(itemId);
        //console.log(this.system)
        //
        //console.log("\n----rollDefence-------------\n",event)
        event.preventDefault();
        // Extract card data
        const button = event.currentTarget;
        const applytoSelected = event.altKey
        const defenceData = {}
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;
        const type = button.dataset.type;
        const value = button.dataset.value;
        console.log("\n----tokenData-------------\n", button.dataset)


        let tokenId = button.dataset.targetid;
        if (applytoSelected) tokenId = game.canvas.tokens.controlled[0].id
        let sceneId = card.dataset.sceneId;
        const tokenData = findTokenById(tokenId)
        const actorB = tokenData.actor
        const actorData = actorB.actorData
        //const actorarmor =  actorData.items[1]
        //console.log("\n----tokenData-------------\n",tokenData,actorB)


        let armor = [];
        if (actorB.type == "starship") {

            armor = actorB.itemTypes.starshipArmor.filter(i => i.isActive || true) /// isActive needs to be added for damage

        }
        else {
            armor = actorB.itemTypes.equipment.filter(i => i.system.equipped)
        }
        console.log("---", type, button.dataset)
        defenceData.value = value;
        defenceData.type = type;
        defenceData.armor = armor;
        defenceData.actor = actorB;
        defenceData.action = action;
        defenceData.dmgtype = button.dataset.dmgtype;
        defenceData.firepower = button.dataset.firepower;
        //console.log("\n----tokenData-------------\n",tokenData,actorB)
        //console.log("\n----armor-------------\n",armor[0], game.items,armor)
        let item = armor[0];
        //console.log("\n----armor-------------\n",item)
        const chatCardActor = this._getChatCardActor(card);
        let contrActor = canvas.tokens.controlled;
        if (!event.shiftKey) {
            defenceData.actor = actorB


        }
        else (defenceData.actor = contrActor)
        //console.log("\n----event.shiftKey-------------\n",defenceData.actor);

        if (armor.length) {
            return armor[0].rollDefence({ defenceData: defenceData });
        }
        else {
            ui.notifications.warn("You have no armor just a smoking hole in your chest!!");
            //ui.notifications.warn("You have no armor just a smoking hole in your chest!!");
            throw new Error("You have no armor!!");
            i.notifications.warn(msg);

            return null
        }


    }




    /* -------------------------------------------- */

    static async _onChatCardAction(event) {
        event.preventDefault();
        //console.log("----onChatCardAction-------------",event)
        // Extract card data
        const button = event.currentTarget;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;
        const type = button.dataset.type;
        const value = button.dataset.value;

        //console.log("----onChatCardAction-------------",event, "\n Card ", card,messageId,message, "\n Action ",action)
        //console.log("----onChatCardAction-------------", "\n Action ",action , "\n Type ",type, "\n Value ",value)
        // Validate permission to proceed with the roll
        const isTargetted = action === "save";
        if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

        // Get the Actor from a synthetic Token
        const chatCardActor = this._getChatCardActor(card);
        if (!chatCardActor) return;

        button.disabled = true;

        // Get the Item
        let item = chatCardActor.items.get(card.dataset.itemId);

        // Adjust item to level, if required
        if (typeof (message.data.flags.level) !== 'undefined' && message.data.flags.level !== item.system.level) {
            const newItemData = foundry.utils.duplicate(item.data);
            newitemData.level = message.data.flags.level;

            item = new ItemSFRPG(newItemData, { parent: item.parent });

            // Run automation to ensure save DCs are correct.
            item.prepareData();
            const processContext = await item.processData();
            if (processContext.fact.promises) {
                await Promise.all(processContext.fact.promises);
            }
        }

        // Get the target
        const targetActor = isTargetted ? this._getChatCardTarget(card) : null;

        // Attack and Damage Rolls
        if (action === "attack") await item.rollAttack({ event });
        else if (action === "damage") await item.rollDamage({ event });
        else if (action === "formula") await item.rollFormula({ event });

        // Saving Throw
        else if (action === "save" && targetActor) {
            const savePromise = targetActor.rollSave(button.dataset.type, { event });
            savePromise.then(() => {
                button.disabled = false;
            });
            return;
        }

        // Pharmaceutical usage
        else if (action === "consume") await item.rollConsumable({ event });

        // Re-enable the button
        button.disabled = false;
    }

    /**
     * Handle toggling the visibility of chat card content when the name is clicked.
     * @param {Event} event The originating click event
     */
    static _onChatCardToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const card = header.closest('.chat-card');
        const content = card.querySelector('.card-content');
        // content.style.display = content.style.display === 'none' ? 'block' : 'none';
        $(content).slideToggle();
    }

    /* -------------------------------------------- */

    /**
     * Handle toggling the visibility of chat card content when the name is clicked
     *
     * @param {Event} event   The originating click event
     * @private
     */
    static _onChatCardToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const card = header.closest(".chat-card");
        const content = card.querySelector(".card-content");
        content.style.display = content.style.display === "none" ? "block" : "none";

        // Update chat popout size
        const popout = header.closest(".chat-popout");
        if (popout) {
            popout.style.height = "auto";
        }
    }

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor|null}         The Actor entity or null
     * @private
     */
    static _getChatCardActor(card) {

        const actorId = card.dataset.actorId;

        // Case 1 - a synthetic actor from a Token, legacy reasons the token Id can be a compound key of sceneId and tokenId
        let tokenId = card.dataset.tokenId;
        let sceneId = card.dataset.sceneId;
        if (!sceneId && tokenId?.includes('.')) {
            [sceneId, tokenId] = tokenId.split(".");
        }

        let chatCardActor = null;
        if (tokenId && sceneId) {
            const scene = game.scenes.get(sceneId);
            if (scene) {
                const tokenData = scene.getEmbeddedDocument("Token", tokenId);
                if (tokenData) {
                    const token = new Token(tokenData);
                    chatCardActor = token.actor;
                }
            }
        }

        // Case 2 - use Actor ID directory
        if (!chatCardActor) {
            chatCardActor = game.actors.get(actorId);
        }

        return chatCardActor;
    }

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor|null}         The Actor entity or null
     * @private
     */
    static _getChatCardTarget(card) {
        const character = game.user.character;
        const controlled = canvas.tokens?.controlled;
        if (controlled.length === 0) return character || null;
        if (controlled.length === 1) return controlled[0].actor;
        else throw new Error(`You must designate a specific Token as the roll target`);
    }

    /**    THIS IS NOT CALLED BUT AN UPDATE FOR MULTIPLE CHAR SELECTION
 * Get the Actor which is the author of a chat card
 *
 * @param {HTMLElement} card    The chat card being used
 * @returns {Array.<Actor>}      The Actor entity or null
 * @private
 */
    static _getChatCardTargets(card) {
        const character = game.user.character;
        const controlled = canvas.tokens.controlled;
        const targets = controlled.reduce((arr, t) => (t.actor ? arr.concat([t.actor]) : arr), []);
        if (character && controlled.length === 0) targets.push(character);
        if (!targets.length) throw new Error(`You must designate a specific Token as the roll target`);
        return targets;
    }
    /**
     * Add a modifier to this actor.
     * 
     * @param {Object}        data               The data needed to create the modifier
     * @param {String}        data.name          The name of this modifier. Used to identify the modfier.
     * @param {Number|String} data.modifier      The modifier value.
     * @param {String}        data.type          The modifiers type. Used to determine stacking.
     * @param {String}        data.modifierType  Used to determine if this modifier is a constant value (+2) or a Roll formula (1d4).
     * @param {String}        data.effectType    The category of things that might be effected by this modifier.
     * @param {String}        data.subtab        What subtab should this modifier show under on the character sheet.
     * @param {String}        data.valueAffected The specific value being modified.
     * @param {Boolean}       data.enabled       Is this modifier activated or not.
     * @param {String}        data.source        Where did this modifier come from? An item, ability or something else?
     * @param {String}        data.notes         Any notes or comments about the modifier.
     * @param {String}        data.condition     The condition, if any, that this modifier is associated with.
     * @param {String|null}   data.id            Override the randomly generated id with this.
     */
    async addModifier({
        name = "",
        modifier = 0,
        type = SFRPGModifierTypes.UNTYPED,
        modifierType = SFRPGModifierType.CONSTANT,
        effectType = SFRPGEffectType.SKILL,
        subtab = "misc",
        valueAffected = "",
        enabled = true,
        source = "",
        notes = "",
        condition = "",
        id = null
    } = {}) {
        const data = this._ensureHasModifiers(duplicate(this.system));
        const modifiers = data.modifiers;

        modifiers.push(new SFRPGModifier({
            name,
            modifier,
            type,
            modifierType,
            effectType,
            valueAffected,
            enabled,
            source,
            notes,
            subtab,
            condition,
            id
        }));

        //console.log("Adding a modifier to the item","data.modifiers", modifiers);

        await this.update({ ["data.modifiers"]: modifiers });
    }

    /**
     * Delete a modifier for this Actor.
     * 
     * @param {String} id The id for the modifier to delete
     */
    async deleteModifier(id) {
        const modifiers = this.system.modifiers.filter(mod => mod._id !== id);

        await this.update({ "data.modifiers": modifiers });
    }

    /**
     * Edit a modifier for an Actor.
     * 
     * @param {String} id The id for the modifier to edit
     */
    editModifier(id) {
        const modifiers = foundry.utils.duplicate(this.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === id);

        new d100AModifierApplication(modifier, this, {}, this.actor).render(true);
    }

    changeAttackMode(currentMode) {
        const isWeapon = ["weapon", "shield"].includes(this.system.type);
        currentMode = this.system.fireMode;
        const actorData = this.actor.system;
        // console.log("AM",this.data.type,actorData)
        if (currentMode == "fire") {
            if (this.system.mode.burst) currentMode = "burst";
            else if (this.system.mode.auto) currentMode = "auto";
            else if (this.system.mode.battery) currentMode = "battery";
            //console.log("AM1",this)
        }
        else if (currentMode == "burst") {
            if (this.system.mode.auto) currentMode = "auto";
            else if (this.system.mode.battery) currentMode = "battery";
            else if (this.system.mode.fire) currentMode = "fire";
            //console.log("AM3")
        }
        else if (currentMode == "auto") {
            if (this.system.mode.battery) currentMode = "battery";
            else if (this.system.mode.fire) currentMode = "fire";
            else if (this.system.mode.burst) currentMode = "burst";
            // console.log("AM3")
        }
        else if (currentMode == "battery") {
            if (this.system.mode.fire) currentMode = "fire";
            else if (this.system.mode.burst) currentMode = "burst";
            else if (this.system.mode.auto) currentMode = "auto";
            // console.log("AM3")
        }
        this.system.fireMode = currentMode
        return currentMode
    }







}

async function NoTokenWarn(combat = false) {
    let message = "No Token on scene"
    combat ? message = "No Token on scene" : message = "No Token in combat";
    ui.notifications.warn(message);
    console.warn(message);
}


export function findSkill(skillName, allSkills, asText) {
    //console.log("findSkill",skillName,allSkills);
    for (let [key3, stat] of Object.entries(allSkills)) {
        //console.log("stats",key3,stat)
        for (let [key, skill] of Object.entries(allSkills[key3])) {
            if (key == skillName) {


                if (asText) return key
                return skill
            };
        }
        // for (let [key, skill] of Object.entries(data.skills[key3])) { skill.base = Math.floor((data.abilities[key3].value + skill.ranks) / br_sk_id[skill.broadid]) ; skill.good =  Math.floor(skill.base/2) ; skill.amazing =  Math.max(1,Math.floor(skill.base/4)) };
    }
    // }
    return null;
}

/**
* Returns the first token object from the canvas based on the ID value
* @param {String} tokenId - The ID of the token to look for
*/
export function findTokenById(tokenId) {
    // console.log("Hit",tokenId );
    return getCanvas().tokens?.placeables.find((t) => t.id == tokenId);
}
export function findTokenByActorId(ActorId) {
    // console.log("Hit",tokenId );
    return getCanvas().tokens?.placeables.find((t) => t.actor.id == ActorId);
}
export function getCanvas() {
    if (!(canvas instanceof Canvas) || !canvas.ready) {
        throw new Error('Canvas Is Not Initialized');
    }
    return canvas;
}

class scanTarget {

    /**
     * 
     * @param {d100tokendoc} token
     * {scanner: scanner, target : scan,range:range,ray:ray,collisions:collisions,angle:raytodeg(ray)}
     *  
     */
    constructor(token) {
        this.token = token
        this.id = generateUUID()
        this.hullType = token.actor.system.frame.system.hullType
        this.name = token.name
        this.sensors = new Set()
        this.aquired = false
    }

    /** */
    async contactScan(scanner, sensorOperator, actorToken) {

        console.log(this.sensors.has(scanner))
        //this.remove("scanners")
        this.sensors.delete(scanner)
        if ((this.range <= scanner.system.range.long) &&
            (inArc(raytodeg(this.ray), scanner, actorToken))
        ) {
            this.sensors.add(scanner)
        }
    }


}