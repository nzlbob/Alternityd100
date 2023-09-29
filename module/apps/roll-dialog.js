import { SFRPG } from "../config.js";

// Typedef's for documentation purposes.
/**
 * A data structure for storing damage statistics.
 * 
 * @typedef {Object} DamagePart
 * @property {string}                     formula  The roll formula to use.
 * @property {{[key: string]: boolean}}   types    A set of key value pairs that determines the available damage types.
 * @property {string}                     operator An operator that determines how damage is split between multiple types.
 */

/**
 * A custom dialog for confirming rolls from a user.
 */
export default class RollDialog extends Dialog {
    /**
     * Construct a custom RollDialog
     * 
     * @param {object} params The parameters passed into the class.
     * @param {RollTree} params.rollTree 
     * @param {string} params.formula The formula used for this roll.
     * @param {RollContext} params.contexts Contextual data for the roll.
     * @param {Modifier[]} params.availableModifiers Any conditional modifiers that can apply to this roll.
     * @param {string} params.mainDie The primary die type used in this roll.
     * @param {DamagePart[]} [params.parts] An array of DamageParts.
     * @param {Object} [params.dialogData] Any additional data being passed to the dialog.
     * @param {DialogOptions} [params.options] Any additional options being passed to the dialog.
     */
    constructor({ rollTree, formula, contexts, availableModifiers, mainDie, parts = [], dialogData = {}, options = {} }) {
        super(dialogData, options);
        this.options.classes = ["sfrpg", "dialog", "roll"];

        this.rollTree = rollTree;
        this.formula = formula;
        this.contexts = contexts;
        this.availableModifiers = availableModifiers;
        if (mainDie) {
            this.formula = mainDie + " + " + formula;
        }

        this.parts = parts

        /** Prepare selectors */
        this.selectors = {};
        if (this.contexts.selectors) {
            for (const selector of this.contexts.selectors) {
                this.selectors[selector.target] = {
                    values: selector.options,
                    value: selector.options[0]
                };

                const entries = {};
                for (const selectorValue of selector.options) {
                    entries[selectorValue] = this.contexts.allContexts[selectorValue].entity.name;
                }
                this.selectors[selector.target].entries = entries;
            }
        }

        /** Returned values */
        this.additionalBonus = "";
        this.rollMode = game.settings.get("core", "rollMode");
        this.rolledButton = null;

        // tooltips
        this._tooltips = null;
    }

    get template() {
        return "systems/Alternityd100/templates/chat/roll-dialog.html";
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
                delay: [800, null]
            });
        }
    }

    getData() {
        let data = super.getData();
        data.formula = this.formula;
        data.rollMode = this.rollMode;
        data.rollModes = CONFIG.Dice.rollModes;
        data.additionalBonus = this.additionalBonus;
        data.availableModifiers = this.availableModifiers || [];
        data.hasModifiers = data.availableModifiers.length > 0;
        data.hasSelectors = this.contexts.selectors && this.contexts.selectors.length > 0;
        data.selectors = this.selectors;
        data.contexts = this.contexts;

        data.damageTypeLabels = this.parts?.reduce((arr, curr) => {
            let typeString = "";
            if (curr.types && !foundry.utils.isObjectEmpty(curr.types)) {
                typeString = `${(Object.entries(curr.types).filter(type => type[1]).map(type => SFRPG.damageTypes[type[0]]).join(` ${SFRPG.damageTypeOperators[curr.operator]} `))}`
                if (!arr.some(val => val === typeString) && typeString.trim().length > 0)
                    arr.push(typeString);
            }

            return arr;
        }, []);
        data.hasDamageTypes = data.damageTypeLabels.length > 0;
        //data.config = SFRPG; Don't remove this. Will be needed later
        return data;
    }

    /**
     * Activate any event listeners.
     * 
     * @param {JQuery} html The jQuery object that represents the HTMl content.
     */
    activateListeners(html) {
console.log("HERE--",html)
        super.activateListeners(html);

        let additionalBonusTextbox = html.find('input[name=bonus]');
        additionalBonusTextbox.on('change', this._onAdditionalBonusChanged.bind(this));

        let rollModeCombobox = html.find('select[name=rollMode]');
        rollModeCombobox.on('change', this._onRollModeChanged.bind(this));

        let modifierEnabled = html.find('.toggle-modifier');
        modifierEnabled.on('click', this._toggleModifierEnabled.bind(this));

        let selectorCombobox = html.find('.selector');
        selectorCombobox.on('change', this._onSelectorChanged.bind(this));
    }

    async _onAdditionalBonusChanged(event) {
        this.additionalBonus = event.target.value;
    }

    async _onRollModeChanged(event) {
        this.rollMode = event.target.value;
    }

    async _toggleModifierEnabled(event) {
        const modifierIndex = $(event.currentTarget).data('modifierIndex');
        const modifier = this.availableModifiers[modifierIndex];

        modifier.enabled = !modifier.enabled;
        this.render(false);

        if (modifier._id) {
            // Update container
            const container = modifier.container;
            const actor = await game.actors.get(container.actorId);
            if (container.itemId) {
                const item = container.itemId ? await actor.items.get(container.itemId) : null;

                // Update modifier by ID in item
                const containerModifiers = duplicate(item.system.modifiers);
                const modifierToUpdate = containerModifiers.find(x => x._id === modifier._id);
                modifierToUpdate.enabled = modifier.enabled;
                await item.update({ "data.modifiers": containerModifiers });
            } else {
                // Update modifier by ID in actor
                const containerModifiers = duplicate(actor.system.modifiers);
                const modifierToUpdate = containerModifiers.find(x => x._id === modifier._id);
                modifierToUpdate.enabled = modifier.enabled;
                await actor.update({ "data.modifiers": containerModifiers });
            }
        }
    }

    async _onSelectorChanged(event) {
        const selectorName = event.target.name;
        const selectedValue = event.target.value;

        this.selectors[selectorName].value = selectedValue;
        this.contexts.allContexts[selectorName] = this.contexts.allContexts[selectedValue];

        /** Repopulate nodes, might change modifiers because of different selector. */
        this.availableModifiers = this.rollTree.populate();

        this.position.height = "auto";
        this.render(false);
    }

    submit(button) {
        try {
            this.rolledButton = button.label;
            this.close();
        } catch (err) {
            ui.notifications.error(err);
            throw new Error(err);
        }
    }

    async close(options) {
        /** Fire callback, then delete, as it would get called again by Dialog#close. */
        if (this.data.close) {
            this.data.close(this.rolledButton, this.rollMode, this.additionalBonus);
            delete this.data.close;
        }

        if (this._tooltips !== null) {
            for (const tooltip of this._tooltips) {
                tooltip.destroy();
            }

            this._tooltips = null;
        }

        return super.close(options);
    }

    /**
     * Factory method used to create a RollDialog.
     * 
     * @param {RollTree} rollTree 
     * @param {string} formula 
     * @param {RollContext} contexts 
     * @param {Modifier[]} availableModifiers 
     * @param {string} mainDie 
     * @param {DialogOptions} options 
     * @returns {RollDialog}
     */
    static async showRollDialog(rollTree, formula, contexts, availableModifiers = [], mainDie, options = {}) {
        return new Promise(resolve => {
            const buttons = options.buttons || { roll: { label: game.i18n.localize("SFRPG.Rolls.Dice.Roll") } };
            const firstButtonLabel = options.defaultButton || Object.values(buttons)[0].label;

            const dlg = new RollDialog({
                rollTree, 
                formula, 
                contexts, 
                availableModifiers, 
                mainDie, 
                parts: options.parts,
                dialogData: {
                    title: options.title || game.i18n.localize("SFRPG.Rolls.Dice.Roll"),
                    buttons: buttons,
                    default: firstButtonLabel,
                    close: (button, rollMode, bonus) => {
                        resolve([button, rollMode, bonus]);
                    }
                }, 
                options: options.dialogOptions || {}
            });
            dlg.render(true);
        });
    }
}
