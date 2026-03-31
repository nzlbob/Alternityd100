import { d100A } from "../../d100Aconfig.js"
import { d100ActorSheet } from "../../d100Actor-sheet.js";
import {ATTRIBUTE_TYPES} from "../../constants.js";
import { EntitySheetHelper } from "../../helper.js";
import { computeCompoundBulkForItem } from "../actor-inventory-utils.js"

const SFRPG = d100A;

/**
 * An Actor sheet for NPC type characters in the Alternity system.
 * 
 * Extends the base d100ActorSheet class.
 * @type {d100ActorSheet}
 */
export class d100AActorSheetNPC extends d100ActorSheet {
    static get DEFAULT_OPTIONS() {
        const base = super.DEFAULT_OPTIONS;
        return foundry.utils.mergeObject(base, {
            position: { width: 720, height: 765 },
            window: { contentClasses: [...base.window.contentClasses, "npc"] }
        }, { inplace: false, overwrite: true });
    }

        static PARTS = {
            form: { template: 'systems/Alternityd100/templates/actors/npc-sheet.html' }
        };

    /** @override */
    _onRender(context, options) {
        super._onRender?.(context, options);

        const root = this.element;
        if (!root) return;

        root.querySelectorAll('.reload').forEach((el) => {
            el.addEventListener('click', this._onReloadWeapon.bind(this));
        });
    }

    activateListeners(html) {
        // AppV2 no longer uses this; listeners are bound in _onRender.
        ui.notifications?.warn?.(
            "d100AActorSheetNPC.activateListeners called - use _onRender(context, options) for AppV2."
        );
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.shorthand = !!game.settings.get("Alternityd100", "macroShorthand");
        context.testvalue = { name: this.actor.token?.inCombat, type: "Thing" };

        context.dtypes = ATTRIBUTE_TYPES;
        context.professions = d100A?.npc?.npcType;
        context.npcQuality = d100A?.npc?.npcQuality;

        try {
            EntitySheetHelper.getAttributeData(context.system);
        } catch (_e) {
            // ignore
        }

        context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.object.system.details.biography.value, { async: true });
        context.enrichedGMNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.object.system.details.biography.gmNotes, { async: true });

        return context;
    }

    /**
     * Toggle the visibility of skills on the NPC sheet.
     * 
     * @param {Event} event The originating click event
     */
    _toggleSkills(event) {
        event.preventDefault();
        
        this.actor.toggleNpcSkills();
    }

    _prepareItems(data) {

        //console.log(data);
              const actorData = data;
      
              const inventory = {
                  weapon: { label: game.i18n.format(SFRPG.itemTypes["weapon"]), items: [], dataset: { type: "weapon" }, allowAdd: true },
                  shield: { label: game.i18n.format(SFRPG.itemTypes["shield"]), items: [], dataset: { type: "shield" }, allowAdd: true },
                  equipment: { label: game.i18n.format(SFRPG.itemTypes["equipment"]), items: [], dataset: { type: "equipment" }, allowAdd: true },
                  ammunition: { label: game.i18n.format(SFRPG.itemTypes["ammunition"]), items: [], dataset: { type: "ammunition" }, allowAdd: true },
                  pharmaceutical: { label: game.i18n.format(SFRPG.itemTypes["pharmaceutical"]), items: [], dataset: { type: "pharmaceutical" }, allowAdd: true },
                  goods: { label: game.i18n.format(SFRPG.itemTypes["goods"]), items: [], dataset: { type: "goods" }, allowAdd: true },
                  container: { label: game.i18n.format(SFRPG.itemTypes["container"]), items: [], dataset: { type: "container" }, allowAdd: true },
                  technological: { label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.SpecialItems"), items: [], dataset: { type: "technological,magic,hybrid" }, allowAdd: true },
                  fusion: { label: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.EquipmentEnhancements"), items: [], dataset: { type: "fusion,upgrade,weaponAccessory" }, allowAdd: true },
                  augmentation: { label: game.i18n.format(SFRPG.itemTypes["augmentation"]), items: [], dataset: { type: "augmentation" }, allowAdd: true }
              };
      
              let physicalInventoryItems = [];
              for (const [key, value] of Object.entries(inventory)) {
                  const datasetType = value.dataset.type;
                  const types = datasetType.split(',');
                  physicalInventoryItems = physicalInventoryItems.concat(types);
              }
      /*console.log("physicalInventoryItems" , physicalInventoryItems)*/
              //   0      1       2      3        4      5       6           7            8           9                10   asis,
              let [items, spells, feats, classes, races, perks, flaws, achievements, archetypes, conditionItems, actorResources] = data.actor.items.reduce((arr, item) => {
           //console.log(item)
                  item.img = item.img || DEFAULT_TOKEN;
                  item.isStack = item.quantity ? item.quantity > 1 : false;
                  item.isOnCooldown = item.recharge && !!item.recharge.value && (item.recharge.charged === false);
                  if (["meleeW"].includes(item.weaponType)){item.actionType = "mwak"}
                  if (["rangedW","explos","heavy"].includes(item.weaponType)){item.actionType = "rwak"}
      
                  //item.hasAttack = ["mwak", "rwak", "msak", "rsak"].includes(item.actionType) //&& (!["weapon", "shield"].includes(item.type) || item.system.equipped);
                  //console.log("HD",item,["weapon", "shield"].includes(item.type))
                  
                  //item.hasDamage = ["weapon", "shield"].includes(item.type) ? !!(item.damage.ord.dice && item.damage.ord.type) && (!["weapon", "shield"].includes(item.type) || item.equipped) : false;
                  //item.hasdefence = ["equipment", "shield"].includes(item.type) ? !!(item.armor.EN && item.armor.LI && item.armor.HI) && (!["equipment", "shield"].includes(item.type) || item.data.equipped) : false;
                 
                  //console.log("HD/HA",item.hasDamage,item.hasAttack)//!!(item.data.damage.ord.dice && item.data.damage.ord.type))
                  //item.hasDamage = !!(item.data.damage.ord.dice && item.data.damage.ord.type) && (!["weapon", "shield"].includes(item.type) || item.data.equipped);
                  //item.hasUses = item.document.canBeUsed();
                  item.isCharged = !item.hasUses || item.getRemainingUses() <= 0 || !item.isOnCooldown;
           //console.log("\n\n\n\n************************\n\nItem\n\n\n**********\n\n" , item)
                  //item.hasCapacity = item.hasCapacity();
            //console.log("item", item)
                  if (item.hasCapacity) {
                      item.capacityCurrent = item.getCurrentCapacity;
                      item.capacityMaximum = item.getMaxCapacity;
                  }
      
                  if (item.type === "actorResource") {
                      this._prepareActorResource(item, actorData);
                  }
      
                  if (item.type === "spell") {
                      const container = data.items.find(x => x.system.container?.contents?.find(x => x.id === item._id) || false);
                      if (!container) {
                          arr[1].push(item); // spells
                      } else {
                          arr[0].push(item); // items
                      }
                  }
                  else if (item.type === "feat") {
                      if ((item.system.requirements?.toLowerCase() || "") === "condition") {
                          arr[9].push(item); // conditionItems
                      } else {
                          arr[2].push(item); // feats
                      }
                      item.isFeat = true;
                  }
                  else if (item.type === "class") arr[3].push(item); // classes
                  else if (item.type === "race") arr[4].push(item); // races
                  else if (item.type === "perk") arr[5].push(item); // perks
                  else if (item.type === "flaw") arr[6].push(item); // flaws
                  else if (item.type === "achievement") arr[7].push(item); // achievements
                  else if (item.type === "archetypes") arr[8].push(item); // archetypes
                 // else if (item.type === "asi") arr[9].push(item); // asis
                  else if (item.type === "actorResource") arr[10].push(item); // asis
                  else if (physicalInventoryItems.includes(item.type)) arr[0].push(item); // items
                  else arr[0].push(item); // items
                 // console.log(arr);
                  return arr;
              }, [[], [], [], [], [], [], [], [], [], [],[],[],[]]);
              
              //const spellbook = this._prepareSpellbook(data, spells);
      
              let totalValue = 0;
              for (const i of items) {
                  i.img = i.img || DEFAULT_TOKEN;
      
                  if (!physicalInventoryItems.includes(i.type)) {
                      continue;
                  }
      
                  i.system.quantity = i.system.quantity || 0;
                  i.system.price = i.system.price || 0;
                  i.system.bulk = i.system.bulk || "-";
                  i.isOpen = i.system.container?.isOpen === undefined ? true : i.system.container.isOpen;
      
                  let weight = 0;
                  if (i.system.bulk === "L") {
                      weight = 0.1;
                  } else if (i.system.bulk === "-") {
                      weight = 0;
                  } else {
                      weight = parseFloat(i.system.bulk);
                  }
      
                  // Compute number of packs based on quantityPerPack, provided quantityPerPack is set to a value.
                  let packs = 1;
                  if (i.system.quantityPerPack === null || i.system.quantityPerPack === undefined) {
                      packs = i.system.quantity;
                  } else {
                      if (i.system.quantityPerPack <= 0) {
                          packs = 0;
                      } else {
                          packs = Math.floor(i.system.quantity / i.system.quantityPerPack);
                      }
                  }
      
                  i.totalWeight = packs * weight;
                  if (i.system.equippedBulkMultiplier !== undefined && i.system.equipped) {
                      i.totalWeight *= i.system.equippedBulkMultiplier;
                  }
                  i.totalWeight = i.totalWeight < 1 && i.totalWeight > 0 ? "L" : 
                                  i.totalWeight === 0 ? "-" : Math.floor(i.totalWeight);
      
                  totalValue += (i.system.price * packs);
              }
      
              this.processItemContainment(items, function (itemType, itemData) {
                  let targetItemType = itemType;
                  if (!(itemType in inventory)) {
                      for (let [key, entry] of Object.entries(inventory)) {
                          if (entry.dataset.type.includes(itemType)) {
                              targetItemType = key;
                              break;
                          }
                      }
                  }
      
                  if (!(targetItemType in inventory)) {
                      let label = "SFRPG.Items.Categories.MiscellaneousItems";
                      if (targetItemType in SFRPG.itemTypes) {
                          label = SFRPG.itemTypes[targetItemType];
                      } else {
                    //console.log(`Item '${itemData.item.name}' with type '${targetItemType}' is not a registered item type!`);
                      }
                      inventory[targetItemType] = { label: game.i18n.format(label), items: [], dataset: { }, allowAdd: false };
                  }
                  inventory[targetItemType].items.push(itemData);
              });
      
              let totalWeight = 0;
              for (const section of Object.entries(inventory)) {
                  for (const sectionItem of section[1].items) {
                      if (!(sectionItem.item.type in inventory)) {
                          continue;
                      }
      
                      const itemBulk = computeCompoundBulkForItem(sectionItem.item, sectionItem.contents);
                      totalWeight += itemBulk;
                  }
              }
              totalWeight = Math.floor(totalWeight / 10); // Divide bulk by 10 to correct for integer-space bulk calculation.
              let encumbrance = this._computeEncumbrance(totalWeight, actorData.actor.system);
              let inventoryValue = Math.floor(totalValue);
      
              const features = {
                 // classes: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Classes"), items: [], hasActions: false, dataset: { type: "class" }, isClass: true },
                  race: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Race"), items: [], hasActions: false, dataset: { type: "race" }, isRace: true },
                  perk: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Perk"), items: [], hasActions: false, dataset: { type: "perk" }, isPerk: true },
                  flaw: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Flaw"), items: [], hasActions: false, dataset: { type: "flaw" }, isFlaw: true },
                  achievement: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Achievement"), items: [], hasActions: false, dataset: { type: "achievement" }, isAchievement: true },
                  //asi: { label: game.i18n.format("SFRPG.Items.Categories.AbilityScoreIncrease"), items: asis, hasActions: false, dataset: { type: "asi" }, isASI: true },
               //   archetypes: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.Archetypes"), items: [], dataset: { type: "archetypes" }, isArchetype: true },
                //  active: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActiveFeats"), items: [], hasActions: true, dataset: { type: "feat", "activation.type": "action" } },
               //   passive: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.PassiveFeats"), items: [], hasActions: false, dataset: { type: "feat" } },
                  resources: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActorResources"), items: [], hasActions: false, dataset: { type: "actorResource" } }
              };
      
              for (let f of feats) {
                  if (f.system.activation.type) features.active.items.push(f);
                  else features.passive.items.push(f);
              }
      
              classes.sort((a, b) => b.levels - a.levels);
             // console.log(races,flaws,achievements,archetypes)
            //  features.classes.items = classes;
              features.race.items = races;
              features.perk.items = perks;
              features.flaw.items = flaws;
              features.achievement.items = achievements;
              //features.asi.items = asis;
            //  features.archetypes.items = archetypes;
              features.resources.items = actorResources;
      
              data.inventory = Object.values(inventory);
              //data.spellbook = spellbook;
              data.features = Object.values(features);
      
              const modifiers = {
                  effects: { label: "Effects", dataset: { subtab: "effects" }, isEffects: true, effects: [], statusChoices: [] },
                  permanent: { label: "SFRPG.ModifiersPermanentTabLabel", modifiers: [], dataset: { subtab: "permanent" } },
                  temporary: { label: "SFRPG.ModifiersTemporaryTabLabel", modifiers: [], dataset: { subtab: "temporary" } }
              };
        //console.log("-----actorData",actorData,modifiers)
              let [permanent, temporary, itemModifiers, conditions, misc] = actorData.actor.system.modifiers.reduce((arr, modifier) => {
                  if (modifier.subtab === "permanent") arr[0].push(modifier);
                  else if (modifier.subtab === "conditions") arr[3].push(modifier);
                  else arr[1].push(modifier); // Any unspecific categories go into temporary.
      
                  return arr;
              }, [[], [], [], [], []]);
      
              modifiers.permanent.modifiers = permanent;
              modifiers.temporary.modifiers = temporary.concat(conditions);
      
              data.modifiers = Object.values(modifiers);
        //console.log("\n------Data-----\n", data)
          }
      
          /**
           * Compute the level and percentage of encumbrance for an Actor.
           * 
           * @param {Number} totalWeight The cumulative item weight from inventory items
           * @param {Object} actorData The data object for the Actor being rendered
           * @returns {Object} An object describing the character's encumbrance level
           * @private
           */
          _computeEncumbrance(totalWeight, actorData) {
              
        //console.log("actorData", actorData )
              const enc = {
                  max: actorData.attributes.encumbrance.max,
                  tooltip: actorData.attributes.encumbrance.tooltip,
                  value: totalWeight
              };
      
              enc.pct = Math.min(enc.value * 100 / enc.max, 99);
              enc.encumbered = enc.pct > 50;
              return enc;
          }

    /**
     * This method is called upon form submission after form data is validated
     * 
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const crs = { "1/8": 0.125, "1/6": 1/6, "1/4": 0.25, "1/3": 1/3, "1/2": 0.5 };
        let crv = "data.details.cr";
        let cr = formData[crv];
        cr = crs[cr] || parseFloat(cr);
        if (cr) formData[crv] = cr < 1 ? cr : parseInt(cr);

        // Parent ActorSheet update steps
        return super._updateObject(event, formData);
    }
}
