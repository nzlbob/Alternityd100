import { SFRPG } from "../config.js"
import { d100A } from "../d100Aconfig.js"
import { d100ActorSheet } from "../d100Actor-sheet.js";
import { RPC } from "../rpc.js";
import { loadLauncherOrdnance } from "../item/item-ordnance-utils.js"
import { unloadLauncherOrdnance } from "../item/item-ordnance-utils.js"
import { d100AActorSheetStarship } from "../actor/sheet/starship.js";

const itemSizeArmorClassModifier = {
    "fine": 8,
    "diminutive": 4,
    "tiny": 2,
    "small": 1,
    "medium": 0,
    "large": 1,
    "huge": 2,
    "gargantuan": 4,
    "colossal": 8
};

/**
 * Override and extend the core ItemSheet implementation to handle SFRPG specific item types
 * @type {ItemSheet}
 */
export class ItemSheetSFRPG extends ItemSheet {
    constructor(...args) {
        super(...args);

        /**
         * The tab being browsed
         * @type {string}
         */
        this._sheetTab = null;

        /**
         * The scroll position on the active tab
         * @type {number}
         */
        this._scrollTab = 100;

        this._tooltips = null;


    }

    /* -------------------------------------------- */

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 715,
            height: 600,
            classes: ["Alternityd100", "sheet", "item"],
            resizable: true,
            scrollY: [".tab.details"],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
            tabs: [
                { navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" },
                { navSelector: ".descTabs", contentSelector: ".desc-body", initial: "description" }
            ]
        });




    }

    /* -------------------------------------------- */

    /**
     * Return a dynamic reference to the HTML template path used to render this Item Sheet
     * @return {string}
     */
    get template() {
        const path = "systems/Alternityd100/templates/items";
        return `${path}/${this.item.type}.html`;
    }

    /* -------------------------------------------- */
    parseNumber(value, defaultValue) {
        if (value === 0 || value instanceof Number) return value;
        else if (!value) return defaultValue;

        let numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return defaultValue;
        }
        return numericValue;
    }

    async onPlaceholderUpdated(item, newSavingThrowScore) {
        const placeholders = item.system.flags.placeholders;
        if (placeholders.savingThrow.value !== newSavingThrowScore.total) {
            placeholders.savingThrow.value = newSavingThrowScore.total;
            await new Promise(resolve => setTimeout(resolve, 500));
            this.render(false, { editable: this.options.editable });
        }
    }

    /**
     * Prepare item sheet data
     * Start with the base item data and extending with additional properties for rendering.
     */
    async getData() {




        const data = super.getData();
        //     console.log(  "data", data,game.Alternityd100 )
        //const actorskill= actorData;

        //console.log(  "data before", data)


        data.itemData = this.document.system;
        data.actor = this.document.parent;
        data.labels = this.item.labels;

        // Include CONFIG values
        data.config = CONFIG.SFRPG;
        // data.d100Aconfig = CONFIG.d100A;
        data.d100Aconfig = CONFIG.d100A;
        //  console.log(  //"_getItemProperties",props,
        //  "labels", labels,  
        //  "data.Itemdata" ,data
        //"Item" , item,  
        //"CONFIG-NEW", CONFIG.SFRPG.weaponProperties, 
        // "Object Ent", Object.entries(itemData.properties),
        //  "AEON" ,CONFIG.SFRPG.weaponPropertiesAeon
        // )

        // Item Type, Status, and Details
        //data.itemType = game.i18n.format(`ITEM.Type.${data.item.type.titleCase()}`);
        data.itemType = game.i18n.format(`TYPES.Item.${data.item.type.toLowerCase()}`);
        data.itemStatus = this._getItemStatus();
        data.itemProperties = this._getItemProperties();
        data.isPhysical = data.itemData.hasOwnProperty("quantity");

        data.hasLevel = data.itemData.hasOwnProperty("level") && data.item.type !== "spell";
        data.hasHands = data.itemData.hasOwnProperty("hands");
        data.hasProficiency = data.itemData.proficient === true || data.itemData.proficient === false;
        data.isFeat = this.type === "feat";
        data.isVehicleAttack = data.item.type === "vehicleAttack";
        data.isVehicleSystem = data.item.type === "vehicleSystem";
        data.isGM = game.user.isGM;
        data.isOwner = data.owner;
        data.isSkilled = data.itemData.isSkilled
        data.isOpposed = data.itemData.isOpposed
        data.isCybertech = this.item.isCybertech
        //   console.log("SHEET.JS CONFIG SFRPG", data.config,"data.itemData", data.itemType,data.itemProperties )
        // Physical items
        const physicalItems = ["weapon", "equipment", "pharmaceutical", "goods", "container", "technological", "magic", "hybrid", "upgrade", "augmentation", "shield", "weaponAccessory"];
        data.isPhysicalItem = physicalItems.includes(data.item.type);
        console.log(data)
        // Item attributes
        const itemData = this.item.system;
        /*
        if(["psionic"].includes(data.document.type)){
            data.broadPsionList = {}
            for (const [key, ability] of Object.entries(d100A.psionBroadSkill)) {
                
                data.broadPsionList[key] = game.items.filter((item) => {
                    console.log("Hello",item.name)
                    return item.system.type == "psionic" && item.system.skill == key
                    
                });

            }
            



        }
*/
        data.placeholders = this.item.flags.placeholders || {};

        // Only physical items have hardness, hp, and their own saving throw when attacked.
        if (false) {
        //if (data.isPhysicalItem) {
            if (itemData.attributes) {
                const itemLevel = this.parseNumber(itemData.level, 1) + (itemData.attributes.customBuilt ? 2 : 0);
                const sizeModifier = itemSizeArmorClassModifier[itemData.attributes.size];
                const dexterityModifier = this.parseNumber(itemData.attributes.dex?.mod, -5);

                data.placeholders.hardness = this.parseNumber(itemData.attributes.hardness, 5 + itemData.attributes.sturdy ? 2 * itemLevel : itemLevel);
                data.placeholders.maxHitpoints = this.parseNumber(itemData.attributes.hp?.max, (itemData.attributes.sturdy ? 15 + 3 * itemLevel : 5 + itemLevel) + (itemLevel >= 15 ? 30 : 0));
                data.placeholders.armorClass = this.parseNumber(itemData.attributes.ac, 10 + sizeModifier + dexterityModifier);
                data.placeholders.dexterityModifier = dexterityModifier;
                data.placeholders.sizeModifier = sizeModifier;

                data.placeholders.savingThrow = data.placeholders.savingThrow || {};
                data.placeholders.savingThrow.formula = `@itemLevel + @owner.abilities.dex.mod`;
                data.placeholders.savingThrow.value = data.placeholders.savingThrow.value || 10;

                this.item.flags.placeholders = data.placeholders;
                this._computeSavingThrowValue(itemLevel, data.placeholders.savingThrow.formula)
                    .then((total) => this.onPlaceholderUpdated(this.item, total))
                    .catch((reason) => console.log(reason));
            } else {
                const itemLevel = this.parseNumber(itemData.level, 1);
                const sizeModifier = 0;
                const dexterityModifier = -5;

                data.placeholders.hardness = 5 + itemLevel;
                data.placeholders.maxHitpoints = (5 + itemLevel) + (itemLevel >= 15 ? 30 : 0);
                data.placeholders.armorClass = 10 + sizeModifier + dexterityModifier;
                data.placeholders.dexterityModifier = dexterityModifier;
                data.placeholders.sizeModifier = sizeModifier;

                data.placeholders.savingThrow = data.placeholders.savingThrow || {};
                data.placeholders.savingThrow.formula = `@itemLevel + @owner.abilities.dex.mod`;
                data.placeholders.savingThrow.value = data.placeholders.savingThrow.value || 10;

                this.item.system.flags.placeholders = data.placeholders;
                this._computeSavingThrowValue(itemLevel, data.placeholders.savingThrow.formula)
                    .then((total) => this.onPlaceholderUpdated(this.item, total))
                    .catch((reason) => console.log(reason));
            }
        }

        data.selectedSize = (itemData.attributes && itemData.attributes.size) ? itemData.attributes.size : "medium";

        // Category
        data.category = this._getItemCategory();

        // Armor specific details
        data.isPowerArmor = data.item.system.hasOwnProperty("armor") && data.item.system.armor.type === 'power';

        // Action Details
        data.hasAttackRoll = this.item.hasAttack;
        data.hasDamage = false// this.item.hasDamage;
        data.isHealing = data.item.system.actionType === "heal";
        data.hasDefenceRoll = this.item.hasDefence;
        data.isAoE = this.item.isAoE
        // Vehicle Attacks
        if (data.isVehicleAttack) {
            data.placeholders.savingThrow = {};
            data.placeholders.savingThrow.value = data.item.system.save.dc;
        }

        data.modifiers = this.item.system.modifiers;

        data.hasSpeed = this.item.system.weaponType === "tracking" || (this.item.system.special && this.item.system.special["limited"]);
        //console.log("\n\n************************\n\nhasCapacity() {\n***************************\n\n",this,"this.document.hasCapacity()")
        data.hasCapacity = this.object.hasCapacity;



        /** Setup for missile/bomb launchers */

        if (this.item.isLauncher) {
            //console.log("Launcher", data, this, itemData);    
            data.isLauncher = true;
            const mt = { name: "Empty", img: "" }
            var launchcounter = 0
            data.launcherarray = []
            data.launcherconfig = { maxtubes: data.item.system.capacity.max } //12
            //console.log("data.item.system.capacity.max",data.item.system.capacity.max,data.launcherconfig.maxtubes)
            data.launcherconfig.maxwidth = 4  //4
            data.item.system.ordnance.forEach(function (value, key) {
                //console.log("Launcher", value, key);
                data.launcherconfig.maxtubes -= Math.max(value.system.size - 1, 0);
            });
            //console.log("data.item.system.capacity.max",data.item.system.capacity.max,data.launcherconfig.maxtubes)
            let fullrows = Math.ceil(data.launcherconfig.maxtubes / data.launcherconfig.maxwidth)
            let remainder = data.launcherconfig.maxwidth - (fullrows * data.launcherconfig.maxwidth - data.launcherconfig.maxtubes);
            //console.log("cells\n",data.launcherconfig.maxtubes,fullrows,remainder )
            for (let i = 0; i < fullrows; i++) {
                let currolen = data.launcherconfig.maxwidth;
                data.launcherarray.push([])
                if (i == fullrows - 1) currolen = remainder;
                for (let j = 0; j < Math.min(data.launcherconfig.maxtubes, currolen); j++) {
                    data.launcherarray[i].push([{ load: {}, ordn: 0 }])
                    //console.log("Loop\n",data.item.system.ordnance.length,launchcounter,i,j,data.launcherarray,data.item.system.ordnance[launchcounter] )
                    if ((data.item.system.ordnance.length) > launchcounter) {
                        data.launcherarray[i][j].load = data.item.system.ordnance[launchcounter]
                    }
                    else { data.launcherarray[i][j].load = mt }
                    data.launcherarray[i][j].ordn = launchcounter;
                    launchcounter++;
                }
            }
        }
        // End Setup for missile/bomb launchers   
        /** Setup for missile/bomb launchers */

        if (["race", "achievement"].includes(this.item.type)) {
            data.skills = {}
            data.skills.table = []
            console.log("Broadskills", d100A.skillData)
            const asArray = Object.entries(d100A.skillData);

            data.skills.broadSkillList = asArray.filter(([key, value]) => value.isBroad === true);
            //data.skills.broadSkillList = d100A.skillData.filter(item => item.isBroad === true); 

            console.log("Broadskills", data.skills)
            let tempno = 0
            for (let row = 0; row < 10; row++) {
                data.skills.table.push([])
                for (let cell = 0; cell < 4; cell++) {
                    data.skills.table[row].push([])
                    data.skills.table[row][cell].id = data.skills.broadSkillList[tempno][0];
                    data.skills.table[row][cell].name = data.skills.broadSkillList[tempno][1].name;
                    data.skills.table[row][cell].attrib = data.skills.broadSkillList[tempno][1].attrib;


                    tempno += 1

                }
            }

        }
        // Starshup Hull HP Calculation
        /*   if (data.type == "starshipFrame") {
               let SW = itemData.data.durability+itemData.data.durability;
               let MO = Math.round(SW/2);
               let CR = Math.round(MO/2);
   //
               itemData.data.attributes.wou.base = SW;
               itemData.data.attributes.wou.value = SW;
               itemData.data.attributes.stu.base = SW;
               itemData.data.attributes.stu.value = SW;
               itemData.data.attributes.mor.base = MO;
               itemData.data.attributes.mor.value = MO;
               itemData.data.attributes.cri.base = CR;
               itemData.data.attributes.cri.value = CR;
   
   }
   */
        //if (data.type.startsWith("starship")){
        console.log("\n-----Say Hello--------\n", data.itemType, data)

        //}
        // Enrich text editors
        data.enrichedDescription = await TextEditor.enrichHTML(this.object.system.description.value, { async: true });
        data.enrichedShortDescription = await TextEditor.enrichHTML(this.object.system.description.short, { async: true });
        data.enrichedGMNotes = await TextEditor.enrichHTML(this.object.system.description.gmNotes, { async: true });

        if (["ITEM.TypeWeapon", "Weapon"].includes(data.itemType)) {

            data.allowableSkills = d100A.allowableSkills[this.object.system.weaponType]
            console.log(data.allowableSkills, this.object.system.weaponType)
        }
        console.log("data after", data)

        //console.log(  "data after", this.item.system.broadSkills.armorop)
        delete this.item.system.skills
        return data;
    }

    /* -------------------------------------------- */

    async _computeSavingThrowValue(itemLevel, formula) {
        try {
            const rollData = {
                owner: this.item.actor ? foundry.utils.duplicate(this.item.actor.system) : { abilities: { dex: { mod: 0 } } },
                item: foundry.utils.duplicate(this.item.system),
                itemLevel: itemLevel
            };
            if (!rollData.owner.abilities?.dex?.mod) {
                rollData.owner.abilities = { dex: { mod: 0 } };
            }
            const saveRoll = Roll.create(formula, rollData);
            return saveRoll.evaluateSync();
        } catch (err) {
            //console.log(err);
            return null;
        }
    }

    /**
     * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
     * @return {string}
     * @private
     */
    _getItemStatus() {
        const item = this.document.system;
        //const itemData = item.data;
       // console.log(item, this, this.document)
        if (["weapon", "equipment", "shield"].includes(item.type)) return item.equipped ? "Equipped" : "Unequipped";
        else if (item.type === "starshipWeapon") return item.mount.mounted ? "Mounted" : "Not Mounted";
       // else if (item.type === "augmentation") return `${item.type} (${item.system.progressLevel})`;
        else if (item.type === "vehicleSystem") {
            // Only systems which can be activated have an activation status
            if (this.document.canBeActivated === false) {
                return ""
            }
            return this.document.isActive ? "Activated" : "Not Activated";
        }
    }

    /* -------------------------------------------- */

    /**
     * Get the Array of item properties which are used in the small sidebar of the description tab
     * @return {Array}
     * @private
     */
    _getItemProperties() {
        const props = [];
        const labels = this.item.labels;

        const item = this.document.system;
        //const itemData = item.data;
        if (item.type === "weapon") {
            props.push(...Object.entries(item.properties)
                .filter(e => e[1] === true)
                .map(e => ({
                    name: CONFIG.SFRPG.weaponProperties[e[0]],
                    tooltip: CONFIG.SFRPG.weaponPropertiesTooltips[e[0]]


                })
                )
            );
            //  console.log(  "_getItemProperties",props,
            //  "labels", labels,  
            // "Itemdata" ,itemData,
            // "Item" , item,  
            // "CONFIG", CONFIG.SFRPG.weaponProperties, 
            // "Object Ent", Object.entries(itemData.properties),
            //  "AEON" ,CONFIG.SFRPG.weaponPropertiesAeon
            //)

            //d100 converts weapon type to action type

            //console.log(  "data.Itemdata" ,itemData )

            if (item.weaponType == "meleeW") { item.actionType = "mwak" };
            if (item.weaponType == "rangedW") { item.actionType = "rwak" };
            if (item.weaponType == "heavy") { item.actionType = "rwak" };
            if (item.weaponType == "explos") { item.actionType = "rwak" };
            //if (data.weaponType == "heavy"){data.actionType = "rsak"};
            //if (data.weaponType == "explos"){data.actionType = "rsak"};

        } else if (item.type === "spell") {
            props.push(
                { name: labels.components, tooltip: null },
                { name: labels.materials, tooltip: null },
                item.concentration ? { name: "Concentration", tooltip: null } : null,
                item.sr ? { name: "Spell Resistence", tooltip: null } : null,
                item.dismissible ? { name: "Dismissible", tooltip: null } : null
            )
        } else if (item.type === "equipment") {
            props.push({
                name: CONFIG.SFRPG.armorTypes[item.armor.type],
                tooltip: null
            });
            props.push({
                name: labels.armor,
                tooltip: null
            });
        } else if (item.type === "feat") {
            props.push({
                name: labels.featType,
                tooltip: null
            });
        } else if (item.type === "starshipWeapon") {
            props.push({
                name: CONFIG.SFRPG.starshipWeaponTypes[item.weaponType],
                tooltip: null
            });
            props.push({
                name: CONFIG.SFRPG.starshipWeaponClass[item.class],
                tooltip: null
            });
        } else if (item.type === "shield") {
            // Add max dexterity modifier
            if (item.dex) props.push({
                name: game.i18n.format("SFRPG.Items.Shield.Dex", { dex: item.dex.toString() }),
                tooltip: null
            });
            // Add armor check penalty
            if (item.acp) props.push({
                name: game.i18n.format("SFRPG.Items.Shield.ACP", { acp: item.acp.toString() }),
                tooltip: null
            });

            const wieldedBonus = item.proficient ? (item.bonus.wielded || 0) : 0;
            const alignedBonus = item.proficient ? (item.bonus.aligned || 0) : 0;
            props.push({
                name: game.i18n.format("SFRPG.Items.Shield.ShieldBonus", { wielded: wieldedBonus.toString(), aligned: alignedBonus.toString() }),
                tooltip: null
            });
        }
        else if (item.type === "vehicleAttack") {
            if (item.ignoresHardness && item.ignoresHardness > 0) {
                props.push(game.i18n.localize("SFRPG.VehicleAttackSheet.Details.IgnoresHardness") + " " + item.ignoresHardness);
            }
        }
        else if (item.type === "vehicleSystem") {
            if (item.senses && item.senses.usedForSenses == true) {
                // We deliminate the senses by `,` and present each sense as a separate property
                let sensesDeliminated = item.data.senses.senses.split(",");
                for (let index = 0; index < sensesDeliminated.length; index++) {
                    var sense = sensesDeliminated[index];
                    props.push(sense);
                }
            }
        }

        // Action type
        if (item.actionType) {
            props.push({
                name: CONFIG.SFRPG.itemActionTypes[item.actionType],
                tooltip: null
            });
        }

        // Action usage
        if ((item.type !== "weapon") && item.activation && !foundry.utils.isEmpty(item.activation)) {
            props.push(
                { name: labels.activation, tooltip: null },
                { name: labels.range, tooltip: null },
                { name: labels.target, tooltip: null },
                { name: labels.duration, tooltip: null }
            )
        }
        return props.filter(p => !!p && !!p.name);
    }

    _getItemCategory() {
        let category = {
            enabled: false,
            value: "",
            tooltip: ""
        };

        const item = this.item;
        //const itemData = item.data;

        if (item.type === "weapon") {
            category.enabled = true;
            category.value = SFRPG.weaponTypes[item.weaponType];
            category.tooltip = "SFRPG.ItemSheet.Weapons.Category";
        } else if (item.type === "equipment") {
            category.enabled = true;
            category.value = SFRPG.equipmentTypes[item.system.armor.type];
            category.tooltip = "SFRPG.Items.Equipment.Category";
        } else if (item.type === "pharmaceutical") {
            category.enabled = true;
            category.value = SFRPG.consumableTypes[item.consumableType];
            category.tooltip = "SFRPG.ItemSheet.Consumables.Category";
        }

        return category;
    }

    /* -------------------------------------------- */

    setPosition(position = {}) {
        if (this._sheetTab === "details") position.height = "auto";
        return super.setPosition(position);
    }

    /* -------------------------------------------- */
    /*  Form Submission                             */
    /* -------------------------------------------- */

    /**
     * Extend the parent class _updateObject method to ensure that damage ends up in an Array
     * @private
     */
    _updateObject(event, formData) {
        // Handle Damage Array
        let damage = Object.entries(formData).filter(e => e[0].startsWith("system.damage.parts"));
        formData["system.damage.parts"] = damage.reduce((arr, entry) => {
            let [i, key, type] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = { formula: "", types: {}, operator: "" };

            switch (key) {
                case 'formula':
                    arr[i].formula = entry[1];
                    break;
                case 'operator':
                    arr[i].operator = entry[1];
                    break;
                case 'types':
                    if (type) arr[i].types[type] = entry[1];
                    break;
            }

            return arr;
        }, []);

        // Handle Critical Damage Array
        let criticalDamage = Object.entries(formData).filter(e => e[0].startsWith("system.critical.parts"));
        formData["system.critical.parts"] = criticalDamage.reduce((arr, entry) => {
            let [i, key, type] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = { formula: "", types: {}, operator: "" };

            switch (key) {
                case 'formula':
                    arr[i].formula = entry[1];
                    break;
                case 'operator':
                    arr[i].operator = entry[1];
                    break;
                case 'types':
                    if (type) arr[i].types[type] = entry[1];
                    break;
            }

            return arr;
        }, []);

        // Handle Ability Adjustments array
        let abilityMods = Object.entries(formData).filter(e => e[0].startsWith("system.abilityMods.parts"));
        formData["system.abilityMods.parts"] = abilityMods.reduce((arr, entry) => {
            let [i, j] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = [];
            arr[i][j] = entry[1];
            return arr;
        }, []);

        // Update the Item
        return super._updateObject(event, formData);
    }


    /* -------------------------------------------- */

    /**
     * Activate listeners for interactive item sheet events
     */
    activateListeners(html) {
        console.log("HERE--", html)
        super.activateListeners(html);
        // Save scroll position
        //console.log("Active")
        html.find(".tab.active")[0].scrollTop = this._scrollTab;
        html.find(".tab").scroll(ev => this._scrollTab = ev.currentTarget.scrollTop);

        // Modify damage formula
        html.find(".damage-control").click(this._onDamageControl.bind(this));
        html.find('input[name="system.damage.ord.dice"]').change(this._onDamageControl.bind(this));
        html.find('input[name="system.armor.LI"]').change(this._onDefenceControl.bind(this));
        html.find(".visualization-control").click(this._onActorResourceVisualizationControl.bind(this));
        html.find(".ability-adjustments-control").click(this._onAbilityAdjustmentsControl.bind(this));

        html.find('.modifier-create').click(this._onModifierCreate.bind(this));
        html.find('.modifier-edit').click(this._onModifierEdit.bind(this));
        html.find('.modifier-delete').click(this._onModifierDelete.bind(this));
        html.find('.modifier-toggle').click(this._onToggleModifierEnabled.bind(this));

        html.find('.add-storage').click(this._onAddStorage.bind(this));
        html.find('.remove-storage').click(this._onRemoveStorage.bind(this));
        html.find('select[name="storage.type"]').change(this._onChangeStorageType.bind(this));
        html.find('select[name="storage.subtype"]').change(this._onChangeStorageSubtype.bind(this));
        html.find('input[name="storage.amount"]').change(this._onChangeStorageAmount.bind(this));
        html.find('select[name="storage.weightProperty"]').change(this._onChangeStorageWeightProperty.bind(this));
        html.find('input[class="storage.acceptsType"]').change(this._onChangeStorageAcceptsItem.bind(this));
        html.find('input[name="storage.affectsEncumbrance"]').change(this._onChangeStorageAffectsEncumbrance.bind(this));

        html.find('input[class="data.supportedSizes"]').change(this._onChangeSupportedStarshipSizes.bind(this));

        html.find('img[name="resource-image"]').click(this._onClickResourceVisualizationImage.bind(this));
        html.find('img[name="resource-image"]').click(this._onClickResourceVisualizationImage.bind(this));
        html.find('select[name="resource-mode"]').change(this._onChangeResourceVisualizationMode.bind(this));
        html.find('input[name="resource-value"]').change(this._onChangeResourceVisualizationValue.bind(this));
        html.find('input[name="resource-title"]').change(this._onChangeResourceVisualizationTitle.bind(this));
        html.find('.item-action .loadOne').click(event => this._onItemLoadOrdn(event));
        html.find('.item-action .loadAll').click(event => this._onItemLoadOrdn(event));
        // Roll fire from item 
        /* -------------------------------------------- */
        /*  Starship Ordnance
        /* -------------------------------------------- */

        // Create New Item
        html.find('.ordnance-create').click(ev => this._onItemCreate(ev));
        //console.log("itemId",itemId,ev)

        html.find('.launchercell').click(ev => {
            //let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id");
            //console.log("launchercellclick\n",ev.currentTarget.dataset.ordn)
            //console.log("launchercellclick\n",ev,$(ev.currentTarget).parents(".item"))
            unloadLauncherOrdnance(ev.currentTarget.dataset.ordn, this.item)
            //const item = this.item.data.ordnance.get(itemId);
            // const item = this.actor.getEmbeddedEntity("Item", itemId);
            this.render(true);
        });


        // Update Inventory Item
        html.find('.ordnance-edit').click(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id");
            //console.log("itemId",itemId,ev)
            const item = this.item.data.ordnance.get(itemId);
            // const item = this.actor.getEmbeddedEntity("Item", itemId);
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.ordnance-delete').click(ev => this._onItemDelete(ev));

        // Item Dragging
        let handler = ev => this._onDragStart(ev);
        //console.log("anything")
        html.find('li.item').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

    }




    async _onItemLoadOrdn(event) {
        console.log("Ping", event)
        event.preventDefault();
        const loadType = event.currentTarget.dataset.load
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const cloost = event.currentTarget.closest('.item')
        //console.log("cloost",cloost)
        const item = this.actor.items.get(itemId);
        console.log("Item", item, itemId);
        //attackType = item.data.fireMode;
        //console.log("event",event)
        if (loadType == "loadOne") {
            loadLauncherOrdnance(item.data, this);
            return;
        }
        if (loadType == "loadAll") {
            loadLauncherOrdnance(item, this, true);
            return;
        }
        //item.rollAttack({event: event, attackType: attackType});

    }


    /**
         * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
         * @param {Event} event The originating click event
         */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        let type = header.dataset.type;
        if (!type || type.includes(",")) {
            let types = foundry.utils.duplicate(SFRPG.itemTypes);
            if (type) {
                let supportedTypes = type.split(',');
                for (let key of Object.keys(types)) {
                    if (!supportedTypes.includes(key)) {
                        delete types[key];
                    }
                }
            }

            let createData = {
                name: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Name"),
                type: type
            };

            let templateData = { upper: "Item", lower: "item", types: types },
                dlg = await renderTemplate(`systems/Alternityd100/templates/apps/localized-entity-create.html`, templateData);

            new Dialog({
                title: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Title"),
                content: dlg,
                buttons: {
                    create: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Button"),
                        callback: html => {
                            const form = html[0].querySelector("form");
                            let formDataExtended = new FormDataExtended(form);
                            foundry.utils.mergeObject(createData, formDataExtended.toObject());
                            if (!createData.name) {
                                createData.name = game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Name");
                            }

                            this.onBeforeCreateNewItem(createData);

                            this.actor.createEmbeddedDocuments("Item", [createData]);
                        }
                    }
                },
                default: "create"
            }).render(true);
            return null;
        }

        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type,
            data: foundry.utils.duplicate(header.dataset)
        };
        delete itemData.data['type'];

        this.onBeforeCreateNewItem(itemData);

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    onBeforeCreateNewItem(itemData) {

    }

    /**
     * Handle deleting an Owned Item for the actor
     * @param {Event} event The originating click event
     */
    async _onItemDelete(event) {
        event.preventDefault();

        let li = $(event.currentTarget).parents(".item"),
            itemId = li.attr("data-item-id");

        let actorHelper = new ActorItemHelper(this.actor.id, this.token ? this.token.id : null, this.token ? this.token.parent.id : null);
        let item = actorHelper.getItem(itemId);

        if (event.shiftKey) {
            actorHelper.deleteItem(itemId, true).then(() => {
                li.slideUp(200, () => this.render(false));
            });
        } else {
            let containsItems = (item.system.container?.contents && item.system.container.contents.length > 0);
            ItemDeletionDialog.show(item.name, containsItems, (recursive) => {
                actorHelper.deleteItem(itemId, recursive).then(() => {
                    li.slideUp(200, () => this.render(false));
                });
            });
        }
    }

    /* -------------------------------------------- */

    async _onAbilityAdjustmentsControl(event) {
        event.preventDefault();
        const a = event.currentTarget;

        // Add new ability adjustment component
        if (a.classList.contains("add-ability-adjustment")) {
            await this._onSubmit(event);
            const abilityMods = this.item.system.abilityMods;
            return this.item.update({
                "system.abilityMods.parts": abilityMods.parts.concat([
                    [0, ""]
                ])
            });
        }

        // Remove an ability adjustment component
        if (a.classList.contains("delete-ability-adjustment")) {
            await this._onSubmit(event);
            const li = a.closest(".ability-adjustment-part");
            const abilityMods = foundry.utils.duplicate(this.item.system.abilityMods);
            abilityMods.parts.splice(Number(li.dataset.abilityAdjustment), 1);
            return this.item.update({
                "system.abilityMods.parts": abilityMods.parts
            });
        }
    }

    /**
     * Add or remove a damage part from the damage formula
     * @param {Event} event     The original click event
     * @return {Promise}
     * @private
     */
    async _onDamageControl(event) {
        event.preventDefault();
        const a = event.currentTarget;
        //console.log("ADD DAMAGE",this.item);
        // Add new damage component

        this.item.hasDamage = this.item.hasDamage;
        //console.log("hasDamage ",this.item,this.item.data.hasDamage,this.item.hasDamage);

        if (this.item.system.damage.ord.dice == "") { this.item.data.hasDamage = false } else { this.item.data.hasDamage = true };

        //console.log("hasDamage 2 ",this.item,this.item.data.hasDamage,this.item.hasDamage);

        //(this.item.system.damage.ord.dice && this.item.system.damage.ord.type);
        //this.item.hasDamage = (this.item.system.damage.ord.dice && this.item.system.damage.ord.type);




        // Add new damage component
        if (a.classList.contains("add-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const damage = this.item.system.damage;
            return this.item.update({
                "system.damage.parts": damage.parts.concat([
                    { formula: "", types: {}, operator: "" }
                ])
            });
        }

        // Remove a damage component
        if (a.classList.contains("delete-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const damage = foundry.utils.duplicate(this.item.system.damage);
            damage.parts.splice(Number(li.dataset.damagePart), 1);
            return this.item.update({
                "system.damage.parts": damage.parts
            });
        }
        return this.item.update();
        /* Add new critical damage component
        if (a.classList.contains("add-critical-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const criticalDamage = this.item.system.critical;
            return this.item.update({
                "data.critical.parts": criticalDamage.parts.concat([
                    ["", ""]
                ])
            });
        }

        // Remove a critical damage component
        if (a.classList.contains("delete-critical-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const criticalDamage = foundry.utils.duplicate(this.item.system.critical);
            criticalDamage.parts.splice(Number(li.dataset.criticalPart), 1);
            return this.item.update({
                "data.critical.parts": criticalDamage.parts
            });
        }*/
    }
    /**
         * Add or remove a damage part from the damage formula
         * @param {Event} event     The original click event
         * @return {Promise}
         * @private
         */
    async _onDefenceControl(event) {
        event.preventDefault();
        const a = event.currentTarget;
        console.log("ADD DAMAGE", this.item);
        // Add new damage component

        this.item.data.hasdefence = this.item.hasdefence;


        if (this.item.system.armor.LI == "") { this.item.data.hasdefence = false } else { this.item.data.hasdefence = true };

        //console.log("hasDamage 2 ",this.item,this.item.data.hasDamage,this.item.hasDamage);



        return this.item.update();

    }

    /**
     * Add a modifer to this item.
     * 
     * @param {Event} event The originating click event
     */
    _onModifierCreate(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        //console.log("Modifier L574",this.item)
        this.item.addModifier({
            name: "New Modifier"

        });
    }

    /**
     * Delete a modifier from the item.
     * 
     * @param {Event} event The originating click event
     */
    async _onModifierDelete(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        await this.item.deleteModifier(modifierId);
    }

    /**
     * Edit a modifier for an item.
     * 
     * @param {Event} event The orginating click event
     */
    _onModifierEdit(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        this.item.editModifier(modifierId);
    }

    /**
     * Toggle a modifier to be enabled or disabled.
     * 
     * @param {Event} event The originating click event
     */
    async _onToggleModifierEnabled(event) {
        event.preventDefault();
        console.log("hello")
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        const modifiers = foundry.utils.duplicate(this.item.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === modifierId);
        modifier.enabled = !modifier.enabled;
        console.log("hello", modifier, modifiers, modifier.enabled)
        await this.item.update({
            'system.modifiers': modifiers
        });
    }

    async _onAddStorage(event) {
        event.preventDefault();

        let storage = foundry.utils.duplicate(this.item.system.container.storage);
        storage.push({
            type: "bulk",
            subtype: "",
            amount: 0,
            acceptsType: [],
            weightMultiplier: 1,
            weightProperty: ""
        });
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onRemoveStorage(event) {
        event.preventDefault();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = foundry.utils.duplicate(this.item.system.container.storage);
        storage.splice(slotIndex, 1);
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageType(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = foundry.utils.duplicate(this.item.system.container.storage);
        storage[slotIndex].type = event.currentTarget.value;
        if (storage[slotIndex].type === "bulk") {
            storage[slotIndex].subtype = "";
            storage[slotIndex].weightProperty = "bulk";
        } else {
            storage[slotIndex].weightProperty = "";
        }
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageSubtype(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = foundry.utils.duplicate(this.item.system.container.storage);
        storage[slotIndex].subtype = event.currentTarget.value;
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageAmount(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const inputNumber = Number(event.currentTarget.value);
        if (!Number.isNaN(inputNumber)) {
            let storage = foundry.utils.duplicate(this.item.system.container.storage);
            storage[slotIndex].amount = inputNumber;
            await this.item.update({
                "data.container.storage": storage
            });
        }
    }

    async _onChangeStorageWeightProperty(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = foundry.utils.duplicate(this.item.system.container.storage);
        storage[slotIndex].weightProperty = event.currentTarget.value;
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeStorageAcceptsItem(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        const itemType = event.currentTarget.name;
        const enabled = event.currentTarget.checked;

        let storage = foundry.utils.duplicate(this.item.system.container.storage);
        if (enabled) {
            if (!storage[slotIndex].acceptsType.includes(itemType)) {
                storage[slotIndex].acceptsType.push(itemType);
            }
        } else {
            if (storage[slotIndex].acceptsType.includes(itemType)) {
                storage[slotIndex].acceptsType = storage[slotIndex].acceptsType.filter(x => x !== itemType);
            }
        }
        await this.item.update({
            "data.container.storage": storage
        });
    }

    async _onChangeSupportedStarshipSizes(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const toggleSize = event.currentTarget.name;
        const enabled = event.currentTarget.checked;

        let supportedSizes = foundry.utils.duplicate(this.item.system.supportedSizes);
        if (enabled && !supportedSizes.includes(toggleSize)) {
            supportedSizes.push(toggleSize);
        } else if (!enabled && supportedSizes.includes(toggleSize)) {
            supportedSizes = supportedSizes.filter(x => x !== toggleSize);
        }

        await this.item.update({
            "data.supportedSizes": supportedSizes
        });
    }

    async _onChangeStorageAffectsEncumbrance(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        let li = $(event.currentTarget).parents(".storage-slot");
        const slotIndex = li.attr("data-slot-index");

        let storage = foundry.utils.duplicate(this.item.system.container.storage);
        storage[slotIndex].affectsEncumbrance = event.currentTarget.checked;
        await this.item.update({
            "data.container.storage": storage
        });
    }

    /** Actor resource visualization */
    async _onActorResourceVisualizationControl(event) {
        event.preventDefault();
        const a = event.currentTarget;

        // Add new visualization rule
        if (a.classList.contains("add-visualization")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const visualization = foundry.utils.duplicate(this.item.system.combatTracker.visualization);
            return this.item.update({
                "data.combatTracker.visualization": visualization.concat([
                    { mode: "eq", value: 0, title: this.item.name, image: this.item.img }
                ])
            });
        }

        // Remove a visualization rule
        if (a.classList.contains("delete-visualization")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".visualization-part");
            const visualization = foundry.utils.duplicate(this.item.system.combatTracker.visualization);
            visualization.splice(Number(li.dataset.index), 1);
            return this.item.update({
                "data.combatTracker.visualization": visualization
            });
        }
    }

    async _onClickResourceVisualizationImage(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const parent = $(event.currentTarget).parents(".visualization-part");
        const visualizationIndex = $(parent).attr("data-index");

        const visualization = foundry.utils.duplicate(this.item.system.combatTracker.visualization);
        const currentImage = visualization[visualizationIndex].image || this.item.img;

        const attr = event.currentTarget.dataset.edit;
        const fp = new FilePicker({
            type: "image",
            current: currentImage,
            callback: path => {
                visualization[visualizationIndex].image = path;
                this.item.update({
                    "data.combatTracker.visualization": visualization
                });
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    async _onChangeResourceVisualizationMode(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const parent = $(event.currentTarget).parents(".visualization-part");
        const visualizationIndex = $(parent).attr("data-index");

        const visualization = foundry.utils.duplicate(this.item.system.combatTracker.visualization);
        visualization[visualizationIndex].mode = event.currentTarget.value;

        return this.item.update({
            "data.combatTracker.visualization": visualization
        });
    }

    async _onChangeResourceVisualizationValue(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const parent = $(event.currentTarget).parents(".visualization-part");
        const visualizationIndex = $(parent).attr("data-index");

        const visualization = foundry.utils.duplicate(this.item.system.combatTracker.visualization);
        visualization[visualizationIndex].value = Number(event.currentTarget.value);
        if (Number.isNaN(visualization[visualizationIndex].value)) {
            visualization[visualizationIndex].value = 0;
        }

        return this.item.update({
            "data.combatTracker.visualization": visualization
        });
    }

    async _onChangeResourceVisualizationTitle(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const parent = $(event.currentTarget).parents(".visualization-part");
        const visualizationIndex = $(parent).attr("data-index");

        const visualization = foundry.utils.duplicate(this.item.system.combatTracker.visualization);
        visualization[visualizationIndex].title = event.currentTarget.value;

        return this.item.update({
            "data.combatTracker.visualization": visualization
        });
    }

    /** @override */
    async _render(...args) {
        await super._render(...args);

        if (this._tooltips === null) {


            //console.log("Hello","Tooltips:",this._tooltips,this)


            this._tooltips = tippy.delegate(`#${this.id}`, {
                target: '[data-tippy-content]',
                allowHTML: true,
                arrow: false,
                placement: 'top-start',
                duration: [500, null],
                delay: [800, null]


            });
            /**/
            //console.log("Tooltips:",this._tooltips)
        }
    }

    async close(...args) {
        if (this._tooltips !== null) {
            for (const tooltip of this._tooltips) {
                tooltip.destroy();
            }

            this._tooltips = null;
        }

        return super.close(...args);
    }


    async _onDrop(event) {
        event.preventDefault();
        let a = foundry.utils.duplicate(event.dataTransfer)
        // console.log("This did Something", event)
        const dragData = event.dataTransfer.getData('text/plain');
        //console.log("dragData", dragData)
        // const parsedDragData = JSON.parse(dragData);
        // console.log("TparsedDragData", parsedDragData)
        //delete(this.item.system.ordnance);
        //delete(this.item.system.ordnance);

        // console.log("This did Something", event)
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (!data) {

                return false;
            }
        } catch (err) {
            //console.log("This did nothing", data)
            ui.notifications.warn("This Feature not yet incorporated");
            return false;
        }
        console.log("This did somthing", data, this)
        //console.log("This did Something", this)
        // Is this a Launcher
        //console.log(this)
        if (this.item.isLauncher) {

            //console.log("This did Something", this)

            //  console.log("rawItemData",this.item.type)
            // console.log("rawItemData",data)

            // Case - Dropped starshipOrdnance onto Launcher
            if ((this.item.type === "starshipWeapon") && (data.type === "Item")) {

                const rawItemData = await this._getItemDropData(event, data);
                //console.log("this.item",this.item,rawItemData)
                //console.log("rawItemData",data.type)
                //console.log("rawItemData",rawItemData, "\n", rawItemData.system.ammunitionType, this.item.system.weaponType )

                //console.log("rawItemData",rawItemData, "\n" )

                if ((rawItemData.type === "starshipOrdnance") && (rawItemData.system.ammunitionType === this.item.system.weaponType)) {

                    loadLauncherOrdnance(rawItemData, this);




                }
                /*else if (d100AActorSheetStarship.AcceptedEquipment.includes(rawItemData.type)) {
                    return this.processDroppedData(event, data);
                } */
                else {
                    ui.notifications.error(game.i18n.format("SFRPG.InvalidStarshipItem", { name: rawItemData.name }));
                    return false;
                }




                // return this._onOrdnanceDrop(event, data);
            }

            /*
            else if (data.type === "Item") {
                const rawItemData = await this._getItemDropData(event, data);
        
                if (rawItemData.type.startsWith("starship")) {
                    return this.actor.createEmbeddedDocuments("Item", [rawItemData]);
                } else if (d100AActorSheetStarship.AcceptedEquipment.includes(rawItemData.type)) {
                    return this.processDroppedData(event, data);
                } else {
                    ui.notifications.error(game.i18n.format("SFRPG.InvalidStarshipItem", { name: rawItemData.name }));
                    return false;
                }
            } else if (data.type === "ItemCollection") {
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
        
            */
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
        let item = null;
        data.id = data.uuid.slice(-16)
        console.log(event, data)
        const actor = this.actor;
        if (data.pack) {
            const pack = game.packs.get(data.pack);
            if (pack.metadata.entity !== "Item") return;
            itemData = await pack.getDocument(data.id);
        } else if (data.system) {
            let sameActor = data.actorId === actor.id;
            if (sameActor && actor.isToken) sameActor = data.tokenId === actor.token.id;
            if (sameActor) {
                await this._onSortItem(event, data.system);
            }
            itemData = data.system;
        } else {
            item = game.items.get(data.id);
            //console.log(item, data.uuid,data.id)
            if (!item) return;
            itemData = item.system;
            itemData.name = item.name
        }
        //console.log(itemData)
        let dup = foundry.utils.duplicate(item)

        //console.log(dup)
        return dup;
    }


    /*
        async _onDrop(event) {
            event.preventDefault();
        
            const dragData = event.dataTransfer.getData('text/plain');
            const parsedDragData = JSON.parse(dragData);
      //console.log("dragdata", event.dataTransfer,"dragdata", dragData)
            if (!parsedDragData) {
          //console.log("Unknown item data");
                return;
            }
        
            return this.processDroppedData(event, parsedDragData);
        }
    
        async processDroppedData(event, parsedDragData) {
      //console.log(this,event,parsedDragData);
            if (true) {
                ui.notifications.warn("Well this worked!!!");
                //ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragToExternalTokenError"));
                return;
            }
        }
    */



}
