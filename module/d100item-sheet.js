import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class d100ItemSheet extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["Alternityd100", "sheet", "item"],
      template: "systems/Alternityd100/templates/d100item-sheet.html",
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".attributes"],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.system;
    context.dtypes = ATTRIBUTE_TYPES;
    //data.config = CONFIG.SFRPG;
    //data.d100Aconfig = CONFIG.d100A;

    return context;
    
  }

 /* get template()
  The template() method has the get keyword placed before it to signal that this is a getter method for a property. In this case, we're just returning a single ${path}/item-sheet.html template for all items. However, if you have multiple item types such as item, feat, and spell, you could remove the first return statement and uncomment the second return statement to dynamically return a template matching the item type name, such as templates/item/spell-sheet.html.
*/
/** @override */
get template() {
  const path = "systems/Alternityd100/templates";
  // Return a single sheet for all item types.
  return `${path}/d100item-sheet.html`;
  // Alternatively, you could use the following return statement to do a
  // unique item sheet by type, like `weapon-sheet.html` -->.

  // return `${path}/${this.item.data.type}-sheet.html`;
}
  /* -------------------------------------------- */
/** @override */
setPosition(options = {}) {
  const position = super.setPosition(options);
  const sheetBody = this.element.find(".sheet-body");
  const bodyHeight = position.height - 192;
  sheetBody.css("height", bodyHeight);
  return position;
}

/* -------------------------------------------- */
  /** @inheritdoc */
	activateListeners(html) {
console.log("HERE--",html)
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }

  /* -------------------------------------------- */

  /** @override */
  /*
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
  */
}
