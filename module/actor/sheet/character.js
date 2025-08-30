import { SFRPG } from "../../config.js"
import { d100ActorSheet } from "../../d100Actor-sheet.js";
import { computeCompoundBulkForItem } from "../actor-inventory-utils.js"
import { EntitySheetHelper } from "../../helper.js";
import { ActorSheetSFRPG } from "./base.js";
import { ATTRIBUTE_TYPES } from "../../constants.js";


let DEFAULT_TOKEN = "systems/Alternityd100/images/mystery-body.png"
export class d100AActorSheetCharacter extends d100ActorSheet {
    //export class d100AActorSheetCharacter extends ActorSheetSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        foundry.utils.mergeObject(options, {
            classes: ["Alternityd100", "sheet", "actor", 'character'],
            //classes: ["Alternityd100", "sheet", "actor", 'character'],
            width: 750,
            height: 600,
            //tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "inventory"}],
            scrollY: [".biography", ".items", ".attributes", ".skills", ".inventory"],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
        });

        return options;
    }

    get template() {
        const path = "systems/Alternityd100/templates/actors/";
        //  if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "character-sheet.html";
    }

    async getData() {
        const context = super.getData();
        const isOwner = this.document.isOwner;
        //EntitySheetHelper.getAttributeData(context.data);
        context.shorthand = !!game.settings.get("Alternityd100", "macroShorthand");

        //const isOwner = this.document.isOwner;
        const data2 = foundry.utils.duplicate(this.actor.system);

        data2.attributes = context.document.system.attributes;
        //console.log(this,context)


        context.actor = this.actor;
        context.system = data2;
        context.isOwner = isOwner;
        context.isGM = game.user.isGM;
        context.limited = this.object.limited;
        context.options = this.options;
        context.editable = this.isEditable;
        context.cssClass = isOwner ? "editable" : "locked";
        context.isCharacter = this.object.type === "character";
        context.isShip = this.object.type === 'starship';
        context.isVehicle = this.object.type === 'vehicle';
        context.isDrone = this.object.type === 'drone';
        context.isNPC = this.object.type === 'npc';
        context.isHazard = this.object.type === 'hazard';
        context.config = CONFIG.SFRPG;
        context.d100Aconfig = CONFIG.d100A;
        context.shorthand = !!game.settings.get("Alternityd100", "macroShorthand");
        context.systemData = context.document.system;
        //systemData  = this.document.system;
        context.testvalue = { name: this.actor.token?.inCombat, type: "Thing" };
        context.dtypes = ATTRIBUTE_TYPES;




        context.items = this.actor.items.map(i => {
            i.system.labels = i.labels;
            return i.system;
        });
        context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        context.labels = this.actor.labels || {};
        context.filters = this._filters;
        //console.log(data2,"\n",context,"\n",this);
        // if (!data.data?.details?.biography?.fullBodyImage)


        //console.log("THIS ACTOR--------------------",data, context );

        // Not sure if this does anything

        EntitySheetHelper.getAttributeData(data2);
        this._prepareItems(context);

        context.enrichedBiography = await TextEditor.enrichHTML(this.object.system.details.biography.value, { async: true });
        context.enrichedGMNotes = await TextEditor.enrichHTML(this.object.system.details.biography.gmNotes, { async: true });
        /*
                data3.status = {}
                data3.status = {"durability":{"stu":{"good":[],"bad":[]},"wou":{"good":[],"bad":[]},"mor":{"good":[],"bad":[]}}}
                data3.statusd = "fdgsdfg"
                data3.status.image = {"bad": "systems/Alternityd100/icons/conditions/alt_bad2.png","good": "systems/Alternityd100/icons/conditions/alt_good1.png" }
              // console.log(this)
                // load the main 
                for ( let [k, v] of Object.entries(data3.status.durability) ) {
               // for (const [v,k] of data.status.durability) {
                for (let i = 0; i < this.actor.system?.attributes[k].max;i++)
                {
                    //console.log(this.actor.system?.attributes[k].value,k,v,i)
                    if (this.actor.system?.attributes[k].value > i ) v.good.push({"value":i,"title":i-this.actor.system?.attributes[k].value});
                    else v.bad.push({"value":i,"title":i-this.actor.system?.attributes[k].value+1});
        
                }
                 }
        
        */


        //  console.log("This Sheet\n",  this)
        return context;
    }

    /**
     * Organize and classify items for character sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {

        //console.log(data);
        const actorData = data;

        const inventory = {
            weapon: { label: game.i18n.format(SFRPG.itemTypes["weapon"]), items: [], dataset: { type: "weapon" }, allowAdd: true },
            shield: { label: game.i18n.format(SFRPG.itemTypes["shield"]), items: [], dataset: { type: "shield" }, allowAdd: true },
            equipment: { label: game.i18n.format(SFRPG.itemTypes["equipment"]), items: [], dataset: { type: "equipment" }, allowAdd: true },
            //   ammunition: { label: game.i18n.format(SFRPG.itemTypes["ammunition"]), items: [], dataset: { type: "ammunition" }, allowAdd: true },
            sensor: { label: game.i18n.format(SFRPG.itemTypes["sensor"]), items: [], dataset: { type: "sensor" }, allowAdd: true },
            clothing: { label: game.i18n.format(SFRPG.itemTypes["clothing"]), items: [], dataset: { type: "clothing" }, allowAdd: true },
            communication: { label: game.i18n.format(SFRPG.itemTypes["communication"]), items: [], dataset: { type: "communication" }, allowAdd: true },
            computer: { label: game.i18n.format(SFRPG.itemTypes["computer"]), items: [], dataset: { type: "computer" }, allowAdd: true },
            medical: { label: game.i18n.format(SFRPG.itemTypes["medical"]), items: [], dataset: { type: "medical" }, allowAdd: true },
            professional: { label: game.i18n.format(SFRPG.itemTypes["professional"]), items: [], dataset: { type: "professional" }, allowAdd: true },
            survival: { label: game.i18n.format(SFRPG.itemTypes["survival"]), items: [], dataset: { type: "survival" }, allowAdd: true },
            miscellaneous: { label: game.i18n.format(SFRPG.itemTypes["miscellaneous"]), items: [], dataset: { type: "miscellaneous" }, allowAdd: true },
            pharmaceutical: { label: game.i18n.format(SFRPG.itemTypes["pharmaceutical"]), items: [], dataset: { type: "pharmaceutical" }, allowAdd: true },


            //  goods: { label: game.i18n.format(SFRPG.itemTypes["goods"]), items: [], dataset: { type: "goods" }, allowAdd: true },

            // container: { label: game.i18n.format(SFRPG.itemTypes["container"]), items: [], dataset: { type: "container" }, allowAdd: true },
            //  technological: { label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.SpecialItems"), items: [], dataset: { type: "technological,magic,hybrid" }, allowAdd: true },
            //  fusion: { label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.EquipmentEnhancements"), items: [], dataset: { type: "fusion,upgrade,weaponAccessory" }, allowAdd: true },
            augmentation: { label: game.i18n.format(SFRPG.itemTypes["augmentation"]), items: [], dataset: { type: "augmentation" }, allowAdd: true }



        };





        let physicalInventoryItems = [];
        for (const [key, value] of Object.entries(inventory)) {
            const datasetType = value.dataset.type;
            const types = datasetType.split(',');
            physicalInventoryItems = physicalInventoryItems.concat(types);
        }
        /*console.log("physicalInventoryItems" , physicalInventoryItems)*/
        //   0      1       2      3        4      5       6           7            8           9                10   asis,
        let [items, spells, feats, profession, races, perks, flaws, achievements, archetypes, conditionItems, actorResources, psionCon, psionInt, psionWil, psionPer] = data.actor.items.reduce((arr, item) => {
            //console.log(item)
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.quantity ? item.quantity > 1 : false;
            item.isOnCooldown = item.recharge && !!item.recharge.value && (item.recharge.charged === false);
            if (["meleeW"].includes(item.weaponType)) { item.actionType = "mwak" }
            if (["rangedW", "explos", "heavyW"].includes(item.weaponType)) { item.actionType = "rwak" }
            
            //  console.log(item.type === "psionic" , item.system.ability)

            //item.hasAttack = ["mwak", "rwak", "msak", "rsak"].includes(item.actionType) //&& (!["weapon", "shield"].includes(item.type) || item.system.equipped);
            //console.log("HD",item,["weapon", "shield"].includes(item.type))

            //item.hasDamage = ["weapon", "shield"].includes(item.type) ? !!(item.damage.ord.dice && item.damage.ord.type) && (!["weapon", "shield"].includes(item.type) || item.equipped) : false;
            //item.hasdefence = ["equipment", "shield"].includes(item.type) ? !!(item.armor.EN && item.armor.LI && item.armor.HI) && (!["equipment", "shield"].includes(item.type) || item.data.equipped) : false;

            //console.log("HD/HA",item.hasDamage,item.hasAttack)//!!(item.data.damage.ord.dice && item.data.damage.ord.type))
            //item.hasDamage = !!(item.data.damage.ord.dice && item.data.damage.ord.type) && (!["weapon", "shield"].includes(item.type) || item.data.equipped);
            //item.hasUses = item.document.canBeUsed();
            item.isCharged = !item.hasUses || item.getRemainingUses() <= 0 || !item.isOnCooldown;
            //console.log("\n\n\n\n************************\n\nItem\n\n\n**********\n\n" , item)
            //item.hasCapacity = item.hasCapacity();
            //console.log("item", item)
            if (item.hasCapacity) {
                item.capacityCurrent = item.getCurrentCapacity;
                item.capacityMaximum = item.getMaxCapacity;
            }

            if (item.type === "actorResource") {
                this._prepareActorResource(item, actorData);
            }

            if (item.type === "spell") {
                const container = data.items.find(x => x.system.container?.contents?.find(x => x.id === item._id) || false);
                if (!container) {
                    arr[1].push(item); // spells
                } else {
                    arr[0].push(item); // items
                }
            }
            else if (item.type === "feat") {
                if ((item.system.requirements?.toLowerCase() || "") === "condition") {
                    arr[9].push(item); // conditionItems
                } else {
                    arr[2].push(item); // feats
                }
                item.isFeat = true;
            }

            else if ((item.type === "psionic") && (item.system.ability === "con")) arr[11].push(item); // classes
            else if ((item.type === "psionic") && (item.system.ability === "int")) arr[12].push(item); // classes
            else if ((item.type === "psionic") && (item.system.ability === "wil")) arr[13].push(item); // classes
            else if ((item.type === "psionic") && (item.system.ability === "per")) arr[14].push(item); // classes



            else if (item.type === "profession") arr[3].push(item); // classes
            else if (item.type === "race") arr[4].push(item); // races
            else if (item.type === "perk") arr[5].push(item); // perks
            else if (item.type === "flaw") arr[6].push(item); // flaws
            else if (item.type === "achievement") arr[7].push(item); // achievements
            else if (item.type === "archetypes") arr[8].push(item); // archetypes
            // else if (item.type === "asi") arr[9].push(item); // asis
            else if (item.type === "actorResource") arr[10].push(item); // asis
            else if (physicalInventoryItems.includes(item.type)) arr[0].push(item); // items
            else arr[0].push(item); // items
            // console.log(arr);
            return arr;
        }, [[], [], [], [], [], [], [], [], [], [], [], [], [], [], []]);

        //const spellbook = this._prepareSpellbook(data, spells);

        let totalValue = 0;
        for (const i of items) {
            i.img = i.img || DEFAULT_TOKEN;

            if (!physicalInventoryItems.includes(i.type)) {
                continue;
            }

            i.system.quantity = i.system.quantity || 0;
            i.system.price = i.system.price || 0;
            i.system.bulk = i.system.bulk || "-";
            i.isOpen = i.system.container?.isOpen === undefined ? true : i.system.container.isOpen;

            let weight = 0;
            if (i.system.bulk === "L") {
                weight = 0.1;
            } else if (i.system.bulk === "-") {
                weight = 0;
            } else {
                weight = parseFloat(i.system.bulk);
            }

            // Compute number of packs based on quantityPerPack, provided quantityPerPack is set to a value.
            let packs = 1;
            if (i.system.quantityPerPack === null || i.system.quantityPerPack === undefined) {
                packs = i.system.quantity;
            } else {
                if (i.system.quantityPerPack <= 0) {
                    packs = 0;
                } else {
                    packs = Math.floor(i.system.quantity / i.system.quantityPerPack);
                }
            }

            i.totalWeight = packs * weight;
            if (i.system.equippedBulkMultiplier !== undefined && i.system.equipped) {
                i.totalWeight *= i.system.equippedBulkMultiplier;
            }
            i.totalWeight = i.totalWeight < 1 && i.totalWeight > 0 ? "L" :
                i.totalWeight === 0 ? "-" : Math.floor(i.totalWeight);

            totalValue += (i.system.price * packs);
        }

        this.processItemContainment(items, function (itemType, itemData) {
            let targetItemType = itemType;
            if (!(itemType in inventory)) {
                for (let [key, entry] of Object.entries(inventory)) {
                    // if (!entry.dataset.type) {console.log(entry); break};
                    if (entry.dataset.type.includes(itemType)) {
                        targetItemType = key;
                        break;
                    }
                }
            }

            if (!(targetItemType in inventory)) {
                let label = "SFRPG.Items.Categories.MiscellaneousItems";
                if (targetItemType in SFRPG.itemTypes) {
                    label = SFRPG.itemTypes[targetItemType];
                } else {
                    //console.log(`Item '${itemData.item.name}' with type '${targetItemType}' is not a registered item type!`);
                }
                inventory[targetItemType] = { label: game.i18n.format(label), items: [], dataset: {}, allowAdd: false };
            }
            inventory[targetItemType].items.push(itemData);
        });

        let totalWeight = 0;
        for (const section of Object.entries(inventory)) {
            for (const sectionItem of section[1].items) {
                if (!(sectionItem.item.type in inventory)) {
                    continue;
                }

                const itemBulk = computeCompoundBulkForItem(sectionItem.item, sectionItem.contents);
                totalWeight += itemBulk;
            }
        }
        totalWeight = Math.floor(totalWeight / 10); // Divide bulk by 10 to correct for integer-space bulk calculation.
        let encumbrance = this._computeEncumbrance(totalWeight, actorData.actor.system);
        let inventoryValue = Math.floor(totalValue);

        //const psionics = psion

        const features = {
            profession: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Profession"), items: [], hasActions: false, dataset: { type: "profession" }, isClass: true },
            race: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Race"), items: [], hasActions: false, dataset: { type: "race" }, isRace: true },
            perk: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Perk"), items: [], hasActions: false, dataset: { type: "perk" }, isPerk: true },
            flaw: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Flaw"), items: [], hasActions: false, dataset: { type: "flaw" }, isFlaw: true },
            achievement: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Achievement"), items: [], hasActions: false, dataset: { type: "achievement" }, isAchievement: true },
            //asi: { label: game.i18n.format("SFRPG.Items.Categories.AbilityScoreIncrease"), items: asis, hasActions: false, dataset: { type: "asi" }, isASI: true },
            archetypes: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Archetypes"), items: [], dataset: { type: "archetypes" }, isArchetype: true },
            active: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActiveFeats"), items: [], hasActions: true, dataset: { type: "feat", "activation.type": "action" } },
            passive: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.PassiveFeats"), items: [], hasActions: false, dataset: { type: "feat" } },
            resources: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActorResources"), items: [], hasActions: false, dataset: { type: "actorResource" } }
        };



        for (let f of feats) {
            if (f.system.activation.type) features.active.items.push(f);
            else features.passive.items.push(f);
        }

        profession.sort((a, b) => b.levels - a.levels);
        // console.log(races,flaws,achievements,archetypes)
        features.profession.items = profession;
        features.race.items = races;
        features.perk.items = perks;
        features.flaw.items = flaws;
        features.achievement.items = achievements;
        //features.asi.items = asis;
        features.archetypes.items = archetypes;
        features.resources.items = actorResources;

        data.inventory = Object.values(inventory);
        //data.spellbook = spellbook;



        data.features = Object.values(features);

        let psionScore = {}
        const attrib = this.document.system.abilities
        for (const [k, v] of Object.entries(attrib)) {
            psionScore[k] = attrib[k].value + "/" + Math.floor(attrib[k].value / 2) + "/" + Math.floor(attrib[k].value / 4)
        }

        for (const [k, v] of Object.entries(psionCon)) {
            console.log(k, v, v.name, this.document.system.abilities)
            v.ordinary = this.document.system.abilities.con.value + (v.system.rank || 0)
            v.good = Math.floor(v.ordinary / 2)
            v.amazing = Math.floor(v.ordinary / 4)
            v.step = 0
            v.psionScore = v.ordinary + "/" + v.good + "/" + v.amazing
        }
        for (const [k, v] of Object.entries(psionInt)) {
            console.log(k, v, v.name, this.document.system.abilities)
            v.ordinary = this.document.system.abilities.int.value + (v.system.rank || 0)
            v.good = Math.floor(v.ordinary / 2)
            v.amazing = Math.floor(v.ordinary / 4)
            v.step = 0
            v.psionScore = v.ordinary + "/" + v.good + "/" + v.amazing
        }
        for (const [k, v] of Object.entries(psionWil)) {
            console.log(k, v, v.name, this.document.system.abilities)
            v.ordinary = this.document.system.abilities.wil.value + (v.system.rank || 0)
            v.good = Math.floor(v.ordinary / 2)
            v.amazing = Math.floor(v.ordinary / 4)
            v.step = 0
            v.psionScore = v.ordinary + "/" + v.good + "/" + v.amazing
        }
        for (const [k, v] of Object.entries(psionPer)) {
            console.log(k, v, v.name, this.document.system.abilities)
            v.ordinary = this.document.system.abilities.per.value + (v.system.rank || 0)
            v.good = Math.floor(v.ordinary / 2)
            v.amazing = Math.floor(v.ordinary / 4)
            v.step = 0
            v.psionScore = v.ordinary + "/" + v.good + "/" + v.amazing
        }


        //console.log(psionCon,psionInt)
        const psionics = {
            con: { score: psionScore.con, label: game.i18n.format("d100A.PsionBroadSkills.con.name"), tooltip: "d100A.PsionBroadSkills.con.tooltip", items: [], hasActions: false, dataset: { type: "psionic", stat: "con" }, isPsionic: true },
            int: { score: psionScore.int, label: game.i18n.format("d100A.PsionBroadSkills.int.name"), tooltip: "d100A.PsionBroadSkills.int.tooltip", items: [], hasActions: false, dataset: { type: "psionic", stat: "int" }, isPsionic: true },
            wil: { score: psionScore.wil, label: game.i18n.format("d100A.PsionBroadSkills.wil.name"), tooltip: "d100A.PsionBroadSkills.wil.tooltip", items: [], hasActions: false, dataset: { type: "psionic", stat: "wil" }, isPsionic: true },
            per: { score: psionScore.per, label: game.i18n.format("d100A.PsionBroadSkills.per.name"), tooltip: "d100A.PsionBroadSkills.per.tooltip", items: [], hasActions: false, dataset: { type: "psionic", stat: "per" }, isPsionic: true }
        }


        psionics.con.items = Object.values(psionCon);
        psionics.int.items = Object.values(psionInt),
            psionics.wil.items = Object.values(psionWil);
        psionics.per.items = Object.values(psionPer);




        data.psionics = Object.values(psionics);

        const modifiers = {
            conditions: { label: "SFRPG.ModifiersConditionsTabLabel", modifiers: [], dataset: { subtab: "conditions" }, isConditions: true },
            permanent: { label: "SFRPG.ModifiersPermanentTabLabel", modifiers: [], dataset: { subtab: "permanent" } },
            temporary: { label: "SFRPG.ModifiersTemporaryTabLabel", modifiers: [], dataset: { subtab: "temporary" } }
        };
        //console.log("-----actorData",actorData,modifiers)
        let [permanent, temporary, itemModifiers, conditions, misc] = actorData.actor.system.modifiers.reduce((arr, modifier) => {
            if (modifier.subtab === "permanent") arr[0].push(modifier);
            else if (modifier.subtab === "conditions") arr[3].push(modifier);
            else arr[1].push(modifier); // Any unspecific categories go into temporary.

            return arr;
        }, [[], [], [], [], []]);

        //modifiers.conditions.items = conditionItems;
        modifiers.conditions.items = []

        modifiers.permanent.modifiers = permanent;
        modifiers.temporary.modifiers = temporary.concat(conditions);

        data.modifiers = Object.values(modifiers);
        //console.log("\n------Data-----\n", data)
    }

    /**
     * Compute the level and percentage of encumbrance for an Actor.
     * 
     * @param {Number} totalWeight The cumulative item weight from inventory items
     * @param {Object} actorData The data object for the Actor being rendered
     * @returns {Object} An object describing the character's encumbrance level
     * @private
     */
    _computeEncumbrance(totalWeight, actorData) {

        //console.log("actorData", actorData )
        const enc = {
            max: actorData.attributes.encumbrance.max,
            tooltip: actorData.attributes.encumbrance.tooltip,
            value: totalWeight
        };

        enc.pct = Math.min(enc.value * 100 / enc.max, 99);
        enc.encumbered = enc.pct > 50;
        return enc;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {JQuery} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        //console.log("HERE--",html)
        super.activateListeners(html);

        if (!this.options.editable) return;

        html.find('.toggle-prepared').click(this._onPrepareItem.bind(this));
        html.find('.reload').on('click', this._onReloadWeapon.bind(this));

        //html.find('.short-rest').on('click', this._onShortRest.bind(this));
        //html.find('.long-rest').on('click', this._onLongRest.bind(this));
        html.find('.modifier-create').on('click', this._onModifierCreate.bind(this));
        html.find('.modifier-edit').on('click', this._onModifierEdit.bind(this));
        html.find('.modifier-delete').on('click', this._onModifierDelete.bind(this));
        html.find('.modifier-toggle').on('click', this._onToggleModifierEnabled.bind(this));
    }





    onBeforeCreateNewItem(itemData) {
        super.onBeforeCreateNewItem(itemData);

        if (itemData["type"] === "asi") {
            const numASI = this.actor.items.filter(x => x.type === "asi").length;
            const level = 5 + numASI * 5;
            itemData.name = game.i18n.format("SFRPG.ItemSheet.AbilityScoreIncrease.ItemName", { level: level });
        }
    }

    /**
     * Add a modifer to this actor.
     * 
     * @param {Event} event The originating click event
     */
    _onModifierCreate(event) {
        event.preventDefault();
        const target = $(event.currentTarget);

        this.actor.addModifier({
            name: "New Modifier",
            subtab: target.data('subtab')
        });
    }

    /**
     * Delete a modifier from the actor.
     * 
     * @param {Event} event The originating click event
     */
    async _onModifierDelete(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        await this.actor.deleteModifier(modifierId);
    }

    /**
     * Edit a modifier for an actor.
     * 
     * @param {Event} event The orginating click event
     */
    _onModifierEdit(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        this.actor.editModifier(modifierId);
    }

    /**
     * Toggle a modifier to be enabled or disabled.
     * 
     * @param {Event} event The originating click event
     */
    async _onToggleModifierEnabled(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        const modifiers = foundry.utils.duplicate(this.actor.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === modifierId);
        modifier.enabled = !modifier.enabled;

        await this.actor.update({ 'system.modifiers': modifiers });
    }

    /**
     * Handle toggling the prepared status of an Owned Itme within the Actor
     * 
     * @param {Event} event The triggering click event
     */
    _onPrepareItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.update({ 'system.preparation.prepared': !item.system.preparation.prepared });
    }

    /**
     * Take a short 10 minute rest, calling the relevant function on the Actor instance
     * @param {Event} event The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onShortRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.shortRest();
    }

    /**
     * Take a long rest, calling the relevant function on the Actor instance
     * @param {Event} event   The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onLongRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.longRest();
    }

    /** @inheritdoc */
    /*
    _getSubmitData(updateData) {
       
      let formData = super._getSubmitData(updateData);
      console.log("SUBMIT",formData,this.object)
      formData = EntitySheetHelper.updateAttributes(formData, this.object);
      formData = EntitySheetHelper.updateGroups(formData, this.object);
      return formData;
    }
  */



}
