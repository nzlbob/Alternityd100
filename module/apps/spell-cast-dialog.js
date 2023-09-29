import { ActorSFRPG } from "../actor/actor.js";
import { ItemSFRPG } from "../item/item.js";

/**
 * A specialized Dialog subclass for casting a spell item at a certain level
 * @type {Dialog}
 */
export class SpellCastDialog extends Dialog {
    constructor(actor, item, dialogData={}, options={}) {
      super(dialogData, options);
      this.options.classes = ["sfrpg", "dialog"];
  
      /**
       * Store a reference to the Actor entity which is casting the spell
       * @type {ActorSFRPG}
       */
      this.actor = actor;
  
      /**
       * Store a reference to the Item entity which is the spell being cast
       * @type {ItemSFRPG}
       */
      this.item = item;
    }
  
    /* -------------------------------------------- */
    /*  Rendering                                   */
    /* -------------------------------------------- */
  
    activateListeners(html) {
console.log("HERE--",html)
      super.activateListeners(html);
    }
  
    /* -------------------------------------------- */
  
    /**
     * A constructor function which displays the Spell Cast Dialog app for a given Actor and Item.
     * Returns a Promise which resolves to the dialog FormData once the workflow has been completed.
     * @param {ActorSFRPG} actor
     * @param {ItemSFRPG} item
     * @return {Promise}
     */
    static async create(actor, item) {
      const ad = actor.system;
      const id = item.system;
  
      // Determine whether the spell may be upcast
      const lvl = id.level;
      const canUpcast = (lvl > 0); //&& (id.preparation.mode === "prepared");
  
      // Determine the levels which are feasible
      const spellLevels = Object.values(ad.spells).map((l, i) => {
        if ( !canUpcast ) return { canCast: false }
        const label = (lvl > 0) ? `${game.i18n.format(CONFIG.SFRPG.spellLevels[i])} (${l.value} Slots)` : game.i18n.format(CONFIG.SFRPG.spellLevels[i]);
        return {
          level: i,
          label: label,
          canCast: parseInt(l.max) > 0,
          hasSlots: (parseInt(l.max) > 0) && (parseInt(l.value) > 0)
        }
      }).filter(l => l.canCast && (lvl <= l.level));
  
      // Determine whether the spell may be cast at all
      const canCast = spellLevels.some(l => l.hasSlots);
  
      // Render the Spell casting template
      const html = await renderTemplate("systems/Alternityd100/templates/apps/spell-cast.html", {
        item: item.data,
        canCast,
        canUpcast,
        consume: canUpcast,
        spellLevels
      });
  
      // Create the Dialog and return as a Promise
      return new Promise((resolve, reject) => {
        const dlg = new this(actor, item, {
          title: `${item.name}: Spell Configuration`,
          content: html,
          buttons: {
            cast: {
              icon: '<i class="fas fa-magic"></i>',
              label: "Cast",
              callback: html => resolve(new FormData(html[0].querySelector("#spell-config-form")))
            }
          },
          default: "cast",
          close: reject
        });
        dlg.render(true);
      });
    }
  }
  