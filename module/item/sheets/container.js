import { ItemSheetPF } from "./base.js";
import { ItemPF } from "../entity.js";
import { convertWeight, splitCurrency } from "../../lib.js";
import { getSkipActionPrompt } from "../../settings.js";
import { createConsumableSpellDialog } from "../../lib.js";
import { CurrencyTransfer } from "../../apps/currency-transfer.js";

export class ItemSheetPF_Container extends ItemSheetPF {
  constructor(...args) {
    super(...args);

    /**
     * Track item updates from the actor sheet.
     *
     * @type {object[]}
     */
    this._itemUpdates = [];
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 800,
      classes: ["pf1", "sheet", "item"],
      scrollY: ["section.inventory-body"],
      dragDrop: [
        { dragSelector: "li.item[data-item-id]", dropSelector: '.tab[data-tab="contents"]' },
        { dragSelector: "label.denomination" },
      ],
    });
  }

  /**
   * Return a dynamic reference to the HTML template path used to render this Item Sheet
   *
   * @returns {string}
   */
  get template() {
    return "systems/pf1/templates/items/container.hbs";
  }

  /* -------------------------------------------- */

  /**
   * Prepare item sheet data
   * Start with the base item data and extending with additional properties for rendering.
   */
  async getData() {
    const data = await super.getData();

    // The item's items
    data.items = this.item.items.map((i) => {
      i.data.labels = i.labels;
      i.data.hasAttack = i.hasAttack;
      i.data.hasMultiAttack = i.hasMultiAttack;
      i.data.hasDamage = i.hasDamage;
      i.data.hasRange = i.hasRange;
      i.data.hasEffect = i.hasEffect;
      i.data.hasAction = i.hasAction || i.isCharged;
      i.data.showUnidentifiedData = i.showUnidentifiedData;
      if (i.showUnidentifiedData)
        i.data.name =
          foundry.utils.getProperty(i.data, "data.unidentified.name") || foundry.utils.getProperty(i.data, "data.identifiedName") || i.data.name;
      else i.data.name = foundry.utils.getProperty(i.data, "data.identifiedName") || i.data.name;
      return i.data;
    });
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Show whether the item has currency
    data.hasCurrency = Object.values(this.object.system.currency).some((o) => o > 0);

    // Prepare inventory
    this._prepareContents(data);

    // Override description attributes
    {
      data.descriptionAttributes = [];

      // Add weight
      data.descriptionAttributes.push({
        isNumber: true,
        name: "data.baseWeight",
        fakeName: true,
        label: game.i18n.localize("PF1.Weight"),
        value: data.item.system.weightConverted,
        id: "data-baseWeight",
      });

      // Add price
      if (data.showIdentifyDescription) {
        data.descriptionAttributes.push(
          {
            isNumber: true,
            name: "data.basePrice",
            fakeName: true,
            label: game.i18n.localize("PF1.Price"),
            value: data.item.system.price,
            id: "data-basePrice",
          },
          {
            isNumber: true,
            name: "data.unidentified.basePrice",
            fakeName: true,
            label: game.i18n.localize("PF1.UnidentifiedPriceShort"),
            value: foundry.utils.getProperty(data.item.data, "data.unidentified.price"),
            id: "data-unidentifiedBasePrice",
          }
        );
      } else {
        if (data.showUnidentifiedData) {
          data.descriptionAttributes.push({
            isNumber: true,
            name: "data.unidentified.basePrice",
            fakeName: true,
            label: game.i18n.localize("PF1.Price"),
            value: foundry.utils.getProperty(data.item, "data.unidentified.price"),
            id: "data-basePrice",
          });
        } else {
          data.descriptionAttributes.push({
            isNumber: true,
            name: "data.basePrice",
            fakeName: true,
            label: game.i18n.localize("PF1.Price"),
            value: data.item.data.price,
            id: "data-basePrice",
          });
        }
      }

      // Add hit points
      data.descriptionAttributes.push({
        isRange: true,
        label: game.i18n.localize("PF1.HPShort"),
        value: {
          name: "data.hp.value",
          value: foundry.utils.getProperty(data.item.data, "data.hp.value"),
        },
        max: {
          name: "data.hp.max",
          value: foundry.utils.getProperty(data.item.data, "data.hp.max"),
        },
      });

      // Add hardness
      data.descriptionAttributes.push({
        isNumber: true,
        label: game.i18n.localize("PF1.Hardness"),
        name: "data.hardness",
        value: foundry.utils.getProperty(data.item.data, "data.hardness"),
      });

      // Add carried flag
      data.descriptionAttributes.push({
        isBoolean: true,
        name: "data.carried",
        label: game.i18n.localize("PF1.Carried"),
        value: data.item.system.carried,
      });
    }

    // Get contents weight
    data.contentsWeight = this.item.items.reduce((cur, o) => {
      return cur + o.system.weight * o.system.quantity;
    }, 0);
    data.contentsWeight += this.item._calculateCoinWeight(this.item.data);
    data.contentsWeight = Math.round(convertWeight(data.contentsWeight) * 10) / 10;
    let usystem = game.settings.get("pf1", "weightUnits"); // override
    if (usystem === "default") usystem = game.settings.get("pf1", "units");
    data.weightUnits = usystem === "metric" ? game.i18n.localize("PF1.Kgs") : game.i18n.localize("PF1.Lbs");

    // Get contents value
    const cpValue =
      this.item.getValue({ sellValue: 1, inLowestDenomination: true }) -
      this.item.getValue({ recursive: false, sellValue: 1, inLowestDenomination: true });
    const cpSellValue =
      this.item.getValue({ inLowestDenomination: true }) -
      this.item.getValue({ recursive: false, inLowestDenomination: true });

    data.totalValue = splitCurrency(cpValue);
    data.sellValue = splitCurrency(cpSellValue);

    // Set labels
    if (!data.labels) data.labels = {};
    data.labels.totalValue = game.i18n
      .localize("PF1.ItemContainerTotalValue")
      .format(data.totalValue.gp, data.totalValue.sp, data.totalValue.cp);
    data.labels.sellValue = game.i18n
      .localize("PF1.ItemContainerSellValue")
      .format(data.sellValue.gp, data.sellValue.sp, data.sellValue.cp);

    return data;
  }

  _prepareContents(data) {
    // Categorize items as inventory, spellbook, features, and classes
    const inventory = {
      weapon: {
        label: game.i18n.localize("PF1.InventoryWeapons"),
        canCreate: true,
        hasActions: true,
        items: [],
        canEquip: false,
        dataset: { type: "weapon" },
      },
      equipment: {
        label: game.i18n.localize("PF1.InventoryArmorEquipment"),
        canCreate: true,
        hasActions: true,
        items: [],
        canEquip: false,
        dataset: { type: "equipment" },
        hasSlots: true,
      },
      pharmaceutical: {
        label: game.i18n.localize("PF1.InventoryConsumables"),
        canCreate: true,
        hasActions: true,
        items: [],
        canEquip: false,
        dataset: { type: "pharmaceutical" },
      },
      gear: {
        label: CONFIG.PF1.lootTypes["gear"],
        canCreate: true,
        hasActions: false,
        items: [],
        canEquip: false,
        dataset: { type: "loot", "type-name": game.i18n.localize("PF1.LootTypeGearSingle"), "sub-type": "gear" },
      },
      ammo: {
        label: CONFIG.PF1.lootTypes["ammo"],
        canCreate: true,
        hasActions: false,
        items: [],
        canEquip: false,
        dataset: { type: "loot", "type-name": game.i18n.localize("PF1.LootTypeAmmoSingle"), "sub-type": "ammo" },
      },
      misc: {
        label: CONFIG.PF1.lootTypes["misc"],
        canCreate: true,
        hasActions: false,
        items: [],
        canEquip: false,
        dataset: { type: "loot", "type-name": game.i18n.localize("PF1.Misc"), "sub-type": "misc" },
      },
      tradeGoods: {
        label: CONFIG.PF1.lootTypes["tradeGoods"],
        canCreate: true,
        hasActions: false,
        items: [],
        canEquip: false,
        dataset: {
          type: "loot",
          "type-name": game.i18n.localize("PF1.LootTypeTradeGoodsSingle"),
          "sub-type": "tradeGoods",
        },
      },
      container: {
        label: game.i18n.localize("PF1.InventoryContainers"),
        canCreate: true,
        hasActions: false,
        items: [],
        dataset: { type: "container" },
      },
    };

    // Partition items by category
    const items = data.items.reduce((arr, item) => {
      item.img = item.img || DEFAULT_TOKEN;
      item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
      item.hasUses = item.data.uses && item.data.uses.max > 0;
      item.isCharged = ["day", "week", "charges"].includes(getProperty(item, "data.uses.per"));
      item.price = item.data.identified === false ? item.data.unidentified.price : item.data.price;

      const itemQuantity = foundry.utils.getProperty(item, "data.quantity") != null ? foundry.utils.getProperty(item, "data.quantity") : 1;
      const itemCharges = foundry.utils.getProperty(item, "data.uses.value") != null ? foundry.utils.getProperty(item, "data.uses.value") : 1;
      item.empty = itemQuantity <= 0 || (item.isCharged && itemCharges <= 0);
      arr.push(item);
      return arr;
    }, []);

    // Organize Inventory
    for (const i of items) {
      const subType = i.type === "loot" ? i.data.subType || "gear" : i.data.subType;
      i.data.quantity = i.data.quantity || 0;
      i.data.weight = i.data.weight || 0;
      i.totalWeight = Math.round(convertWeight(i.data.quantity * i.data.weight) * 10) / 10;
      let usystem = game.settings.get("pf1", "weightUnits"); // override
      if (usystem === "default") usystem = game.settings.get("pf1", "units");
      i.units = usystem === "metric" ? game.i18n.localize("PF1.Kgs") : game.i18n.localize("PF1.Lbs");
      if (inventory[i.type] != null) inventory[i.type].items.push(i);
      if (subType != null && inventory[subType] != null) inventory[subType].items.push(i);
    }

    data.inventory = Object.values(inventory);
  }

  activateListeners(html) {
console.log("HERE--",html)
    super.activateListeners(html);

    /* -------------------------------------------- */
    /*  Inventory
    /* -------------------------------------------- */

    // Owned Item management
    html.find(".item-create").click((ev) => this._onItemCreate(ev));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    html.find(".item-take").click(this._onItemTake.bind(this));

    // Item summaries
    html.find(".item .item-name h4").click((event) => this._onItemSummary(event));

    // Quick edit item
    html.find(".item .item-name h4").contextmenu(this._onItemEdit.bind(this));

    // Quick (un)identify item
    html.find("a.item-control.item-identify").click((ev) => {
      this._quickIdentifyItem(ev);
    });

    // Duplicate item
    html.find("a.item-control.item-duplicate").click(this._duplicateItem.bind(this));

    // Quick add item quantity
    html.find("a.item-control.item-quantity-add").click((ev) => {
      this._quickChangeItemQuantity(ev, 1);
    });
    // Quick subtract item quantity
    html.find("a.item-control.item-quantity-subtract").click((ev) => {
      this._quickChangeItemQuantity(ev, -1);
    });

    // Quick Item Action control
    html.find(".item-actions a").click((ev) => this._quickItemActionControl(ev));

    // Set item uses
    html
      .find(".item-detail.item-uses input[type='text']:not(:disabled)")
      .off("change")
      .change(this._setItemUses.bind(this))
      .on("wheel", this._setItemUses.bind(this));

    // Convert currency
    html.find("a.convert-currency").click(this._convertCurrency.bind(this));

    // Item Rolling
    html.find(".item .item-image").click((event) => this._onItemRoll(event));
  }

  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const typeName = header.dataset.typeName || header.dataset.type;
    const itemData = {
      name: `New ${typeName.capitalize()}`,
      type: type,
      data: foundry.utils.duplicate(header.dataset),
    };
    delete itemData.data["type"];
    return this.item.createContainerContent(itemData);
  }

  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.item.getContainerContent(li.dataset.itemId);
    item.sheet.render(true);
  }

  _onItemDelete(event) {
    event.preventDefault();

    const button = event.currentTarget;
    if (button.disabled) return;

    const li = event.currentTarget.closest(".item");
    if (keyboard.isDown("Shift")) {
      this.item.deleteContainerContent(li.dataset.itemId);
    } else {
      button.disabled = true;

      const item = this.document.items.get(li.dataset.itemId);

      const msg = `<p>${game.i18n.localize("PF1.DeleteItemConfirmation")}</p>`;
      Dialog.confirm({
        title: game.i18n.localize("PF1.DeleteItemTitle").format(item.name),
        content: msg,
        yes: () => {
          this.item.deleteContainerContent(li.dataset.itemId);
          button.disabled = false;
        },
        no: () => (button.disabled = false),
        rejectClose: true,
      }).then(null, () => (button.disabled = false));
    }
  }

  async _onItemTake(event) {
    event.preventDefault();

    const li = event.currentTarget.closest(".item");
    const item = this.item.getContainerContent(li.dataset.itemId);

    if (this.actor) {
      await this.actor.createOwnedItem(item.data);
      await this.item.deleteContainerContent(item._id);
    }
  }

  _onDragStart(event) {
    // Skip entity links, since they should be handled differently
    if (event.target.classList.contains("entity-link")) return;

    // Create drag data for an owned item
    const elem = event.currentTarget;
    let dragData;
    if (elem.classList.contains("denomination")) {
      if (!this.item.testUserPermission(game.user, 3)) return;
      dragData = {
        type: "Currency",
        alt: elem.classList.contains("alt-currency"),
        currency: [...elem.classList].find((o) => /[pgsc]p/.test(o)),
        containerId: this.item.id,
        amount: parseInt(elem.nextElementSibling.textContent || elem.nextElementSibling.value),
      };
    } else {
      const item = this.item.getContainerContent(elem.dataset.itemId);
      dragData = {
        type: "Item",
        data: item.data,
        containerId: this.item.id,
      };
    }

    // Add actor to drag data
    const actor = this.item.parentActor;
    if (actor) {
      dragData.actorId = actor.id;
      dragData.sceneId = actor.isToken ? canvas.scene?.id : null;
      dragData.tokenId = actor.isToken ? actor.token.id : null;
    }

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  _onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
console.log("container")
    // Try to extract the data
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return false;
    }
    const item = this.item;

    // Handle the drop with a Hooked function
    const allowed = Hooks.call("dropContainerSheetData", item, this, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
      case "Item":
        return this._onDropItem(event, data);
      case "Currency": {
        return this._onDropCurrency(event, data);
      }
    }
  }

  async _onDropCurrency(event, data) {
    const sourceActor = data.tokenId ? game.actors.tokens[data.tokenId] : data.actorId;
    return new CurrencyTransfer(
      { actor: sourceActor, container: data.containerId, alt: data.alt },
      {
        actor: this.actor,
        container: this.item.id,
        amount: Object.fromEntries([[data.currency, parseInt(data.amount)]]),
      }
    ).render(true);
  }

  async _onDropItem(event, data) {
    if (!this.item.isOwner) return false;

    let actor;
    if (data.tokenId) {
      actor = game.actors.tokens[data.tokenId];
    } else if (data.actorId) {
      actor = game.actors.contents.find((o) => o.id === data.actorId);
    }

    const item = await ItemPF.fromDropData(data);
    const itemData = foundry.utils.duplicate(item.data);

    // Sort item
    if (data.containerId === this.item.id) return this._onSortItem(event, itemData);

    // Create pharmaceutical from spell
    if (itemData.type === "spell") {
      const resultData = await createConsumableSpellDialog(itemData, { allowSpell: false });
      if (resultData) return this.item.createContainerContent(resultData);
      else return false;
    }

    // Create or transfer item
    if (ItemPF.isInventoryItem(item.data.type)) {
      await this.item.createContainerContent(itemData);

      if (actor && actor === this.item.parentActor) {
        if (actor.items.get(data.data._id)) {
          await actor.deleteEmbeddedDocuments("Item", [data.data._id]);
        } else {
          const containerItem = actor.containerItems.find((i) => i.id === data.data._id);
          if (containerItem) {
            await containerItem.parentItem.deleteContainerContent(data.data._id);
          }
        }
      }
    }
  }

  async _quickIdentifyItem(event) {
    event.preventDefault();
    if (!game.user.isGM) {
      const msg = game.i18n.localize("PF1.ErrorCantIdentify");
      console.error(msg);
      return ui.notifications.error(msg);
    }
    const itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    const item = this.item.getContainerContent(itemId);

    if (hasProperty(item.data, "data.identified")) {
      return item.update({ "data.identified": !item.system.identified });
    }
  }

  async _duplicateItem(event) {
    event.preventDefault();
    const a = event.currentTarget;

    const itemId = $(a).parents(".item").attr("data-item-id");
    const item = this.item.getContainerContent(itemId);
    const data = foundry.utils.duplicate(item.data);

    delete data._id;
    data.name = `${data.name} (Copy)`;
    if (data.data.links) data.data.links = {};

    return this.item.createContainerContent(data);
  }

  async _quickChangeItemQuantity(event, add = 1) {
    event.preventDefault();
    const itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    const item = this.item.getContainerContent(itemId);

    const curQuantity = foundry.utils.getProperty(item.data, "data.quantity") || 0;
    const newQuantity = Math.max(0, curQuantity + add);
    return item.update({ "data.quantity": newQuantity });
  }

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   *
   * @param event
   * @private
   */
  _onItemSummary(event) {
    event.preventDefault();
    const li = $(event.currentTarget).closest(".item"),
      item = this.item.getContainerContent(li.attr("data-item-id")),
      chatData = item.getChatData({ secrets: this.actor ? this.actor.owner : this.owner });

    // Toggle summary
    if (li.hasClass("expanded")) {
      const summary = li.children(".item-summary");
      summary.slideUp(200, () => summary.remove());
    } else {
      const div = $(`<div class="item-summary">${chatData.description.value}</div>`);
      const props = $(`<div class="item-properties"></div>`);
      chatData.properties.forEach((p) => props.append(`<span class="tag">${p}</span>`));
      div.append(props);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }

  async _quickItemActionControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const itemId = $(event.currentTarget).closest(".item").attr("data-item-id");
    const item = this.item.getContainerContent(itemId);

    // Quick Attack
    if (a.classList.contains("item-attack")) {
      await item.use({ ev: event, skipDialog: getSkipActionPrompt() });
    }
  }

  async _setItemUses(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const itemId = el.closest(".item").dataset.itemId;
    const item = this.item.getContainerContent(itemId);

    this._mouseWheelAdd(event.originalEvent, el);

    const value = Number(el.value);
    this.setItemUpdate(item._id, "data.uses.value", value);

    // Update on lose focus
    if (event.originalEvent instanceof MouseEvent) {
      if (!this._submitQueued) {
        $(el).one("mouseleave", (event) => {
          this._updateItems();
        });
      }
    } else this._updateItems();
  }

  async _updateItems() {
    const promises = [];

    const updates = foundry.utils.duplicate(this._itemUpdates);
    this._itemUpdates = [];

    for (const data of updates) {
      const item = this.item.items.filter((o) => {
        return o._id === data._id;
      })[0];
      if (item == null) continue;

      delete data._id;
      if (item.testUserPermission(game.user, "OWNER")) promises.push(item.update(data));
    }

    return Promise.all(promises);
  }

  setItemUpdate(id, key, value) {
    let obj = this._itemUpdates.filter((o) => {
      return o._id === id;
    })[0];
    if (obj == null) {
      obj = { _id: id };
      this._itemUpdates.push(obj);
    }

    obj[key] = value;
  }

  _mouseWheelAdd(event, el) {
    if (event && event instanceof WheelEvent) {
      const value = parseFloat(el.value);
      if (Number.isNaN(value)) return;

      const increase = -Math.sign(event.deltaY);
      const amount = parseFloat(el.dataset.wheelStep) || 1;
      el.value = value + amount * increase;
    }
  }

  _convertCurrency(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const currencyType = a.dataset.type;

    this.item.convertCurrency(currencyType);
  }

  /**
   * @override
   */
  _onSortItem(event, itemData) {
    // Get the drag source and its siblings
    const source = this.item.getContainerContent(itemData._id);
    const siblings = this._getSortSiblings(source);

    // Get the drop target
    const dropTarget = event.target.closest(".item");
    const targetId = dropTarget ? dropTarget.dataset.itemId : null;
    const target = siblings.find((s) => s.data._id === targetId);

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(source, { target: target, siblings });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target.data._id;
      return update;
    });

    // Perform the update
    return this.item.updateContainerContents(updateData);
  }

  /**
   * @override
   */
  _getSortSiblings(source) {
    return this.item.items.filter((i) => {
      if (ItemPF.isInventoryItem(source.data.type)) return ItemPF.isInventoryItem(i.data.type);
      return i.data.type === source.data.type && i.data._id !== source.data._id;
    });
  }

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   *
   * @param event
   * @private
   */
  _onItemRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.item.getContainerContent(itemId);

    if (item == null) return;
    return item.roll();
  }
}
