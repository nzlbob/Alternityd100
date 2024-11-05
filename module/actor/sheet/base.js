import { TraitSelectorSFRPG } from "../../apps/trait-selector.js";
import { ActorSheetFlags } from "../../apps/actor-flags.js";
import { ActorMovementConfig } from "../../apps/movement-config.js";
//import { getSpellBrowser } from "../../packs/spell-browser.js";
import { findTokenById } from "../../item/item.js";
import { moveItemBetweenActorsAsync, getFirstAcceptableStorageIndex, ActorItemHelper, containsItems } from "../actor-inventory-utils.js";
import { RPC } from "../../rpc.js"

import { ItemDeletionDialog } from "../../apps/item-deletion-dialog.js"
import { InputDialog } from "../../apps/input-dialog.js"
import { SFRPG } from "../../config.js";
import { d100A } from "../../d100Aconfig.js";
import { d100stepdie } from "../../modifiers/d100mod.js";
/**
 * Extend the basic ActorSheet class to do all the SFRPG things!
 * This sheet is an Abstract layer which is not used.
 * 
 * @type {ActorSheet}
 */
export class ActorSheetSFRPG extends ActorSheet {
    constructor(...args) {
        super(...args);

        this._filters = {
            inventory: new Set(),
            spellbook: new Set(),
            features: new Set(),
            psionic: new Set()
        };

        this._tooltips = null;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            scrollY: [
                ".tab.attributes",
                ".inventory .inventory-list",
                ".features .inventory-list",
                ".spellbook .inventory-list",
                ".modifiers .inventory-list",
                ".psionics .inventory-list",
                ".tab.status",
                ".tab.features",
                ".tab.skills",
                ".tab.details"
            ],
            tabs: [
                { navSelector: ".tabs", contentSelector: ".sheet-body", initial: "attributes" },
                { navSelector: ".subtabs", contentSelector: ".modifiers-body", initial: "permanent" },
                { navSelector: ".biotabs", contentSelector: ".bio-body", initial: "biography" }
            ]
        });
    }

    /**
     * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
     */
    getData() {
        //console.log(this)
        const context = super.getData();
        const isOwner = this.object.isOwner;
        const data = {
            document: context.document,
            actor: this.object,
            system: foundry.utils.duplicate(this.object.system),
            isOwner: isOwner,
            isGM: game.user.isGM,
            limited: this.object.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: isOwner ? "editable" : "locked",
            isCharacter: this.object.type === "character",
            isOrdnance: this.object.type === "ordnance",
            isShip: this.object.type === 'starship',
            isVehicle: this.object.type === 'vehicle',
            isDrone: this.object.type === 'drone',
            isNPC: this.object.type === 'npc',
            isHazard: this.object.type === 'hazard',
            config: CONFIG.SFRPG,
            d100Aconfig: CONFIG.d100A,
        };

        data.items = this.object.items.map(i => {
            i.labels = i.labels;
            return i;
        });
        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        data.labels = this.actor.labels || {};
        data.filters = this._filters;

        if (!data.system?.details?.biography?.fullBodyImage) {
            this.actor.system = foundry.utils.mergeObject(this.actor.system, {
                details: {
                    biography: {
                        fullBodyImage: "systems/Alternityd100/images/mystery-body.png"
                    }
                }
            }, { overwrite: false });
            this.actor.system.details.biography.fullBodyImage = "systems/Alternityd100/images/mystery-body.png";
        }

        if (data.system.abilities) {
            // Ability Scores
            for (let [a, abl] of Object.entries(data.system.abilities)) {
                abl.label = CONFIG.SFRPG.abilities[a];
            }
        }

        //********************************************************
        //
        //              Maybe use this for filteres skill list for Char Sheet
        ///
        ///
        //********************************************************************* */

        /*


        if (data.data.skills) {
            console.log("Needs Skills?\n", data.data.skills)
            // Update skill labels
            for (let [s, skl] of Object.entries(data.data.skills)) {                
                skl.ability = data.data.abilities[skl.ability].label.substring(0, 3);
                skl.icon = this._getClassSkillIcon(skl.value);

                let skillLabel = CONFIG.SFRPG.skills[s.substring(0, 3)];
                if (skl.subname) {
                    skillLabel += ` (${skl.subname})`;
                }

                skl.label = skillLabel;
                skl.hover = CONFIG.SFRPG.skillProficiencyLevels[skl.value];
            }

            data.data.skills = Object.keys(data.data.skills).sort().reduce((skills, key) => {
                skills[key] = data.data.skills[key];

                return skills;
            }, {});

            data.data.hasSkills = Object.values(data.data.skills).filter(x => x.enabled).length > 0;
        }

        if (data.data.traits) {
            this._prepareTraits(data.data.traits);
        }
*/
        this._prepareItems(data);


        data.status = {}
        data.status = { "durability": { "stu": { "good": [], "pend": [], "bad": [] }, "wou": { "good": [], "pend": [], "bad": [] }, "mor": { "good": [], "pend": [], "bad": [] }, "cri": { "good": [], "pend": [], "bad": [] } } }
        data.statusd = "fdgsdfg"
        data.status.image = { "bad": "systems/Alternityd100/icons/conditions/alt_bad1.png", "good": "systems/Alternityd100/icons/conditions/alt_good1.png", "pend": "systems/Alternityd100/icons/conditions/alt_yell.png" }

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





        //console.log("\n",data.status,"\n",this.actor.system?.attributes.stu.value,this.actor.system?.attributes.stu.pending,this.actor.system?.attributes.stu.max)

        return data;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {JQuery} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        //console.log("HERE--",html)
        super.activateListeners(html);

        html.find('[data-wpad]').each((i, e) => {
            let text = e.tagName === "INPUT" ? e.value : e.innerText,
                w = text.length * parseInt(e.getAttribute("data-wpad")) / 2;
            e.setAttribute("style", "flex: 0 0 " + w + "px;");
        });

        const filterLists = html.find(".filter-list");
        filterLists.each(this._initializeFilterItemList.bind(this));
        filterLists.on("click", ".filter-item", this._onToggleFilter.bind(this));

        html.find('.item .item-name h4').click(event => this._onItemSummary(event));
        //html.find('.action .action-name h4').click(event => this._onItemSummary(event,true));
        html.find('.item .item-name h4').contextmenu(event => this._onItemSplit(event));

        if (!this.options.editable) return;

        html.find('.config-button').click(this._onConfigMenu.bind(this));

        html.find('.toggle-container').click(this._onToggleContainer.bind(this));

        html.find('.skill-proficiency').on("click contextmenu", this._onCycleClassSkill.bind(this));
        html.find('.trait-selector').click(this._onTraitSelector.bind(this));

        // Ability Checks
        html.find('.ability-name').click(this._onRollAbilityCheck.bind(this));

        // Roll Skill Checks
        html.find('.skill-name').click(this._onRollSkillCheck.bind(this));

        // Edit Skill
        html.find('h4.skill-name').contextmenu(this._onEditSkill.bind(this));

        // Add skill
        html.find('#add-profession').click(this._onAddSkill.bind(this));

        // Configure Special Flags
        html.find('.configure-flags').click(this._onConfigureFlags.bind(this));

        // Saves
        html.find('.save-name').click(this._onRollSave.bind(this));

        // Weapon Mode Toggle
        html.find('.item .toggle-mode').click(event => this._onToggleModeChange(event));



        /* -------------------------------------------- */
        /*  Spellbook
        /* -------------------------------------------- */
        // html.find('.spell-browse').click(ev => getSpellBrowser().render(true)); // Inventory Browser

        /* -------------------------------------------- */
        /*  Inventory
        /* -------------------------------------------- */

        // Create New Item
        html.find('.item-create').click(ev => this._onItemCreate(ev));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id");
            const item = this.actor.items.get(itemId);
            // const item = this.actor.getEmbeddedEntity("Item", itemId);
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => this._onItemDelete(ev));

        // Item Dragging
        let handler = ev => this._onDragStart(ev);

        html.find('li.item').each((i, li) => {
            //console.log("Here");
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        // Item Rolling
        html.find('.item .item-image').click(event => this._onItemRoll(event));
        html.find('.item .scan-image').click(event => this._onItemRoll(event));
        html.find('.clickgood').click(event => this._onDurabilityChange(event));
        html.find('.clickgood').contextmenu(event => this._onDurabilityChange(event));
        //html.find('.clickgood').mousedown(event => this._onDurabilityChange(event));


        // Roll attack from item 
        html.find('.item-action .attack').click(event => this._onItemRollAttack(event));
        html.find('.item-action .scan').click(event => this._onItemRollScan(event));
        html.find('.item-action .use').click(event => this._onItemRoll(event));
        // Roll fire from item 
        html.find('.item-action .fire').click(event => this._onItemRollAttack(event, "fire"));
        // Roll burstfire from item 
        html.find('.item-action .burstfire').click(event => this._onItemRollAttack(event, "burstfire"));
        // Roll autofire from item 
        html.find('.item-action .autofire').click(event => this._onItemRollAttack(event, "autofire"));
        // Roll damage for item
        html.find('.item-action .damage').click(event => this._onItemRollDamage(event));
        html.find('.item-action .healing').click(event => this._onItemRollDamage(event));
        // console.log("BASE DONT DELETE")
        // (De-)activate an item
        html.find('.item-detail .featActivate').click(event => this._onActivateFeat(event));
        html.find('.item-detail .featDeactivate').click(event => this._onDeactivateFeat(event));

        // Item Recharging
        html.find('.item .item-recharge').click(event => this._onItemRecharge(event));

        // Item Equipping
        html.find('.item .item-equip').click(event => this._onItemEquippedChange(event));

        // Condition toggling
        html.find('.conditions input[type="checkbox"]').change(this._onToggleConditions.bind(this));

        html.find('.spellRank').change(this._onspellRankChanged.bind(this));

        // Apply Temp Damage
        html.find('.clickapplydamge').click(event => this._onApplyPendingDamage(event));
        html.find('.rollphysire').click(event => this._onRollPhysire(event));
        html.find('.clickpingtoken').click(event => this._onPingToken(event));
        html.find('.attribute-button').click(event => this._onRollAtt(event));

    }

    async _onRollPhysire(event) {

        const diceresults = await this.actor.rollSkill("physire")
        console.log(diceresults.roll)
        const rollData = diceresults.roll
        let basedamage = -2
        if (rollData.degree == "Good") basedamage -= 2
        if (rollData.degree == "Amazing!") basedamage -= 4
        rollData.defence = [{armor : {img:"systems/Alternityd100/icons/conditions/physical_resolve.webp"},damage:{stu:basedamage,wou:0,mor:0}}]
        const templateData = {
            actor: this.actor,
            item: this,
            tokenId: this.actor.token?.id,
            action: "Heals",
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


    async _onRollAtt(event) {
        const stat = game.i18n.localize("d100A.attributes." + event.currentTarget.dataset.attr)
        const totalbonus = 1;
        const dice = "1d20";
        const roll = await Roll.create(dice.concat(d100stepdie(totalbonus))).evaluate({ async: true });
        const a = 0
        const fumble = this.actor.system.attributes.luck
        const roll1 = roll.terms[0].results[0].result == 1
        const ordinary = this.actor.system.abilities[event.currentTarget.dataset.attr].value
        const good = Math.floor(ordinary / 2)
        const amazing = Math.floor(good / 2)
        let degree = ""
        console.log(roll)
        if (roll.total > ordinary && !roll1) { degree = "Failure" };
        if (roll.total > ordinary && roll1) { degree = "Ordinary" };
        if (roll.total <= ordinary) { degree = "Ordinary" };
        if (roll.total <= good) { degree = "Good" };
        if (roll.total <= amazing) { degree = "Amazing!" };
        if (roll.terms[0].results[0].result > fumble) { degree = "Critical Failure" };


        const templateData = {
            actor: this.actor,
            formula: roll.formula,
            total: roll.total,
            roll: roll.toJSON(),
            tooltip: await roll.getTooltip(),
            degree: degree,
            flavor: stat + " Feat Check"
        }
        const template = `systems/Alternityd100/templates/chat/roll-ext.hbs`;// `systems/Alternityd100/templates/chat/roll-ext.hbs`;    
        const html = await renderTemplate(template, templateData);
        const chatData = {
            roll: roll.toJSON(),

            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            sound: a === 0 ? CONFIG.sounds.dice : null,
            roll: roll.toJSON(),
            formula: roll.formula
        }
        await roll.toMessage(chatData);


        // canvas.ping(this.token.object.center)


    }
    async _onPingToken(event) {

        canvas.ping(this.token.object.center)
    }


    async _onApplyPendingDamage(event) {

        console.log(this.actor)

        const actor = this.actor
        const systemData = actor.system
        const oldstun = systemData.attributes.stu.value

        let leftover = 0

        const attributes = { stu: foundry.utils.duplicate(systemData.attributes.stu), wou: foundry.utils.duplicate(systemData.attributes.wou), mor: foundry.utils.duplicate(systemData.attributes.mor) }
        if (actor.isSpaceActor) attributes.cri = foundry.utils.duplicate(systemData.attributes.cri)
        for (const [k, o] of Object.entries(attributes)) {
            o.value += o.pending + leftover
            o.value = Math.min(o.value, o.max)
            leftover = Math.trunc(Math.min(o.value, 0) / 2)
            o.value = Math.max(o.value, 0)
            o.pending = 0
        }
        // let isKO = actor.system.conditions.knockedout
        // let isDead = actor.system.conditions.dead

        if (!actor.isSpaceActor) {
            let isKO = ((attributes.stu.value < 1) || (attributes.wou.value < 1))
            let isDead = (attributes.mor.value < 1)
           // await actor.setCondition("knockedout", isKO)
            actor.toggleStatusEffect("knockedout", {active:isKO,overlay:true})
            actor.toggleStatusEffect("dead", {active:isDead,overlay:true})
            actor.update({ "system.attributes": attributes })
            //actor.update({ "system.attributes": attributes , "system.conditions.knockedout": isKO, "system.conditions.dead": isDead })
           // await actor.setCondition("dead", isDead)
            //  (attributes.mor.value < 1) ? await actor.setCondition("dead", true) : await actor.setCondition("dead", false)


        }

        if (actor.isSpaceActor) {
            //  (attributes.stu.value < 1) ? await actor.setCondition("knockedout", true) : await actor.setCondition("knockedout", false)

            actor.update({ "system.attributes": attributes })
        }

        if ((attributes.stu.value == 0) && (oldstun > 0) ) return true;
        return false

    }

    async _onspellRankChanged(event) {

        console.log("Changed", event)

        const newValue = event.currentTarget.valueAsNumber
        const itemId = event.currentTarget.dataset.id
        const item = this.actor.items.get(itemId)

        let a = item.update({ "system.rank": newValue });

        console.log(item, a)
    }

    async _onDurabilityChange(event) {
        let actiontype = event.currentTarget.dataset.type;
        let category = event.currentTarget.dataset.category;
        let position = event.currentTarget.dataset.position;
        let location = event.currentTarget.dataset.location;
        let id = event.currentTarget.dataset.id;
        let dur = event.currentTarget.dataset.dur;
        console.log("Clicked CAT-", category, " Action", actiontype, " POS", position, " LOC", location, " Dur", dur, " id", id, "event", event)
        let pending = (!!event.button)
        console.log("\npending-", pending)
        //This updates the ship durability
        if (category == "total") {
            let curval = this.actor.system.attributes[id].value
            let newval = foundry.utils.duplicate(this.actor.system.attributes[id])

            if (actiontype == "total-inc" && !pending) {
                newval.value = parseInt(position) + 1;
                newval.pending = 0
            }
            if (actiontype == "total-dec" && !pending) {
                newval.value = parseInt(position)
                newval.pending = 0
            }

            if (actiontype == "total-dec" && pending) {
                newval.pending = parseInt(position - newval.value)
            }

            if (actiontype == "total-inc" && pending) {
                newval.pending = parseInt(position - newval.value) + 1;
            }

            //this.actor.system.attributes[category].value = newval;
            let path = "system.attributes." + id
            await this.actor.update({ [path]: newval });
            //console.log("Clicked-",position)
            //console.log("Clicked",this.actor.system.attributes[category],path,newval,this)
        }
        //This updates the compartment durability


        if (category == "compart") {
            const item = this.actor.items.get(this.actor.system.frame.id);
            let temp = foundry.utils.duplicate(item.system.compartment)
            //let path = "system.compartment"
            console.log("Temp", temp, "\n Stu - ", temp.F.durability.stu.value, "\n Wou - ", temp[location].durability[dur].value)
            if (actiontype == "inc") {
                temp[location].durability[dur].value = parseInt(position) + 1;

            }
            else if (actiontype == "dec") {
                temp[location].durability[dur].value = parseInt(position);

            }


            let a = await item.update({ "system.compartment": temp })
        }

    }

    /** @override */
    render(force, options) {
        if (this.stopRendering) {
            return this;
        }

        return super.render(force, options);
    }

    async _render(...args) {
        await super._render(...args);

        if (this._tooltips === null) {
            this._tooltips = tippy.delegate(`#${this.id}`, {
                target: '[data-tippy-content]',
                allowHTML: true,
                arrow: false,
                placement: 'top-start',
                duration: [500, null],
                delay: [800, null],
                maxWidth: 600
            });
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

    /** @override */
    _onChangeTab(event, tabs, active) {
        if (active === "modifiers") {
            this._tabs[1].activate("conditions");
        }

        super._onChangeTab();
    }

    _onConfigMenu(event) {
        event.preventDefault();
        const button = event.currentTarget;
        let app;
        switch (button.dataset.action) {
            case "movement":
                app = new ActorMovementConfig(this.object);
                break;
        }
        app?.render(true);
    }

    _prepareTraits(traits) {
        const map = {
            "dr": CONFIG.SFRPG.energyDamageTypes,
            "di": CONFIG.SFRPG.damageTypes,
            "dv": CONFIG.SFRPG.damageTypes,
            "ci": CONFIG.d100A.conditionTypes,
            "languages": CONFIG.SFRPG.languages,
            "weaponProf": CONFIG.SFRPG.weaponProficiencies,
            "armorProf": CONFIG.SFRPG.armorProficiencies
        };

        for (let [t, choices] of Object.entries(map)) {
            const trait = traits[t];
            if (!trait) continue;
            let values = [];
            if (trait.value) {
                values = trait.value instanceof Array ? trait.value : [trait.value];
            }
            trait.selected = values.reduce((obj, t) => {
                if (typeof t !== "object") obj[t] = choices[t];
                else {
                    for (const [key, value] of Object.entries(t))
                        obj[key] = `${choices[key]} ${value}`;
                }

                return obj;
            }, {});

            if (trait.custom) {
                trait.custom.split(';').forEach((c, i) => trait.selected[`custom${i + 1}`] = c.trim());
            }
            trait.cssClass = !isObjectEmpty(trait.selected) ? "" : "inactive";
        }
    }

    /**
     * handle cycling whether a skill is a class skill or not
     * 
     * @param {Event} event A click or contextmenu event which triggered the handler
     * @private
     */
    _onCycleClassSkill(event) {
        event.preventDefault();

        const field = $(event.currentTarget).siblings('input[type="hidden"]');

        const level = parseFloat(field.val());
        const levels = [0, 3];

        let idx = levels.indexOf(level);

        if (event.type === "click") {
            field.val(levels[(idx === levels.length - 1) ? 0 : idx + 1]);
        } else if (event.type === "contextmenu") {
            field.val(levels[(idx === 0) ? levels.length - 1 : idx - 1]);
        }

        this._onSubmit(event);
    }

    /**
     * Handle editing a skill
     * @param {Event} event The originating contextmenu event
     */
    _onEditSkill(event) {
        event.preventDefault();
        let skillId = event.currentTarget.parentElement.dataset.skill;

        return this.actor.editSkill(skillId, { event: event });
    }

    /**
     * Handle adding a skill
     * @param {Event} event The originating contextmenu event
     */
    _onAddSkill(event) {
        event.preventDefault();

        return this.actor.addSkill({ event: event });
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
                console.log("supportedTypes", type, supportedTypes)

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
                title: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Title" + "jhgf"),
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

    _onItemRollAttackx(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        ghjkghjkghk
        return item.rollAttack({ event: event });
    }

    _onItemRollScan(event) {

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.rollScan({ event: event });
    }

    _onItemRollDamage(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.rollDamage({ event: event });
    }

    async _onActivateFeat(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.setActive(true);
    }

    async _onDeactivateFeat(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.setActive(false);
    }

    /**
     * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
     * @param {Event} event The triggering event
     */
    _onItemRoll(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const type = event.currentTarget.closest('.item').dataset.type
        
        if (type == "token") {
            let Atoken = findTokenById(itemId)
            Atoken.setTarget()
            return Atoken;
        }

        const item = this.actor.items.get(itemId);
        console.log(itemId,"\n",item)
        if (item.system.type === "psionic") {
            return this.actor.rollSkillObject(item, { event: event, skipDialog: !event.shiftKey });
        }
        if (item.isSkilled) {
            return this.actor.rollSkillObject(item, { event: event, skipDialog: !event.shiftKey });
        }
        if (item.isChatRole) {
            return this.actor.rollSkillObject(item, { event: event, skipDialog: !event.shiftKey });
        }

        else return item.roll();
    }


    /* -------------------------------------------- */

    /**
     * Handle click events for skill checkss within the Actor Sheet
     * */
    clearTooltips() {
        this._tooltips = null;
    }
    /**
     * Handle attempting to recharge an item usage by rolling a recharge check
     * @param {Event} event The originating click event
     */
    _ontItemRecharge(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        return item.rollRecharge();
    }

    /**
     * Handle toggling the equipped state of an item.
     * @param {Event} event The originating click event
     */
    _onItemEquippedChange(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.update({
            ["system.equipped"]: !item.system.equipped
        });
    }

    /**
     * Toggles condition modifiers on or off.
     * 
     * @param {Event} event The triggering event.
     */
    _onToggleConditions(event) {
        event.preventDefault();

        const target = $(event.currentTarget);

        // Try find existing condition
        const conditionName = target.data('condition');

        this.actor.setCondition(conditionName, target[0].checked).then(() => {
            /*
                        const flatfootedConditions = ["blinded", "cowering", "off-kilter", "pinned", "stunned"];
                        let shouldBeFlatfooted = (conditionName === "flat-footed" && target[0].checked);
                        for (const ffCondition of flatfootedConditions) {
                            if (this.actor.hasCondition(ffCondition)) {
                                shouldBeFlatfooted = true;
                                break;
                            }
                        }
            
                        if (shouldBeFlatfooted != this.actor.hasCondition("flat-footed")) {
                            // This will trigger another sheet reload as the other condition gets created or deleted a moment later.
                            const flatfooted = $('.condition.flat-footed');
                            flatfooted.prop("checked", shouldBeFlatfooted).change();
                        }
            
                        */
        });
    }

    /**
     * Handle rolling a Save
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollSave(event) {
        event.preventDefault();
        const save = event.currentTarget.parentElement.dataset.save;
        this.actor.rollSave(save, { event: event });
    }

    /**
     * Handle rolling a Skill check
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.parentElement.dataset.skill;
        this.actor.rollSkill(skill, { event: event });
    }

    /**
     * Handle rolling an Ability check
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollAbilityCheck(event) {
        event.preventDefault();
        let ability = event.currentTarget.parentElement.dataset.ability;
        this.actor.rollAbility(ability, { event: event });
    }

    /**
     * Handles reloading / replacing ammo or batteries in a weapon.
     * 
     * @param {Event} event The originating click event
     */
    async _onReloadWeapon(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.reload();
    }

    /**
     * Handles toggling the open/close state of a container.
     * 
     * @param {Event} event The originating click event
     */
    _onToggleContainer(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        const isOpen = item.system.container?.isOpen === undefined ? true : item.system.container.isOpen;

        return item.update({ 'system.container.isOpen': !isOpen });
    }

    /**
     * Get The font-awesome icon used to display if a skill is a class skill or not
     * 
     * @param {Number} level Flag that determines if a skill is a class skill or not
     * @returns {String}
     * @private
     */
    _getClassSkillIcon(level) {
        const icons = {
            0: '<i class="far fa-circle"></i>',
            3: '<i class="fas fa-check"></i>'
        };

        return icons[level];
    }

    /**
     * Handle rolling of an item form the Actor sheet, obtaining the item instance an dispatching to it's roll method.
     * 
     * @param {Event} event The html event
     */
    async _onItemSummary(event, action = false) {


        console.log("Hello", action, $(event.currentTarget).parents('.action'))
        event.preventDefault();

        const itemz = $(event.currentTarget).parents('.action') //this.actor.items.get(event.currentTarget.item-id)
        console.log("Hello", itemz)
        //let dgdhd = game.items.get(itemz.data('action-id'))
        console.log("Hello", itemz.data('action-id'))
        const compendium = game.packs.get("Alternityd100.starship-actions")
        console.log("Hello", compendium)
        const itemb = await compendium.getDocument(itemz.data('action-id'))
        console.log("Hello", itemb)
        const chatDatab = await itemb.getChatData({ secrets: this.actor.isOwner, rollData: this.actor.system });
        console.log("Hello", chatDatab)
        var li, item, chatData, div, props, type
        if (!action) {
            li = $(event.currentTarget).parents('.item'),
                item = this.actor.items.get(li.data('item-id')),
                chatData = await item.getChatData({ secrets: this.actor.isOwner, rollData: this.actor.system });
        }
        if (action) {
            li = $(event.currentTarget).parents('.action'),
                item = itemb,
                chatData = chatDatab;
        }
        action ? type = "action" : type = "item"
        if (li.hasClass('expanded')) {
            let summary = li.children('.' + type + '-summary');
            summary.slideUp(200, () => summary.remove());
        } else {
            //console.log(chatData)
            const desiredDescription = await TextEditor.enrichHTML(chatData.description.short || chatData.description.value, {});
            action ? div = $(`<div class="action-summary">${desiredDescription}</div>`) : div = $(`<div class="item-summary">${desiredDescription}</div>`);

            action ? props = $(`<div class="action-properties"></div>`) : props = $(`<div class="item-properties"></div>`);
            chatData.properties.forEach(p => props.append(`<span class="tag" ${p.tooltip ? ("data-tippy-content='" + p.tooltip + "'") : ""}>${p.name}</span>`));

            div.append(props);
            li.append(div.hide());

            div.slideDown(200, function () { /* noop */ });
        }
        li.toggleClass('expanded');

    }

    async _onItemSplit(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents('.item'),
            item = this.actor.items.get(li.data('item-id'));

        const itemQuantity = item.system.quantity;
        if (!itemQuantity || itemQuantity <= 1) {
            return;
        }

        if (containsItems(item)) {
            return;
        }

        const bigStack = Math.ceil(itemQuantity / 2.0);
        const smallStack = Math.floor(itemQuantity / 2.0);

        const actorHelper = new ActorItemHelper(this.actor.id, this.token ? this.token.id : null, this.token ? this.token.parent.id : null);

        const update = { "quantity": bigStack };
        await actorHelper.updateItem(item.id, update);

        const itemData = foundry.utils.duplicate(item.data);
        itemData.id = null;
        itemData.data.quantity = smallStack;
        itemData.effects = [];
        await actorHelper.createItem(itemData);
    }

    _prepareSpellbook(data, spells) {
        const actorData = this.actor.system;

        const levels = {
            "always": -30,
            "innate": -20
        };

        const useLabels = {
            "-30": "-",
            "-20": "-",
            "-10": "-",
            "0": "&infin;"
        };

        let spellbook = spells.reduce((spellBook, spell) => {
            const spellData = spell.data;

            const mode = spellData.preparation.mode || "";
            const lvl = levels[mode] || spellData.level || 0;

            if (!spellBook[lvl]) {
                spellBook[lvl] = {
                    level: lvl,
                    usesSlots: lvl > 0,
                    canCreate: this.actor.isOwner && (lvl >= 0),
                    canPrepare: (this.actor.data.type === 'character') && (lvl > 0),
                    label: lvl >= 0 ? CONFIG.SFRPG.spellLevels[lvl] : CONFIG.SFRPG.spellPreparationModes[mode],
                    spells: [],
                    uses: useLabels[lvl] || actorData.spells["spell" + lvl].value || 0,
                    slots: useLabels[lvl] || actorData.spells["spell" + lvl].max || 0,
                    dataset: { "type": "spell", "level": lvl }
                };
            }

            spellBook[lvl].spells.push(spell);
            return spellBook;
        }, {});

        spellbook = Object.values(spellbook);
        spellbook.sort((a, b) => a.level - b.level);

        return spellbook;
    }

    /**
     * Creates an TraitSelectorSFRPG dialog
     * 
     * @param {Event} event HTML Event
     * @private
     */
    _onTraitSelector(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const label = a.parentElement.querySelector('label');
        const options = {
            name: label.getAttribute("for"),
            title: label.innerText,
            choices: CONFIG.SFRPG[a.dataset.options]
        };

        new TraitSelectorSFRPG(this.actor, options).render(true);
    }

    /**
     * Handle toggling of filters to display a different set of owned items
     * @param {Event} event     The click event which triggered the toggle
     * @private
     */
    _onToggleFilter(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const set = this._filters[li.parentElement.dataset.filter];
        const filter = li.dataset.filter;
        if (set.has(filter)) set.delete(filter);
        else set.add(filter);
        this.render();
    }

    /**
     * Iinitialize Item list filters by activating the set of filters which are currently applied
     * @private
     */
    _initializeFilterItemList(i, ul) {
        const set = this._filters[ul.dataset.filter];
        const filters = ul.querySelectorAll(".filter-item");
        for (let li of filters) {
            if (set.has(li.dataset.filter)) li.classList.add("active");
        }
    }

    /**
     * Determine whether an Owned Item will be shown based on the current set of filters
     * 
     * @return {Boolean}
     * @private
     */
    _filterItems(items, filters) {
        return items.filter(item => {
            const data = item.data;

            // Action usage
            for (let f of ["action", "move", "swift", "full", "reaction"]) {
                if (filters.has(f)) {
                    if ((data.activation && (data.activation.type !== f))) return false;
                }
            }
            if (filters.has("concentration")) {
                if (data.components.concentration !== true) return false;
            }

            // Equipment-specific filters
            if (filters.has("equipped")) {
                if (data.equipped && data.equipped !== true) return false;
            }
            return true;
        });
    }

    /**
     * Handle click events for the Traits tab button to configure special Character Flags
     */
    _onConfigureFlags(event) {
        event.preventDefault();
        new ActorSheetFlags(this.actor).render(true);
    }
    /*
        async _onmDrop(event) {
            event.preventDefault();
    
            const parsedDragData = TextEditor.getDragEventData(event);
            if (!parsedDragData) {
                console.log("Unknown item data");
                return;
            }
            
            console.log("Builder")
    
            const uuidarray = parsedDragData.uuid.split(".")
            parsedDragData.id = uuidarray[uuidarray.length-1]
            parsedDragData.uuidarray = uuidarray
            parsedDragData.pack = "";
            if (parsedDragData.uuidarray[0] == "Compendium"){
                let packlen = parsedDragData.uuidarray.length-1;
                for(let a = 1; a < packlen;a++){
                    parsedDragData.pack += parsedDragData.uuidarray[a];
                    if (a < packlen-1) parsedDragData.pack += ".";
                    console.log("Builder",packlen,parsedDragData.uuidarray[a],a,parsedDragData.pack)
                }
        
            }
    
            return this.processDroppedData(event, parsedDragData);
        }
       
       */
    async processDroppedDataSFRPG(event, parsedDragData) {
        const targetActor = new ActorItemHelper(this.actor.id, this.token?.id, this.token?.parent?.id);





        if (!ActorItemHelper.IsValidHelper(targetActor)) {
            ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragToExternalTokenError"));
            return;
        }


        let itemData = null;
        if (parsedDragData.type !== 'ItemCollection') {
            itemData = await Item.fromDropData(parsedDragData);
        } else {
            itemData = parsedDragData.items[0];
        }

        if (itemData.type === "class") {
            const existingClass = targetActor.findItem(x => x.type === "class" && x.name === itemData.name);
            if (existingClass) {
                const levelUpdate = {};
                levelUpdate["system.levels"] = existingClass.system.levels + 1;
                existingClass.update(levelUpdate)
                return existingClass;
            }
        }
        console.log("Data", this, itemData)
        // if (!this.acceptedItemTypes.includes(itemData.type)) {
        // Reject item
        //   ui.notifications.error(game.i18n.format("SFRPG.InvalidItem", { name: SFRPG.itemTypes[itemData.type], target: SFRPG.actorTypes[this.actor.type] }));
        //    return;
        // }

        let targetContainer = null;
        if (event) {
            const targetId = $(event.target).parents('.item').attr('data-item-id')
            targetContainer = targetActor.getItem(targetId);
        }

        if (parsedDragData.type === "ItemCollection") {
            const msg = {
                target: targetActor.toObject(),
                source: {
                    actorId: null,
                    tokenId: parsedDragData.tokenId,
                    sceneId: parsedDragData.sceneId
                },
                draggedItems: parsedDragData.items,
                containerId: targetContainer ? targetContainer.id : null
            }

            const messageResult = RPC.sendMessageTo("gm", "dragItemFromCollectionToPlayer", msg);
            if (messageResult === "errorRecipientNotAvailable") {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.ItemCollectionPickupNoGMError"));
            }
            return;
        } else if (parsedDragData.uuid.includes("Compendium")) {
            const createResult = await targetActor.createItem(itemData._source);
            const addedItem = targetActor.getItem(createResult[0].id);

            if (game.settings.get('sfrpg', 'scalingCantrips') && addedItem.type === "spell") {
                _onScalingCantripDrop(addedItem, targetActor);
            }

            if (!(addedItem.type in SFRPG.containableTypes)) {
                targetContainer = null;
            }

            const itemInTargetActor = await moveItemBetweenActorsAsync(targetActor, addedItem, targetActor, targetContainer);
            if (itemInTargetActor === addedItem) {
                await this._onSortItem(event, itemInTargetActor);
                return itemInTargetActor;
            }

            return itemInTargetActor;
        } else if (parsedDragData.uuid.includes("Actor")) {
            const splitUUID = parsedDragData.uuid.split(".");
            let actorID = "";
            if (splitUUID[0] === "Actor") {
                actorID = splitUUID[1];
            }

            const sourceActor = new ActorItemHelper(actorID || parsedDragData.actorId, parsedDragData.tokenId, parsedDragData.sceneId);
            if (!ActorItemHelper.IsValidHelper(sourceActor)) {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
                return;
            }

            const itemToMove = await sourceActor.getItem(itemData.id);

            if (event.shiftKey) {
                InputDialog.show(
                    game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferTitle"),
                    game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferMessage"), {
                    amount: {
                        name: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferLabel"),
                        label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferInfo", { max: itemToMove.system.quantity }),
                        placeholder: itemToMove.system.quantity,
                        validator: (v) => {
                            let number = Number(v);
                            if (Number.isNaN(number)) {
                                return false;
                            }

                            if (number < 1) {
                                return false;
                            }

                            if (number > itemToMove.system.quantity) {
                                return false;
                            }
                            return true;
                        }
                    }
                }, (values) => {
                    const itemInTargetActor = moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer, values.amount);
                    if (itemInTargetActor === itemToMove) {
                        this._onSortItem(event, itemInTargetActor);
                    }
                });
            } else {
                const itemInTargetActor = await moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer);
                if (itemInTargetActor === itemToMove) {
                    return await this._onSortItem(event, itemInTargetActor);
                }
            }
        } else {
            const sidebarItem = itemData;

            const addedItemResult = await targetActor.createItem(foundry.utils.duplicate(sidebarItem));
            if (addedItemResult.length > 0) {
                const addedItem = targetActor.getItem(addedItemResult[0].id);

                if (game.settings.get('sfrpg', 'scalingCantrips') && sidebarItem.type === "spell") {
                    _onScalingCantripDrop(addedItem, targetActor);
                }

                if (targetContainer) {
                    let newContents = [];
                    if (targetContainer.system.container?.contents) {
                        newContents = foundry.utils.duplicate(targetContainer.system.container?.contents || []);
                    }

                    const preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, addedItem) || 0;
                    newContents.push({ id: addedItem.id, index: preferredStorageIndex });

                    const update = { id: targetContainer.id, "system.container.contents": newContents };
                    await targetActor.updateItem(targetContainer.id, update);
                }

                return addedItem;
            }
            return null;
        }

        console.log("Unknown item source: " + JSON.stringify(parsedDragData));
    }


    async processDroppedData(event, parsedDragData) {
        const targetActor = new ActorItemHelper(this.actor.id, this.token?.id, this.token?.parent?.id);
        console.log("Parsed", parsedDragData)
        if (!ActorItemHelper.IsValidHelper(targetActor)) {
            ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragToExternalTokenError"));
            return;
        }
        let itemData = null
        let targetContainer = null;
        if (event) {
            const targetId = $(event.target).parents('.item').attr('data-item-id')
            targetContainer = targetActor.getItem(targetId);
        }

        //Collection

        if (parsedDragData.type === "ItemCollection") {
            const msg = {
                target: targetActor.toObject(),
                source: {
                    actorId: null,
                    tokenId: parsedDragData.tokenId,
                    sceneId: parsedDragData.sceneId
                },
                draggedItems: parsedDragData.items,
                containerId: targetContainer ? targetContainer.id : null
            }

            const messageResult = RPC.sendMessageTo("gm", "dragItemFromCollectionToPlayer", msg);
            if (messageResult === "errorRecipientNotAvailable") {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.ItemCollectionPickupNoGMError"));
            }
            return;
        }
        //Pack
        //documentIndex.uuids
        else if (parsedDragData.pack) {
            const pack = game.packs.get(parsedDragData.pack);
            console.log(pack, parsedDragData.pack, game.packs)
            const itemData = await pack.getDocument(parsedDragData.id);

            if (itemData.type === "class") {
                const existingClass = targetActor.findItem(x => x.type === "class" && x.name === itemData.name);
                if (existingClass) {
                    ui.notifications.warn("You got a class")
                    //const levelUpdate = {};
                    //levelUpdate["levels"] = existingClass.system.levels + 1;
                    //existingClass.update(levelUpdate)
                    return existingClass;
                }
            }
            console.log("itemData", itemData)
            const createResult = await targetActor.createItem(itemData._source);
            const addedItem = targetActor.getItem(createResult[0].id);

            if (!(addedItem.type in SFRPG.containableTypes)) {
                targetContainer = null;
            }

            const itemInTargetActor = await moveItemBetweenActorsAsync(targetActor, addedItem, targetActor, targetContainer);
            if (itemInTargetActor === addedItem) {
                await this._onSortItem(event, itemInTargetActor);
                return itemInTargetActor;
            }

            return itemInTargetActor;
        }

        //Actor  & Tokens     

        else if (parsedDragData.uuid.includes("Actor") || parsedDragData.uuid.includes("Token")) {
            const splitUUID = parsedDragData.uuid.split(".");
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
            parsedDragData.actorId = actorID
            parsedDragData.sceneId = sceneId
            parsedDragData.tokenId = tokenId
            console.log(parsedDragData, "parsedDragData")
            const sourceActor = new ActorItemHelper(parsedDragData.actorId, parsedDragData.tokenId, parsedDragData.sceneId);
            console.log(sourceActor, "sourceActor")
            if (!ActorItemHelper.IsValidHelper(sourceActor)) {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
                return;
            }

            const itemToMove = await sourceActor.getItem(itemId);

            if (event.shiftKey) {
                InputDialog.show(
                    game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferTitle"),
                    game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferMessage"), {
                    amount: {
                        name: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferLabel"),
                        label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.AmountToTransferInfo", { max: itemToMove.system.quantity }),
                        placeholder: itemToMove.system.quantity,
                        validator: (v) => {
                            let number = Number(v);
                            if (Number.isNaN(number)) {
                                return false;
                            }

                            if (number < 1) {
                                return false;
                            }

                            if (number > itemToMove.system.quantity) {
                                return false;
                            }
                            return true;
                        }
                    }
                }, (values) => {
                    const itemInTargetActor = moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer, values.amount);
                    if (itemInTargetActor === itemToMove) {
                        this._onSortItem(event, itemInTargetActor);
                    }
                });
            } else {
                const itemInTargetActor = await moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer);
                if (itemInTargetActor === itemToMove) {
                    return await this._onSortItem(event, itemInTargetActor);
                }
            }
        }

        //Everything else       

        else {

            const splitUUID = parsedDragData.uuid.split(".");
            let itemID = "";
            if (splitUUID[0] === "Item") {
                itemID = splitUUID[1];
            }
            if (splitUUID[0] === "Compendium") {
                itemID = splitUUID[3];
            }

            console.log("\nparsedDragData\n", parsedDragData, itemID)
            const sidebarItem = game.items.get(itemID);

            if (sidebarItem) {
                if (sidebarItem.type === "class") {
                    const existingClass = targetActor.findItem(x => x.type === "class" && x.name === sidebarItem.name);
                    if (existingClass) {
                        const levelUpdate = {};
                        levelUpdate["data.levels"] = existingClass.system.levels + 1;
                        existingClass.update(levelUpdate)
                        return existingClass;
                    }
                }

                const addedItemResult = await targetActor.createItem(foundry.utils.duplicate(sidebarItem));
                if (addedItemResult.length > 0) {
                    const addedItem = targetActor.getItem(addedItemResult[0].id);

                    if (targetContainer) {
                        let newContents = [];
                        if (targetContainer.system.container?.contents) {
                            newContents = foundry.utils.duplicate(targetContainer.system.container?.contents || []);
                        }

                        const preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, addedItem) || 0;
                        newContents.push({ id: addedItem.id, index: preferredStorageIndex });

                        const update = { id: targetContainer.id, "container.contents": newContents };
                        await targetActor.updateItem(update);
                    }

                    return addedItem;
                }
                return null;
            }

            console.log("Unknown item source: " + JSON.stringify(parsedDragData));
        }
    }

    processItemContainment(items, pushItemFn) {
        const preprocessedItems = [];
        const containedItems = [];
        for (const item of items) {
            const itemData = {
                item: item,
                parent: items.find(x => x.container?.contents && x.container.contents.find(y => y.id === item._id)),
                contents: []
            };
            preprocessedItems.push(itemData);

            if (!itemData.parent) {
                pushItemFn(item.type, itemData);
            } else {
                containedItems.push(itemData);
            }
        }

        for (const item of containedItems) {
            const parent = preprocessedItems.find(x => x.item._id === item.parent._id);
            if (parent) {
                parent.contents.push(item);
            }
        }
    }



    _onItemRollAttack(event, attackType) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        console.log("User Targets", item, UserTargets);
        attackType = item.system.fireMode;
        console.log("event", event)
        return item.rollAttack({ event: event, attackType: attackType });
    }

    _onToggleModeChange(event) {
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        console.log("Mode", item, itemId);

        //item.update(item.changeAttackMode());
        item.update({
            ["system.fireMode"]: item.changeAttackMode()
        });
    }


    /* -------------------------------------------- */

    /**
     * Handle dropping of an Actor data onto another Actor sheet
     * @param {DragEvent} event            The concluding DragEvent which contains drop data
     * @param {object} data                The data transfer extracted from the event
     * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
     *                                     not permitted.
     * @protected
     */
    async _onDropActor(event, data) {

        console.log("_onDropActor_Starship", event, data);
        // if ( !this.actor.isOwner ) return false;

        let parsedDragData = data;
        if (!parsedDragData.id) {
            const uuidarray = parsedDragData.uuid.split(".")
            parsedDragData.id = uuidarray[uuidarray.length - 1]
            parsedDragData.uuidarray = uuidarray
        }

        /* parsedDragData.pack = "";
         if (parsedDragData.uuidarray[0] == "Compendium"){
             let packlen = parsedDragData.uuidarray.length-1;
             for(let a = 1; a < packlen;a++){
                 parsedDragData.pack += parsedDragData.uuidarray[a];
                 if (a < packlen-1) parsedDragData.pack += ".";
                 console.log("Builder",packlen,parsedDragData.uuidarray[a],a,parsedDragData.pack)
             }
      
         }
          */

        console.log(this.actor)
        if (!["starship", "vehicle"].includes(this.actor.type)) return false
        if (data.type === "Actor") {
            return this._onCrewDrop(event, parsedDragData);
        }


    }
    /* -------------------------------------------- */
    /**
     * Handles drop events for the Crew list
     * 
     * @param {Event}  event The originating drop event
     * @param {object} data  The data transfer object.
     */
    async _onCrewDrop(event, data) {
        // event.preventDefault();
        console.log(this, event, data)
        $(event.target).css('background', '');

        const targetRole = event.target.dataset.role;
        if (!targetRole || !data.id) return false;

        const crew = foundry.utils.duplicate(this.actor.system.crew);
        const crewRole = crew[targetRole];
        const oldRole = this.actor.getCrewRoleForActor(data.id);
        console.log("this.actor.system.crew", this.actor.system.crew)
        console.log("oldRole", oldRole)
        console.log("crewRole", crewRole)
        if (crewRole.limit < -1){
            ui.notifications.error("Too many",crewRole.limit,targetRole )
            crewRole.limit =-1
        }
        if (crewRole.limit === -1 || crewRole.actorIds.length < crewRole.limit) {
            crewRole.actorIds.push(data.id);

            if (oldRole) {
                const originalRole = crew[oldRole];
                originalRole.actorIds = originalRole.actorIds.filter(x => x != data.id);
            }

            await this.actor.update({
                "system.crew": crew
            }).then(this.render(false));
        } else {
            ui.notifications.error(game.i18n.format("SFRPG.StarshipSheet.Crew.CrewLimitReached", { targetRole: targetRole }));
        }

        return true;
    }

    /* -------------------------------------------- */



}