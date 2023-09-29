import { EntitySheetHelper } from "./helper.js";

import { getSkipActionPrompt } from "./settings.js";
import { Diced100 } from "./dice.js";
import { moveItemBetweenActorsAsync, getFirstAcceptableStorageIndex, ActorItemHelper, containsItems } from "./actor/actor-inventory-utils.js";
import { ItemDeletionDialog } from "./apps/item-deletion-dialog.js"
import { d100importjson } from "./packs/d100import.js"
import { ActorSheetSFRPG } from "./actor/sheet/base.js";
//import {rollskill} from "./d100actor.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */


//  This class is to be rolled into "./actor/sheet/base.js" and "./actor/sheet/character.js"
export class d100ActorSheet extends ActorSheetSFRPG {

  constructor(...args) {
    super(...args);

    this._filters = {
        inventory: new Set(),
        spellbook: new Set(),
        features: new Set()
    };

    this._tooltips = null;
}
  
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        scrollY: [
            ".tab.attributes",
            ".inventory .inventory-list",
            ".features .inventory-list",
            ".spellbook .inventory-list",
            ".modifiers .inventory-list"
        ],
        tabs: [
            {navSelector: ".tabs", contentSelector: ".sheet-body", initial: "attributes"},
            {navSelector: ".subtabs", contentSelector: ".modifiers-body", initial: "permanent"},
            {navSelector: ".biotabs", contentSelector: ".bio-body", initial: "biography"}
        ]
    });
}
  
  /** @inheritdoc 
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["Alternityd100", "sheet", "actor"],
      template: "systems/Alternityd100/templates/d100Actor-sheet.html",
      width: 700,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".biography", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    
console.log(context.status)
    return context;
}


 
  

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
//console.log("HERE--",html)
 //   console.log(html)
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

// Rollable abilities.
html.find('.rollable').click(this._onRoll.bind(this));

    // Roll Skill Checks
    html.find('.rollable-skill').click(this._onRollSkillCheck.bind(this));
    //html.find(".skill > .skill-name > .rollable-skill").click(this._onRollSubSkillCheck.bind(this));


    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));

    html.find(".items .rollable2").on("click", this._onItemRoll.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll ").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });

       /* -------------------------------------------- */
        /*  Inventory
        /* -------------------------------------------- */

        // Create New Item
       // html.find('.item-create').click(ev => this._onItemCreate(ev));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id");
            const item = this.actor.items.get(itemId);
            // const item = this.actor.getEmbeddedEntity("Item", itemId);
            item.sheet.render(true);
        });

        // Delete Inventory Item 
        // THIS ALSO RUNS WHEN THE FOUNDRY FUNCTION WORKS
       // html.find('.item-delete').click(ev => this._onItemDelete(ev));

        // Item Dragging
        let handler = ev => this._onDragStart(ev);
        html.find('li.item').each((i, li) => {
      //console.log("Here")
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });



        // Item Rolling
        html.find('.item .item-image').click(event => this._onItemRoll(event));





        // Roll damage for item
        html.find('.item-action .damage').click(event => this._onItemRollDamage(event));
        html.find('.item-action .healing').click(event => this._onItemRollDamage(event));
        html.find('.item-action .defence').click(event => this._onItemRollDefence(event));
        // (De-)activate an item
        html.find('.item-detail .featActivate').click(event => this._onActivateFeat(event));
        html.find('.item-detail .featDeactivate').click(event => this._onDeactivateFeat(event));

        // Item Recharging
        html.find('.item .item-recharge').click(event => this._onItemRecharge(event));

        // Item Equipping
        html.find('.item .item-equip').click(event => this._onItemEquippedChange(event));
        



        // Condition toggling
        //html.find('.conditions input[type="checkbox"]').change(this._onToggleConditions.bind(this));

        // Actor resource update
       // html.find('.actor-resource-base-input').change(this._onActorResourceChanged.bind(this));



  }
/**
 * Handle clickable rolls.
 * @param {Event} event   The originating click event
 * @private
 */
 _onRoll(event) {
  event.preventDefault();
  const element = event.currentTarget;
  const dataset = element.dataset;

  if (dataset.roll) {
  //  console.log("yyyy");


    d100importjson(this.actor);
    //let roll = new Roll(dataset.roll, this.actor.system);
    //let label = dataset.label ? `Rolling ${dataset.label}` : '';
    //roll.toMessage({
    //  speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    //  flavor: label

  //  });
  }
}
  /* -------------------------------------------- */

  /**
   * Handle click events for skill checkss within the Actor Sheet
   * */
   clearTooltips() {
    this._tooltips = null;
}
_onRollSkillCheck(event) {
  event.preventDefault();
  //const skill = event.currentTarget.parentElement.parentElement.dataset;
  const element = event.currentTarget;
  const dataset = element.dataset;
  //let roll = new Roll(dataset.roll, this.actor.system);
  //let label = dataset.label ? `Rolling ${dataset.label}` : '';
  let skill = dataset.skillid ;
  let stepbonus = 0//this.actor.system.skills[skill].step
  //console.log("xxxx");
  //console.log("SKILL",skill,"ELEMENT",element,"DATASET",dataset, this, event);
  this.actor.rollSkill(skill, { steps:stepbonus, event: event, skipDialog: getSkipActionPrompt(event) });
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

      return item.update({'system.container.isOpen': !isOpen});
  }
  
  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.ItemNew"), type: "item"}, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  /*
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
   formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
*/


_prepareActorResource(actorResourceItem, actorData) {
    if (actorResourceItem?.type !== "actorResource") {
        return;
    }

    actorResourceItem.attributes = [];
    actorResourceItem.actorResourceData = null;
    if (actorResourceItem.data.enabled && actorResourceItem.data.type && actorResourceItem.data.subType) {
        actorResourceItem.attributes.push(`@resources.${actorResourceItem.data.type}.${actorResourceItem.data.subType}.base`);
        actorResourceItem.attributes.push(`@resources.${actorResourceItem.data.type}.${actorResourceItem.data.subType}.value`);

        if (actorResourceItem.data.base || actorResourceItem.data.base === 0) {
            actorResourceItem.actorResourceData = actorData.resources[actorResourceItem.data.type][actorResourceItem.data.subType];
        }
    }
}
/*
async processDroppedData(event, parsedDragData) {
    console.log("async processDroppedData(event, parsedDragData) {")
    const targetActor = new ActorItemHelper(this.actor.id, this.token?.id, this.token?.parent?.id);
    if (!ActorItemHelper.IsValidHelper(targetActor)) {
        ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragToExternalTokenError"));
        return;
    }

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
    } else if (parsedDragData.pack) {
        const pack = game.packs.get(parsedDragData.pack);
        const itemData = await pack.getDocument(parsedDragData.id);

        if (itemData.type === "class") {
            const existingClass = targetActor.findItem(x => x.type === "class" && x.name === itemData.name);
            if (existingClass) {
                const levelUpdate = {};
                levelUpdate["data.levels"] = existingClass.system.levels + 1;
                existingClass.update(levelUpdate)
                return existingClass;
            }
        }

        const createResult = await targetActor.createItem(itemData.data._source);
        const addedItem = targetActor.getItem(createResult[0].id);

        if (!(addedItem.type in SFRPG.containableTypes)) {
            targetContainer = null;
        }
        
        const itemInTargetActor = await moveItemBetweenActorsAsync(targetActor, addedItem, targetActor, targetContainer);
        if (itemInTargetActor === addedItem) {
            await this._onSortItem(event, itemInTargetActor.data);
            return itemInTargetActor;
        }

        return itemInTargetActor;
    } else if (parsedDragData.data) {
        const sourceActor = new ActorItemHelper(parsedDragData.actorId, parsedDragData.tokenId, parsedDragData.sceneId);
        if (!ActorItemHelper.IsValidHelper(sourceActor)) {
            ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
            return;
        }

        const itemToMove = await sourceActor.getItem(parsedDragData.data._id);

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
                    this._onSortItem(event, itemInTargetActor.data);
                }
            });
        } else {
            const itemInTargetActor = await moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer);
            if (itemInTargetActor === itemToMove) {
                return await this._onSortItem(event, itemInTargetActor.data);
            }
        }
    } else {
        const sidebarItem = game.items.get(parsedDragData.id);
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

            const addedItemResult = await targetActor.createItem(duplicate(sidebarItem.data));
            if (addedItemResult.length > 0) {
                const addedItem = targetActor.getItem(addedItemResult[0].id);

                if (targetContainer) {
                    let newContents = [];
                    if (targetContainer.system.container?.contents) {
                        newContents = duplicate(targetContainer.system.container?.contents || []);
                    }

                    const preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, addedItem) || 0;
                    newContents.push({id: addedItem.id, index: preferredStorageIndex});
                    
                    const update = { id: targetContainer.id, "data.container.contents": newContents };
                    await targetActor.updateItem(update);
                }

                return addedItem;
            }
            return null;
        }
        
  //console.log("Unknown item source: " + JSON.stringify(parsedDragData));
    }
}

*/

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


/**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event The originating click event
     */
 async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    console.log(header,event)
    let type = header.dataset.type;
    if (!type || type.includes(",")) {
        let types = duplicate(SFRPG.itemTypes);
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

        let templateData = {upper: "Item", lower: "item", types: types},
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
                        mergeObject(createData, formDataExtended.toObject());
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
        data: duplicate(header.dataset)
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







_onItemRollDamage(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.item').dataset.itemId;
    const item = this.actor.items.get(itemId);

    return item.rollDamage({event: event});
}
_onItemRollDefence(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.item').dataset.itemId;
    const item = this.actor.items.get(itemId);

    return item.rollBlankDefence(event,item,this.actor);
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
    const item = this.actor.items.get(itemId);

    if (item.data.type === "spell") {
        return this.actor.useSpell(item, {configureDialog: !event.shiftKey});
    }

    else return item.roll();
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

_onActorResourceChanged(event) {
    event.preventDefault();
    const target = $(event.currentTarget);
    const resourceId = target.data('resourceId');
    const resourceItem = this.actor.items.get(resourceId);
    const newBaseValue = parseInt(target[0].value);

    if (!Number.isNaN(newBaseValue)) {
        resourceItem.update({"data.base": newBaseValue});
    } else {
        resourceItem.update({"data.base": 0});
    }
}

/**
 * Handle rolling a Save
 * @param {Event} event   The originating click event
 * @private
 */
_onRollSave(event) {
    event.preventDefault();
    const save = event.currentTarget.parentElement.dataset.save;
    this.actor.rollSave(save, {event: event});
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
console.log("RELOAD HERE",item)
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

    return item.update({'system.container.isOpen': !isOpen});
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
async _onItemSummary(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents('.item'),
        item = this.actor.items.get(li.data('item-id')),
        chatData = item.getChatData({ secrets: this.actor.isOwner, rollData: this.actor.system });

    if (li.hasClass('expanded')) {
        let summary = li.children('.item-summary');
        summary.slideUp(200, () => summary.remove());
    } else {
        const desiredDescription = await TextEditor.enrichHTML(chatData.description.short || chatData.description.value, {});
        let div = $(`<div class="item-summary">${desiredDescription}</div>`);
        let props = $(`<div class="item-properties"></div>`);
        chatData.properties.forEach(p => props.append(`<span class="tag" ${ p.tooltip ? ("data-tippy-content='" + p.tooltip + "'") : ""}>${p.name}</span>`));

        div.append(props);
        li.append(div.hide());

        div.slideDown(200, function() { /* noop */ });
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

    const itemData = duplicate(item.data);
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

    const spellbookReduced = spells.reduce((spellBook, spell) => {
        const spellData = spell.data;

        const mode = spellData.preparation.mode || "";
        const lvl = levels[mode] || spellData.level || 0;
        const spellsPerDay = actorData.spells["spell" + lvl];

        if (!spellBook[lvl]) {
            spellBook[lvl] = {
                level: lvl,
                usesSlots: lvl > 0,
                canCreate: this.actor.isOwner && (lvl >= 0),
                canPrepare: (this.actor.data.type === 'character') && (lvl > 0),
                label: lvl >= 0 ? CONFIG.SFRPG.spellLevels[lvl] : CONFIG.SFRPG.spellPreparationModes[mode],
                spells: [],
                uses: useLabels[lvl] || spellsPerDay.value || 0,
                slots: useLabels[lvl] || spellsPerDay.max || 0,
                dataset: {"type": "spell", "level": lvl}
            };

            if (actorData.spells.classes && actorData.spells.classes.length > 0) {
                spellBook[lvl].classes = [];
                if (spellsPerDay?.perClass) {
                    for (const [classKey, storedData] of Object.entries(spellsPerDay.perClass)) {
                        const classInfo = actorData.spells.classes.find(x => x.key === classKey);
                        if (storedData.max > 0) {
                            spellBook[lvl].classes.push({key: classKey, name: classInfo?.name || classKey, value: storedData.value || 0, max: storedData.max});
                        }
                    }
                }
            }
        }

        spellBook[lvl].spells.push(spell);
        return spellBook;
    }, {});

    const spellbookValues = Object.values(spellbookReduced);
    spellbookValues.sort((a, b) => a.level - b.level);

    return spellbookValues;
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

async _onDrop(event) {

return  super._onDrop(event);

/*    event.preventDefault();

    const dragData = event.dataTransfer.getData('text/plain');
    const parsedDragData = JSON.parse(dragData);
    console.log("dragdata", event.dataTransfer,"dragdata", dragData)
    if (!parsedDragData) {
  //console.log("Unknown item data");
        return;
    }

    return this.processDroppedData(event, parsedDragData);

    */
}





















}
