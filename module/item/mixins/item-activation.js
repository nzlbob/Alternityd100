import { ActorItemHelper, getChildItems, getItemContainer, setItemContainer } from "../../actor/actor-inventory-utils.js"

export const ItemActivationMixin = (superclass) => class extends superclass {

    get hasUses() {
        
       // console.log(this)
        const itemData = this.system;
        return itemData.uses && itemData.uses.max && itemData.uses.value;
    }

    get getRemainingUses() {
        const itemData = this.system;
        return itemData.uses?.value || 0;
    }

    get getMaxUses() {
        const itemData = this.system;
        return itemData.uses?.max || 0;
    }

    get canBeUsed() {
        return this.getRemainingUses() > 0 && this.getMaxUses() > 0;
    }
    
    get canBeActivated() {
        const itemData = this.system;
        if (this.type === "vehicleSystem") {
            return itemData.canBeActivated;
        } else {
            return !!(itemData.activation.type);
        }
    }

    get isActive() {
        const itemData = this.system;
        return itemData.isActive;
    }
    
    setActive(active) {
        // Only true and false are accepted.
        if (active !== true && active !== false) {
      //console.log(ering an invalid value ${active} for item.setActive()! Only true or false are allowed.`)
            return;
        }

        if (!this.canBeActivated() || this.isActive() == active) {
            return;
        }

        const updateData = {};

        const remainingUses = this.getRemainingUses();
        const maxUses = this.getMaxUses();
        if (!this.isActive() && maxUses > 0) {
            if (remainingUses <= 0) {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.UI.ErrorNoCharges", {name: this.name}));
                return false;
            }

            updateData['system.uses.value'] = Math.max(0, remainingUses - 1);
        }

        updateData['system.isActive'] = active;

        const updatePromise = this.update(updateData);

        if (active) {
            updatePromise.then(() => {
                // Render the chat card template
                const templateData = {
                    actor: this.actor,
                    item: this,
                    action: "SFRPG.ChatCard.ItemActivation.Activates",
                    labels: this.labels,
                    hasAttack: this.hasAttack,
                    hasDamage: this.hasDamage,
                    isVersatile: this.isVersatile,
                    hasSave: this.hasSave
                };

                if (this.actor.token) {
                    templateData.tokenId = this.actor.token.id;
                    templateData.sceneId = this.actor.token.parent.id;
                }

                const template = `systems/Alternityd100/templates/chat/item-action-card.html`;
                const htmlPromise = renderTemplate(template, templateData);
                htmlPromise.then((html) => {
                    // Create the chat message
                    const chatData = {
                        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        content: html
                    };

                    ChatMessage.create(chatData, { displaySheet: false });
                });

                Hooks.callAll("itemActivationChanged", {actor: this.actor, item: this, isActive: active});
            });
        } else {
            if (this.system.duration.value || this.system.uses.max > 0) {
               updatePromise.then(() => {
                    // Render the chat card template
                    const templateData = {
                        actor: this.actor,
                        item: this,
                        action: "SFRPG.ChatCard.ItemActivation.Deactivates"
                    };

                    if (this.actor.token) {
                        templateData.tokenId = this.actor.token.id;
                        templateData.sceneId = this.actor.token.parent.id;
                    }
        
                    const template = `systems/Alternityd100/templates/chat/item-action-card.html`;
                    const htmlPromise = renderTemplate(template, templateData);
        
                    htmlPromise.then((html) => {
                        // Create the chat message
                        const chatData = {
                            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            content: html
                        };
            
                        ChatMessage.create(chatData, { displaySheet: false });
                    });

                    Hooks.callAll("itemActivationChanged", {actor: this.actor, item: this, isActive: active});
                });
            }
        }

        return updatePromise;
    }
}