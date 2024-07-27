import { Diced100 } from "../../dice.js";
import RollContext from "../../rolls/rollcontext.js";
import { ActorSheetSFRPG } from "./base.js";

export class d100AActorSheetOrdnance extends ActorSheetSFRPG {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["Alternityd100", "sheet", "actor", "hazard"],
            width: 600,
            height: 685
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/Alternityd100/templates/actors/ordnance-sheet-limited.html";
        return "systems/Alternityd100/templates/actors/ordnance-sheet-full.html";
    }

    activateListeners(html) {
console.log("HERE--",html)
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
        for (let i = 0; i<textAreas.length; i++) {
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

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Fortitude", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.fort.value, false);
    }

    async _onReflexSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Reflex", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.reflex.value, false);
    }

    async _onWillSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Will", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.will.value, false);
    }

    async _onAttackClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Attack", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.baseAttackBonus.value, true);
    }

    async _onDamageClicked(event) {
        event.preventDefault();

        if (this.actor.system.attributes.damage.value) {
            const rollContext = new RollContext();
            rollContext.addContext("main", this.actor);
            rollContext.setMainContext("main");
    
            this.actor.setupRollContexts(rollContext);
    
            const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Damage", {name: this.actor.name});
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
                        Hooks.callAll("damageRolled", {actor: this.actor, item: null, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: null});
                    }
                }
            });
        } else {
            ui.notifications.warn(game.i18n.format("SFRPG.HazardSheet.Notifications.NoDamage", {name: this.actor.name}));
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
                    Hooks.callAll("attackRolled", {actor: this.actor, item: null, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: null});
                }
            }
        });
    }
}