import { SFRPG } from "../../config.js"
import { d100A } from "../../d100Aconfig.js"
export const ActorConditionsMixin = (superclass) => class extends superclass {
    hasCondition(conditionName) {
        if (!d100A.statusEffectIconMapping[conditionName]) {
            ui.notifications.warn(`ATrying to check condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.d100A.statusEffectIconMapping for all valid conditions.`);
            return false;
        }

        const conditionItem = this.getCondition(conditionName);
        return (conditionItem !== undefined);
    }

    getCondition(conditionName) {
        if (!d100A.statusEffectIconMapping[conditionName]) {
            ui.notifications.warn(`BTrying to get condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.d100A.statusEffectIconMapping for all valid conditions.`);
            return undefined;
        }

        const conditionItem = this.items.find(x => x.type === "feat" && x.system.requirements?.toLowerCase() === "condition" && x.name.toLowerCase() === conditionName.toLowerCase());
        return conditionItem;
    }

    async setCondition(conditionName, enabled) {
        if (!d100A.statusEffectIconMapping[conditionName]) {
            ui.notifications.warn(`CTrying to set condition ${conditionName} on actor ${this.name} but the condition is not valid. See CONFIG.d100A.statusEffectIconMapping for all valid conditions.`);
            return;
        }

        const conditionItem = this.getCondition(conditionName);
console.log(conditionName,enabled )
        // Reflect state on tokens
        const tokens = this.getActiveTokens(true);
        for (const token of tokens) {
            await token.toggleEffect(d100A.statusEffectIconMapping[conditionName], {active: enabled});
        }

        // Update condition item
        if (enabled) {
            if (!conditionItem) {
                const compendium = game.packs.find(element => element.title.includes("Conditions"));
                if (compendium) {
                    await compendium.getIndex();

                    const entry = compendium.index.find(e => e.name.toLowerCase() === conditionName.toLowerCase());
                    if (entry) {
                        const entity = await compendium.getDocument(entry._id);
                        const itemData = duplicate(entity.data);

                        const promise = this.createEmbeddedDocuments("Item", [itemData]);
                        promise.then((createdItems) => {
                            if (createdItems && createdItems.length > 0) {
                                const updateData = {};
                                updateData[`system.conditions.${conditionName}`] = true;
                                this.update(updateData).then(() => {
                                    Hooks.callAll("onActorSetCondition", {actor: this, item: createdItems[0], conditionName: conditionName, enabled: enabled});
                                });
                            }
                        });
                        
                        return promise;
                    }
                }
            }
        } else {
            if (conditionItem) {
                const promise = this.deleteEmbeddedDocuments("Item", [conditionItem.id]);
                promise.then(() => {
                    const updateData = {};
                    updateData[`system.conditions.${conditionName}`] = false;
                    this.update(updateData).then(() => {
                        Hooks.callAll("onActorSetCondition", {actor: this, item: conditionItem, conditionName: conditionName, enabled: enabled});
                    });
                });
                return promise;
            }
        }
    }
}
