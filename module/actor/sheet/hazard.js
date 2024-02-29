import { Diced100 } from "../../dice.js";
import RollContext from "../../rolls/rollcontext.js";
import { ActorSheetSFRPG } from "./base.js";
import { SFRPG } from "../../config.js"
export class d100AActorSheetHazard extends ActorSheetSFRPG {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["Alternityd100", "sheet", "actor", "hazard"],
            width: 600,
            height: 685
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/Alternityd100/templates/actors/hazard-sheet-limited.html";
        return "systems/Alternityd100/templates/actors/hazard-sheet-full.html";
    }
    async getData() {
        const data = super.getData();

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
            augmentation: { label: game.i18n.format(SFRPG.itemTypes["augmentation"]), items: [], dataset: { type: "augmentation" }, allowAdd: true },
            starshipstuff: { label: game.i18n.format(SFRPG.itemTypes["starshipstuff"]), items: [], dataset: { type: "starshipstuff" }, allowAdd: false },
            everythingelse: { label: game.i18n.format(SFRPG.itemTypes["everythingelse"]), items: [], dataset: { type: "everythingelse" }, allowAdd: false }


        };

        console.log(this.object.items)
        for (let [k, item] of Object.entries(this.object.items.contents)) {
            console.log(item,item.type)
            console.log(item.type.startsWith("starship"))
            if (inventory[item.type]) { inventory[item.type].items.push({ item: item }); continue }
            if (item.type.startsWith("starship")) { inventory.starshipstuff.items.push({ item: item }); continue }
            inventory.everythingelse.items.push({ item: item });






        }




        console.log(data)
        // Enrich text editors
        data.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.details.biography.value, { async: true });



        data.inventory = Object.values(inventory);

        return data;
    }
    activateListeners(html) {
        console.log("HERE--", html)
        super.activateListeners(html);

        html.find('#fortSave').click(this._onFortSaveClicked.bind(this));
        html.find('#reflexSave').click(this._onReflexSaveClicked.bind(this));
        html.find('#willSave').click(this._onWillSaveClicked.bind(this));

        html.find('#attack').click(this._onAttackClicked.bind(this));
        html.find('#damage').click(this._onDamageClicked.bind(this));
    }

    async _render(...args) {
        await super._render(...args);

        const textAreas = this._element.find('textarea');
        for (let i = 0; i < textAreas.length; i++) {
            const textArea = textAreas[i];
            textArea.style.height = textArea.scrollHeight + "px";
        }
    }

    /**
     * Organize and classify items for hazard sheets.
     * Hazards don't need items, but this function is required because base.js calls it.
     * 
     * @param {Object} data Data for the sheet
     */
    _prepareItems(data) {

    }

    async _onFortSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Fortitude", { name: this.actor.name });
        return await this._performRoll(event, name, this.actor.system.attributes.fort.value, false);
    }

    async _onReflexSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Reflex", { name: this.actor.name });
        return await this._performRoll(event, name, this.actor.system.attributes.reflex.value, false);
    }

    async _onWillSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Will", { name: this.actor.name });
        return await this._performRoll(event, name, this.actor.system.attributes.will.value, false);
    }

    async _onAttackClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Attack", { name: this.actor.name });
        return await this._performRoll(event, name, this.actor.system.attributes.baseAttackBonus.value, true);
    }

    async _onDamageClicked(event) {
        event.preventDefault();

        if (this.actor.system.attributes.damage.value) {
            const rollContext = new RollContext();
            rollContext.addContext("main", this.actor);
            rollContext.setMainContext("main");

            this.actor.setupRollContexts(rollContext);

            const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Damage", { name: this.actor.name });
            return Diced100.damageRoll({
                event: event,
                rollContext: rollContext,
                parts: [{ formula: this.actor.system.attributes.damage.value }],
                title: name,
                flavor: name,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                dialogOptions: {
                    left: event ? event.clientX - 80 : null,
                    top: event ? event.clientY - 80 : null
                },
                onClose: (roll, formula, finalFormula, isCritical) => {
                    if (roll) {
                        Hooks.callAll("damageRolled", { actor: this.actor, item: null, roll: roll, isCritical: isCritical, formula: { base: formula, final: finalFormula }, rollMetadata: null });
                    }
                }
            });
        } else {
            ui.notifications.warn(game.i18n.format("SFRPG.HazardSheet.Notifications.NoDamage", { name: this.actor.name }));
        }
    }

    _performRoll(event, rollName, rollValue, isAttack) {
        const rollContext = new RollContext();
        rollContext.addContext("main", this.actor);
        rollContext.setMainContext("main");

        this.actor.setupRollContexts(rollContext);

        return Diced100.attackRoll({
            event: event,
            rollContext: rollContext,
            parts: [rollValue],
            title: rollName,
            flavor: null,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                left: event ? event.clientX - 80 : null,
                top: event ? event.clientY - 80 : null
            },
            onClose: (roll, formula, finalFormula) => {
                if (roll && isAttack) {
                    Hooks.callAll("attackRolled", { actor: this.actor, item: null, roll: roll, formula: { base: formula, final: finalFormula }, rollMetadata: null });
                }
            }
        });
    }
}