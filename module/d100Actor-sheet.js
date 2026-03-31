import { EntitySheetHelper } from "./helper.js";

import { getSkipActionPrompt } from "./settings.js";
import { Diced100 } from "./dice.js";
import { moveItemBetweenActorsAsync, getFirstAcceptableStorageIndex, ActorItemHelper, containsItems } from "./actor/actor-inventory-utils.js";
import { ItemDeletionDialog } from "./apps/item-deletion-dialog.js"
import { d100importjson } from "./packs/d100import.js"
import { d100stepdie } from "../module/modifiers/d100mod.js";
//import { ActorSheetSFRPG } from "./actor/sheet/base.js";
//import {rollskill} from "./d100actor.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */


//  This class is to be rolled into "./actor/sheet/base.js" and "./actor/sheet/character.js"
export class d100ActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

    _localizeEffectText(value) {
        if (value == null) return "";
        const text = String(value).trim();
        if (!text) return "";
        return game.i18n.localize(text);
    }

    _getStatusDurationLabel(effect) {
        const duration = effect?.duration ?? {};
        if (typeof duration.label === "string" && duration.label.trim()) return duration.label;

        const parts = [];
        if (Number.isFinite(duration.remaining) && duration.type) {
            parts.push(`${duration.remaining} ${duration.type}`);
        } else {
            if (Number.isFinite(duration.rounds)) parts.push(`${duration.rounds} rounds`);
            if (Number.isFinite(duration.turns)) parts.push(`${duration.turns} turns`);
            if (Number.isFinite(duration.seconds)) parts.push(`${duration.seconds} sec`);
        }

        return parts.join(", ");
    }

    _getStatusEffectChoices() {
        const actorType = this.actor?.type ?? "";
        const configuredEffects = CONFIG?.d100A?.statusEffects ?? CONFIG?.statusEffects ?? [];
        const activeStatusIds = new Set(this.actor?.statuses ?? []);

        for (const effect of this.actor?.effects ?? []) {
            if (effect?.disabled) continue;
            for (const statusId of Diced100._getStatusEffectIds(effect)) {
                activeStatusIds.add(statusId);
            }
        }

        return configuredEffects
            .filter((statusEffect) => {
                const actorTypes = statusEffect?.hud?.actorTypes;
                return !Array.isArray(actorTypes) || actorTypes.length === 0 || actorTypes.includes(actorType);
            })
            .map((statusEffect) => ({
                id: statusEffect.id,
                label: this._localizeEffectText(statusEffect.label ?? statusEffect.name ?? statusEffect.id),
                img: statusEffect.img ?? statusEffect.icon ?? "",
                tooltip: statusEffect?.system?.tooltip ?? "",
                isActive: activeStatusIds.has(statusEffect.id)
            }));
    }

    _getActorEffectsList() {
        const configuredEffects = CONFIG?.d100A?.statusEffects ?? CONFIG?.statusEffects ?? [];

        return Array.from(this.actor?.effects ?? []).map((effect) => {
            const statusIds = Diced100._getStatusEffectIds(effect);
            const configuredEffect = configuredEffects.find((statusEffect) => statusIds.includes(statusEffect?.id)) ?? null;

            return {
                id: effect.id,
                label: this._localizeEffectText(effect?.name ?? effect?.label ?? configuredEffect?.label ?? configuredEffect?.name ?? "Effect"),
                img: effect?.img ?? effect?.icon ?? configuredEffect?.img ?? configuredEffect?.icon ?? "",
                duration: this._getStatusDurationLabel(effect),
                tooltip: effect?.description ?? effect?.system?.tooltip ?? configuredEffect?.system?.tooltip ?? "",
                disabled: !!effect.disabled,
                isStatusEffect: statusIds.length > 0,
                statusIds: statusIds.join(", ")
            };
        });
    }

    _prepareEffectsSection(data) {
        const statusChoices = this._getStatusEffectChoices();
        const actorEffects = this._getActorEffectsList();

        data.statusEffectChoices = statusChoices;
        data.activeStatusEffects = actorEffects.filter((effect) => !effect.disabled);
        data.actorEffects = actorEffects;

        const effectsSection = data.modifiers?.find?.((section) => section?.isEffects);
        if (effectsSection) {
            effectsSection.statusChoices = statusChoices;
            effectsSection.effects = actorEffects;
        }
    }

    constructor(...args) {
        super(...args);

        this._filters = {
            inventory: new Set(),
            spellbook: new Set(),
            features: new Set(),
            psionic: new Set()
        };

        this._tooltips = null;
        this._tabsV2 = null;

       this._pmEditors = new Map();

        this._pendingTabScroll = null;


    }

    /**
     * AppV2 form submission handler.
     * @this {d100ActorSheet} The handler is called with the application instance as its bound scope.
     */
    static async _onFormSubmit(_event, _form, formData) {
        // DocumentSheetV2 normally does this automatically, but we provide an explicit handler
        // to ensure our custom sheet wiring always results in a document update.
        return this.document.update(formData.object);
    }

    /**
     * Legacy compatibility: some handlers call `_onSubmit(event)`.
     * In AppV2, prefer the built-in form handler. This triggers a real form submit.
     */
    async _onSubmit(event) {
        event?.preventDefault?.();
        if (!this.isEditable) return;

        const form = (this.element instanceof HTMLFormElement) ? this.element : this.element?.querySelector?.("form");
        if (form?.requestSubmit) {
            form.requestSubmit();
            return;
        }

        if (!form) return;
        const formData = new FormDataExtended(form);
        return this.document.update(formData.object);
    }

    static get DEFAULT_OPTIONS() {
        // IMPORTANT (AppV2): merge with the parent defaults.
        // Replacing DEFAULT_OPTIONS wholesale can drop Foundry's built-in form handling,
        // causing sheet edits to stop updating the Actor document.
        return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
            tag: "form",
            form: {
                handler: d100ActorSheet._onFormSubmit,
                submitOnChange: true,
                closeOnSubmit: false
            },
            position: {
                width: 700,
                height: 600
            },
            window: {
                contentClasses: ["Alternityd100", "sheet", "actor"],
                resizable: true
            },
            scrollable: [
                ".tab.attributes",
                ".tab.description",
                ".tab.inventory",
                ".inventory .inventory-list",
                ".features .inventory-list",
                ".spellbook .inventory-list",
                ".modifiers .inventory-list",
                ".psionics .inventory-list",
                ".tab.status",
                ".tab.features",
                ".tab.skills",
                ".tab.details"
            ]
            // Note: Tabs are managed differently in AppV2. If needed,
            // migrate to TabsV2 in a follow-up to replicate old tab behavior.
        }, { inplace: false, overwrite: true });
    }

    // Use subclass-provided templates; no base PARTS to avoid invalid path.

    // Maintain v1-style property access used throughout this class
    get actor() { return this.document; }
    get object() { return this.document; }

    /** @inheritdoc */

    /** @inheritdoc */
    /* getData() {
       const context = super.getData();
       
   console.log(context.status)
       return context;
   }
   */


    /**
      * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
      */
    async _prepareContext(options) {
        //console.log(this)
        const context = await super._prepareContext?.(options) ?? {};
        const isOwner = this.object.isOwner;

        // Wrap CONFIG maps so missing properties never crash `selectOptions`.
        const makeSafeConfig = (source) => {
            const base = foundry.utils.duplicate(source ?? {});
            return new Proxy(base, {
                get(target, prop, receiver) {
                    const value = Reflect.get(target, prop, receiver);
                    return (value === undefined || value === null) ? {} : value;
                }
            });
        };

        const data = {
            document: this.document,
            actor: this.object,
            system: foundry.utils.duplicate(this.object.system),
            // Legacy alias used by many templates
            systemData: foundry.utils.duplicate(this.object.system),
            isOwner: isOwner,
            isGM: game.user.isGM,
            limited: this.object.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: isOwner ? "editable" : "locked",
            isCharacter: this.object.type === "character",
            isOrdnance: this.object.type === "ordnance",
            isShip: this.object.type === 'starship',
            isVehicle: this.object.type === 'vehicle',
            isDrone: this.object.type === 'drone',
            isNPC: this.object.type === 'npc',
            isHazard: this.object.type === 'hazard',
            config: makeSafeConfig(CONFIG.d100A),
            d100Aconfig: makeSafeConfig(CONFIG.d100A),
        };

        // Option maps for templates
        data.genderOptions = {};
        const genders = data.systemData?.charoptions?.gender;
        if (genders && typeof genders === "object") {
            for (const [key, gender] of Object.entries(genders)) {
                data.genderOptions[key] = gender?.label ?? String(key);
            }
        }

        // Vehicle sheets (legacy templates) expect this option map.
        const skillLabels = data.config?.skills ?? {};
        data.vehicleControlSkillOptions = {
            pil: skillLabels.pil ?? "Piloting",
            ath: skillLabels.ath ?? "Athletics",
            sur: skillLabels.sur ?? "Survival",
            none: "None",
        };

        data.items = this.object.items.map(i => {
            i.labels = i.labels;
            return i;
        });
        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        data.labels = this.actor.labels || {};
        data.filters = this._filters;

        if (!data.system?.details?.biography?.fullBodyImage) {
            const fallback = "systems/Alternityd100/images/mystery-body.png";
            foundry.utils.setProperty(data.system, "details.biography.fullBodyImage", fallback);
            foundry.utils.setProperty(data.systemData, "details.biography.fullBodyImage", fallback);
        }

        if (data.system.abilities) {
            // Ability Scores
            for (let [a, abl] of Object.entries(data.system.abilities)) {
                abl.label = CONFIG.d100A.abilities[a];
            }
        }

        //********************************************************
        //
        //              Maybe use this for filteres skill list for Char Sheet
        ///
        ///
        //********************************************************************* */

        /*


        if (data.data.skills) {
            console.log("Needs Skills?\n", data.data.skills)
            // Update skill labels
            for (let [s, skl] of Object.entries(data.data.skills)) {                
                skl.ability = data.data.abilities[skl.ability].label.substring(0, 3);
                skl.icon = this._getClassSkillIcon(skl.value);

                let skillLabel = CONFIG.d100A.skills[s.substring(0, 3)];
                if (skl.subname) {
                    skillLabel += ` (${skl.subname})`;
                }

                skl.label = skillLabel;
                skl.hover = CONFIG.d100A.skillProficiencyLevels[skl.value];
            }

            data.data.skills = Object.keys(data.data.skills).sort().reduce((skills, key) => {
                skills[key] = data.data.skills[key];

                return skills;
            }, {});

            data.data.hasSkills = Object.values(data.data.skills).filter(x => x.enabled).length > 0;
        }

        if (data.data.traits) {
            this._prepareTraits(data.data.traits);
        }
*/
        this._prepareItems(data);
        this._prepareEffectsSection(data);


        data.status = {}
        data.status = { "durability": { "stu": { "good": [], "pend": [], "bad": [] }, "wou": { "good": [], "pend": [], "bad": [] }, "mor": { "good": [], "pend": [], "bad": [] }/*, "cri": { "good": [], "pend": [], "bad": [] }*/ } }
        data.statusd = "fdgsdfg"
        data.status.image = { "bad": "systems/Alternityd100/icons/conditions/alt_bad1.png", "good": "systems/Alternityd100/icons/conditions/alt_good1.png", "pend": "systems/Alternityd100/icons/conditions/alt_yell.png" }

        // load the main 
        for (let [k, v] of Object.entries(data.status.durability)) {
            // for (const [v,k] of data.status.durability) {
            for (let i = 0; i < this.actor.system?.attributes[k]?.max; i++) {
                //console.log(this.actor.system?.attributes[k].value,k,v,i)
                let good = Math.min(this.actor.system?.attributes[k].value + this.actor.system?.attributes[k].pending, this.actor.system?.attributes[k].value)
                let pending = Math.max(this.actor.system?.attributes[k].value + this.actor.system?.attributes[k].pending, this.actor.system?.attributes[k].value)


                if (good > i) v.good.push({ "value": i, "title": i - this.actor.system?.attributes[k].value });
                else if (pending > i) v.pend.push({ "value": i, "title": i - this.actor.system?.attributes[k].value });


                else v.bad.push({ "value": i, "title": i - this.actor.system?.attributes[k].value + 1 });

            }
        }





        //console.log("\n",data.status,"\n",this.actor.system?.attributes.stu.value,this.actor.system?.attributes.stu.pending,this.actor.system?.attributes.stu.max)

        return data;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onRender(context, options) {
        super._onRender?.(context, options);

        // Restore tab scroll positions across re-renders.
        // Capture the map to avoid race conditions if another render happens before rAF runs.
        const pendingTabScroll = this._pendingTabScroll;
        if (pendingTabScroll instanceof Map) {
            const restoreTabs = () => {
                const tabs = Array.from(this.element?.querySelectorAll?.('.tab') ?? []);
                tabs.forEach((tab, index) => {
                    const key = tab?.dataset?.tab ?? `index:${index}`;
                    const scrollTop = pendingTabScroll.get(key);
                    if (typeof scrollTop === "number") tab.scrollTop = scrollTop;
                });
            };

            restoreTabs();
            requestAnimationFrame(() => {
                restoreTabs();
                if (this._pendingTabScroll === pendingTabScroll) this._pendingTabScroll = null;
            });
        }

        this.element.querySelector(".modifier-create")?.addEventListener("click", this._onModifierCreate.bind(this));
       this.element.querySelector(".modifier-edit")?.addEventListener("click", this._onModifierEdit.bind(this));
       this.element.querySelector(".modifier-delete")?.addEventListener("click", this._onModifierDelete.bind(this));
       this.element.querySelector(".modifier-toggle")?.addEventListener("click", this._onToggleModifierEnabled.bind(this));
       
       
        const html = $(this.element);

 // html.find('.modifier-create').on('click', this._onModifierCreate.bind(this));
   //      html.find('.modifier-edit').on('click', this._onModifierEdit.bind(this));
   //     html.find('.modifier-delete').on('click', this._onModifierDelete.bind(this));
   //     html.find('.modifier-toggle').on('click', this._onToggleModifierEnabled.bind(this));

        // Bind critical sheet actions even when the application decides this sheet is not editable.
        // (In AppV2, relying solely on `this.isEditable` / `this.options.editable` can prevent listeners.)
        html.off("click.d100A");
        html.off("contextmenu.d100A");
        html.off("change.d100A");
          // Bind editor toggle via delegated handler so multiple editors per sheet work.
          html.on("click.d100A", ".editor-edit", (event) => this._onClickeditorEdit(event));
        html.on("click.d100A", ".clickapplydamge", (event) => this._onApplyPendingDamage(event));
        html.on("click.d100A", ".rollphysire", (event) => this._onRollPhysire(event));
        html.on("click.d100A", ".clickpingtoken", (event) => this._onPingToken(event));
        html.on("click.d100A", ".attribute-button", (event) => this._onRollAtt(event));
     //   html.on("click.d100A", "img[data-edit]", (event) => this._onEditImage(event));
        html.on("contextmenu.d100A", "img[data-edit]", (event) => this._onImgContext(event));
        html.on("click.d100A", ".clickgood", (event) => this._onDurabilityChange(event));
        html.on("contextmenu.d100A", ".clickgood", (event) => this._onDurabilityChange(event));

        // Item rolls should work even when the sheet is not editable (e.g. non-owner view).
        html.on("click.d100A", ".item .item-image", (event) => this._onItemRoll(event));
        html.on("click.d100A", ".item .scan-image", (event) => this._onItemRoll(event));

        // Item action buttons should work even when the sheet is not editable.
        html.on("click.d100A", ".item-action .attack", (event) => this._onItemRollAttack(event));
        html.on("click.d100A", ".item-action .fire", (event) => this._onItemRollAttack(event, "fire"));
        html.on("click.d100A", ".item-action .burstfire", (event) => this._onItemRollAttack(event, "burstfire"));
        html.on("click.d100A", ".item-action .autofire", (event) => this._onItemRollAttack(event, "autofire"));
        html.on("click.d100A", ".item-action .scan", (event) => this._onItemRollScan(event));
        html.on("click.d100A", ".item-action .use", (event) => this._onItemRoll(event));
        html.on("click.d100A", ".item-action .damage", (event) => this._onItemRollDamage(event));
        html.on("click.d100A", ".item-action .healing", (event) => this._onItemRollDamage(event));
        html.on("click.d100A", ".item-action .defence", (event) => this._onItemRollDefence(event));
        html.on("click.d100A", ".item-control.reload", this._onReloadWeapon.bind(this));
        html.on("click.d100A", ".item-control.toggle-mode", this._onToggleModeChange.bind(this));
        html.on("change.d100A", ".status-effect-toggle", (event) => this._onToggleStatusEffect(event));
        html.on("click.d100A", ".effect-toggle", (event) => this._onToggleEffectDisabled(event));
        // Item creation should work anywhere the button appears (Inventory, Features, etc).
        // Bind via delegated handler so it remains functional across AppV2 rerenders/tabs.
        html.on("click.d100A", ".item-create", (event) => {
            if (!this.actor?.isOwner) return;
            return this._onItemCreate(event);
        });

        // Inventory edit/delete controls should also work reliably in AppV2.
        // Do not rely on `this.isEditable` for ownership-gated controls; some sheets render
        // controls using `isOwner` but may not be considered "editable" by the Application.
        html.on("click.d100A", ".item-control.item-edit", (event) => {
            if (!this.actor?.isOwner) return;
            event.preventDefault();
            const itemId = event.currentTarget?.closest?.('.item')?.dataset?.itemId;
            if (!itemId) return;
            const item = this.actor.items.get(itemId);
            return item?.sheet?.render?.(true);
        });

        html.on("click.d100A", ".item-control.item-delete", (event) => {
            if (!this.actor?.isOwner) return;
            return this._onItemDelete(event);
        });
        

        // Initialize Tabs (AppV2) and bind to current element
        if (!this._tabsV2) {
            this._tabsV2 = {};
            // Main (primary) tabs. Scope to data-group="primary" to avoid binding subtabs/biotabs.
            this._tabsV2.main = new foundry.applications.ux.Tabs({
                navSelector: '.tabs[data-group="primary"]',
                contentSelector: ".sheet-body",
                callback: (_event, _tabs, active) => {
                    if (active === "modifiers") this._tabsV2?.modifiers?.activate("effects");
                }
            });
            this._tabsV2.modifiers = new foundry.applications.ux.Tabs({
                navSelector: ".subtabs",
                contentSelector: ".modifiers-body",
                initial: "permanent"
            });
            this._tabsV2.bio = new foundry.applications.ux.Tabs({
                navSelector: ".biotabs",
                contentSelector: ".bio-body",
                initial: "biography"
            });
        }
        // Re-bind tabs to the newly rendered element each render (only if present on this sheet)
        if (html.find('.tabs[data-group="primary"]').length) this._tabsV2.main.bind(this.element);
        if (html.find('.subtabs').length) this._tabsV2.modifiers.bind(this.element);
        if (html.find('.biotabs').length) this._tabsV2.bio.bind(this.element);
        // Ensure a valid initial active tab for main nav when templates don't mark one
        const $nav = html.find('.tabs[data-group="primary"]');
        if ($nav.length) {
            const $active = $nav.find('a.item.active');
            let initialTab = $active.data('tab');
            if (!initialTab) {
                const $first = $nav.find('a.item').first();
                initialTab = $first.data('tab');
            }
            if (initialTab) this._tabsV2.main.activate(initialTab);
        }
        //console.log("HERE--",html)
        //   console.log(html)
        // super.activateListeners(html); // AppV2 no longer uses this; listeners are attached below

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Attribute Management
        html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
        html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
        html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this));

        // Roll Skill Checks
        html.find('.rollable-skill').click(this._onRollSkillCheck.bind(this));
        //html.find(".skill > .skill-name > .rollable-skill").click(this._onRollSubSkillCheck.bind(this));
        html.find('.skilldrag').each((i, a) => {
            a.setAttribute("draggable", true);
            a.addEventListener("dragstart", ev => {
                let dragData = ev.currentTarget.dataset;
                ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                //  console.log(ev,i,a)
            }, false);
            //  console.log(i,a)
        })



        // Item Controls
        html.find(".item-control").click(this._onItemControl.bind(this));

        html.find(".items .rollable2").on("click", this._onItemRoll.bind(this));

        // Add draggable for Macro creation
        html.find(".attributes a.attribute-roll ").each((i, a) => {
            a.setAttribute("draggable", true);

            a.addEventListener("dragstart", ev => {
                console.log(ev)
                let dragData = ev.currentTarget.dataset;
                ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            }, false);
        });

        /* -------------------------------------------- */
        /*  Inventory
        /* -------------------------------------------- */

        // Inventory create/edit/delete are bound above using delegated AppV2-safe handlers.



        // Item Rolling
        // html.find('.item .item-image').click(event => this._onItemRoll(event));





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

        html.find('[data-wpad]').each((i, e) => {
            let text = e.tagName === "INPUT" ? e.value : e.innerText,
                w = text.length * parseInt(e.getAttribute("data-wpad")) / 2;
            e.setAttribute("style", "flex: 0 0 " + w + "px;");
        });

        const filterLists = html.find(".filter-list");
        filterLists.each(this._initializeFilterItemList.bind(this));
        filterLists.on("click", ".filter-item", this._onToggleFilter.bind(this));

        html.find('.item .item-name h4').click(event => this._onItemSummary(event));
        //html.find('.action .action-name h4').click(event => this._onItemSummary(event,true));
        html.find('.item .item-name h4').contextmenu(event => this._onItemSplit(event));

        if (!this.options.editable) return;

        html.find('.config-button').click(this._onConfigMenu.bind(this));

        html.find('.toggle-container').click(this._onToggleContainer.bind(this));

        html.find('.skill-proficiency').on("click contextmenu", this._onCycleClassSkill.bind(this));
        html.find('.trait-selector').click(this._onTraitSelector.bind(this));

        // Ability Checks
        html.find('.ability-name').click(this._onRollAbilityCheck.bind(this));

        // Roll Skill Checks
        html.find('.skill-name').click(this._onRollSkillCheck.bind(this));

        // Edit Skill
        html.find('h4.skill-name').contextmenu(this._onEditSkill.bind(this));

        // Add skill
        html.find('#add-profession').click(this._onAddSkill.bind(this));

        // Configure Special Flags
        html.find('.configure-flags').click(this._onConfigureFlags.bind(this));

        // Saves
        html.find('.save-name').click(this._onRollSave.bind(this));

        // Weapon Mode Toggle
        html.find('.item .toggle-mode').click(event => this._onToggleModeChange(event));



        /* -------------------------------------------- */
        /*  Spellbook
        /* -------------------------------------------- */
        // html.find('.spell-browse').click(ev => getSpellBrowser().render(true)); // Inventory Browser

        /* -------------------------------------------- */
        /*  Inventory
        /* -------------------------------------------- */

        // Inventory create/edit/delete are bound above using delegated AppV2-safe handlers.

        // Item Dragging
        let handler = ev => this._onDragStart(ev);

        html.find('li.item').each((i, li) => {
            //console.log("Here");
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        // Item Rolling (handled above via delegated events)

        //html.find('.clickgood').mousedown(event => this._onDurabilityChange(event));


        // Roll attack/damage from item (handled above via delegated events)
        // (De-)activate an item


        // Item Recharging
        html.find('.item .item-recharge').click(event => this._onItemRecharge(event));

        // Item Equipping
        html.find('.item .item-equip').click(event => this._onItemEquippedChange(event));

        // Condition toggling
        html.find('.conditions input[type="checkbox"]').change(this._onToggleConditions.bind(this));

        html.find('.spellRank').change(this._onspellRankChanged.bind(this));

        // Apply Temp Damage (bound above using delegated events)

        // Invoke legacy subclass activateListeners, if provided
        try {
            if (typeof this.activateListeners === "function") {
                this.activateListeners($(this.element));
            }
        } catch (e) {
            // no-op
        }
    }

    /**
     * Add a modifer to this actor.
     * 
     * @param {Event} event The originating click event
     */
    _onModifierCreate(event) {
        event.preventDefault();
        const target = $(event.currentTarget);

        this.actor.addModifier({
            name: "New Modifier",
            subtab: target.data('subtab')
        });
    }

    
    /**
     * Delete a modifier from the actor.
     * 
     * @param {Event} event The originating click event
     */
    async _onModifierDelete(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        await this.actor.deleteModifier(modifierId);
    }

    /**
     * Edit a modifier for an actor.
     * 
     * @param {Event} event The orginating click event
     */
    _onModifierEdit(event) {
        event.preventDefault();

        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        this.actor.editModifier(modifierId);
    }

    /**
     * Toggle a modifier to be enabled or disabled.
     * 
     * @param {Event} event The originating click event
     */
    async _onToggleModifierEnabled(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const modifierId = target.closest('.item.modifier').data('modifierId');

        const modifiers = foundry.utils.duplicate(this.actor.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === modifierId);
        modifier.enabled = !modifier.enabled;

        await this.actor.update({ 'system.modifiers': modifiers });
    }


async _onClickeditorEdit(event) {
        event.preventDefault();
        const a = event.currentTarget;
        console.log("Click edit", a);

event.preventDefault();

            const editButton = event.currentTarget;
            const editIcon = editButton?.querySelector?.("i");

            const editor = event.currentTarget?.closest?.(".editor");
            const editorContent = editor?.querySelector?.(".editor-content");
            const fieldName = editorContent?.dataset?.edit;
            if (!editorContent || !fieldName) return;

            // Toggle: if already open, autosave (if dirty) and destroy.
            const existing = this._pmEditors.get(fieldName);
            if (existing) {
                try {
                    if (existing.isDirty?.()) {
                        const updated = this._extractProseMirrorHTML(existing);
                        await this.document.update({ [fieldName]: updated });
                    }
                } finally {
                    existing.destroy?.();
                    this._pmEditors.delete(fieldName);
                    delete editorContent.dataset.pmActive;

                    // Restore the button icon back to "edit".
                    if (editIcon) {
                        editIcon.classList.remove("fa-save");
                        // Foundry typically uses fa-pen-to-square for the editor toggle.
                        if (editIcon.classList.contains("fa-pen-to-square") || editIcon.classList.contains("fa-regular") || editIcon.classList.contains("fa-solid")) {
                            editIcon.classList.add("fa-pen-to-square");
                        } else {
                            editIcon.classList.add("fa-edit");
                        }
                    }
                    editButton?.classList?.remove?.("pm-saving");
                    editButton?.setAttribute?.("data-tooltip", game.i18n.localize("EDITOR.Edit") ?? "Edit");

                    // Refresh to show enriched (non-editing) display.
                    this.render(false, { editable: this.options.editable });
                }
                return;
            }

            // Avoid creating multiple editor views on repeated clicks.
            if (editorContent.dataset?.pmActive === "1") return;
            editorContent.dataset.pmActive = "1";

            // Mount the editor into the content element.
            editorContent.innerHTML = "";
            const content = foundry.utils.getProperty(this.document, fieldName) ?? "";

            try {
                // Switch the button icon to "save" while the inline editor is open.
                if (editIcon) {
                    editIcon.classList.remove("fa-edit");
                    editIcon.classList.remove("fa-pen-to-square");
                    editIcon.classList.add("fa-save");
                }
                editButton?.classList?.add?.("pm-saving");
                editButton?.setAttribute?.("data-tooltip", game.i18n.localize("Save") ?? "Save");

                const pm = await foundry.applications?.ux?.ProseMirrorEditor?.create(
                    editorContent,
                    content,
                    {
                        document: this.document,
                        uuid: `${this.document.uuid}#${fieldName}`,
                        // We handle saving on toggle-close; collaborative mode is not needed here.
                        collaborate: false
                    }
                );
                if (pm) this._pmEditors.set(fieldName, pm);
            } catch (err) {
                // Reset flag so the user can retry.
                delete editorContent.dataset.pmActive;

                // Also restore the icon.
                if (editIcon) {
                    editIcon.classList.remove("fa-save");
                    // Prefer Foundry's default icon if present.
                    editIcon.classList.add("fa-pen-to-square");
                }
                editButton?.classList?.remove?.("pm-saving");

                console.error(err);
            }



}
 _extractProseMirrorHTML(editor) {
        const root = editor?.view?.dom;
        if (!root) return "";

        // ProseMirror usually renders an inner .ProseMirror element containing the document.
        const prose = root.matches?.(".ProseMirror") ? root : root.querySelector?.(".ProseMirror") ?? root;
        return prose.innerHTML ?? "";
    }

    async xx_onEditImage(event) {
        event.preventDefault();
        if (!this.isEditable) return;

        const img = event.currentTarget;
        const field = img?.dataset?.edit ?? img?.getAttribute?.("data-edit");
        if (!field) return;

        const current = foundry.utils.getProperty(this.document, field) ?? this.document[field];
        const picker = new FilePicker({
            type: "image",
            current,
            callback: async (path) => {
                const update = {};
                if (field.includes(".")) foundry.utils.setProperty(update, field, path);
                else update[field] = path;
                await this.document.update(update);
            }
        });

        return picker.browse(current);
    }

    // Legacy no-op to support subclasses still calling super.activateListeners(html)
    activateListeners(_html) { /* intentionally empty - use _onRender in App V2 */

        ui.notifications.warn("d100ActorSheet.activateListeners called - this is a no-op in AppV2. Please migrate to _onRender(context, options) and bind listeners there.");
     }
    //was in base.js

    async _onRollPhysire(event) {

        const diceresults = await this.actor.rollSkill("physire")
        console.log(diceresults.roll)
        const rollData = diceresults.roll
        let basedamage = -2
        if (rollData.degree == "Good") basedamage -= 2
        if (rollData.degree == "Amazing!") basedamage -= 4
        rollData.defence = [{ armor: { img: "systems/Alternityd100/icons/conditions/physical_resolve.webp" }, damage: { stu: {value : basedamage, base : 0} , wou:  {value : 0, base : 0}, mor: {value : 0, base : 0} } }]
        const templateData = {
            actor: this.actor,
            item: this,
            tokenId: this.actor.token?.id,
            action: "Heals",
            rollData: rollData,
            toughnessMap: CONFIG.d100A?.toughness

        };
        //console.log(rollData)
        const template = `systems/Alternityd100/templates/chat/item-defend-card.html`;
        const renderPromise = foundry.applications.handlebars.renderTemplate(template, templateData);
        renderPromise.then((html) => {
            // Create the chat message
            const chatData = {
                style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: html,
                sound: true ? CONFIG.sounds.dice : null,
            };

            ChatMessage.create(chatData, { displaySheet: false });
        });




    }


    async _onRollAtt(event) {
        const stat = game.i18n.localize("d100A.attributes." + event.currentTarget.dataset.attr)
        const totalbonus = 1;
        const dice = "1d20";
        const roll = await Roll.create(dice.concat(d100stepdie(totalbonus))).evaluate();
        const a = 0
        const fumble = this.actor.system.attributes.luck
        const roll1 = roll.terms[0].results[0].result == 1
        const ordinary = this.actor.system.abilities[event.currentTarget.dataset.attr].value
        const good = Math.floor(ordinary / 2)
        const amazing = Math.floor(good / 2)
        let degree = ""
        console.log(roll)
        if (roll.total > ordinary && !roll1) { degree = "Failure" };
        if (roll.total > ordinary && roll1) { degree = "Ordinary" };
        if (roll.total <= ordinary) { degree = "Ordinary" };
        if (roll.total <= good) { degree = "Good" };
        if (roll.total <= amazing) { degree = "Amazing!" };
        if (roll.terms[0].results[0].result > fumble) { degree = "Critical Failure" };


        const templateData = {
            actor: this.actor,
            formula: roll.formula,
            total: roll.total,
            roll: roll.toJSON(),
            tooltip: await roll.getTooltip(),
            degree: degree,
            flavor: stat + " Feat Check"
        }
        const template = `systems/Alternityd100/templates/chat/roll-ext.hbs`;// `systems/Alternityd100/templates/chat/roll-ext.hbs`;    
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
        const chatData = {
            roll: roll.toJSON(),

            author: game.user.id,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            content: html,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            sound: a === 0 ? CONFIG.sounds.dice : null,
            roll: roll.toJSON(),
            formula: roll.formula
        }
        await roll.toMessage(chatData);


        // canvas.ping(this.token.object.center)


    }

    async _onImgContext(event) {
        console.log("Context Menu");
        event.preventDefault();
        if (!this.isEditable) return;
        // If actor.isToken copy the character image to the token
        // If !actor.isToken copy the token image to the prototype token

    }
    async _onPingToken(event) {

        canvas.ping(this.token.object.center)
    }


    async _onApplyPendingDamage(event) {

        event?.preventDefault?.();
        event?.stopPropagation?.();

        console.log(this.actor)

        const actor = this.actor
        const systemData = actor.system
        const oldstun = systemData.attributes.stu.value

        let leftover = 0

        const attributes = { stu: foundry.utils.duplicate(systemData.attributes.stu), wou: foundry.utils.duplicate(systemData.attributes.wou), mor: foundry.utils.duplicate(systemData.attributes.mor) }
        if (actor.isSpaceActor) attributes.cri = foundry.utils.duplicate(systemData.attributes.cri)
        for (const [k, o] of Object.entries(attributes)) {
            o.value += o.pending + leftover
            o.value = Math.min(o.value, o.max)
            leftover = Math.trunc(Math.min(o.value, 0) / 2)
            o.value = Math.max(o.value, 0)
            o.pending = 0
        }
        // let isKO = actor.system.conditions.knockedout
        // let isDead = actor.system.conditions.dead

        if (!actor.isSpaceActor) {
            let isKO = ((attributes.stu.value < 1) || (attributes.wou.value < 1))
            let isDead = (attributes.mor.value < 1)
            // await actor.setCondition("knockedout", isKO)
            actor.toggleStatusEffect("knockedout", { active: isKO, overlay: true })
            actor.toggleStatusEffect("dead", { active: isDead, overlay: true })
            actor.update({ "system.attributes": attributes })
            //actor.update({ "system.attributes": attributes , "system.conditions.knockedout": isKO, "system.conditions.dead": isDead })
            // await actor.setCondition("dead", isDead)
            //  (attributes.mor.value < 1) ? await actor.setCondition("dead", true) : await actor.setCondition("dead", false)


        }

        if (actor.isSpaceActor) {
            //  (attributes.stu.value < 1) ? await actor.setCondition("knockedout", true) : await actor.setCondition("knockedout", false)

            actor.update({ "system.attributes": attributes })
        }

        if ((attributes.stu.value == 0) && (oldstun > 0)) return true;
        return false

    }

    async _onspellRankChanged(event) {

        console.log("Changed", event)

        const newValue = event.currentTarget.valueAsNumber
        const itemId = event.currentTarget.dataset.id
        const item = this.actor.items.get(itemId)

        let a = item.update({ "system.rank": newValue });

        console.log(item, a)
    }

    async _onDurabilityChange(event) {
        let actiontype = event.currentTarget.dataset.type;
        let category = event.currentTarget.dataset.category;
        let position = event.currentTarget.dataset.position;
        let location = event.currentTarget.dataset.location;
        let id = event.currentTarget.dataset.id;
        let dur = event.currentTarget.dataset.dur;
        console.log("Clicked CAT-", category, "\nAction", actiontype, "\nPOS", position, "\nLOC", location, "\nDur", dur, "\nID", id, "\nEvent", event)
        let pending = (!!event.button)
        console.log("\nPending-", pending)
        //This updates the ship durability
        if (category == "total") {
            let curval = this.actor.system.attributes[id].value
            let newval = foundry.utils.duplicate(this.actor.system.attributes[id])

            if (actiontype == "total-inc" && !pending) {
                newval.value = parseInt(position) + 1;
                newval.pending = 0
            }
            if (actiontype == "total-dec" && !pending) {
                newval.value = parseInt(position)
                newval.pending = 0
            }

            if (actiontype == "total-dec" && pending) {
                newval.pending = parseInt(position - newval.value)
            }

            if (actiontype == "total-inc" && pending) {
                newval.pending = parseInt(position - newval.value) + 1;
            }

            //this.actor.system.attributes[category].value = newval;
            let path = "system.attributes." + id
            await this.actor.update({ [path]: newval });
            //console.log("Clicked-",position)
            //console.log("Clicked",this.actor.system.attributes[category],path,newval,this)
        }
        //This updates the compartment durability


        if (category == "compart") {
            const item = this.actor.items.get(this.actor.system.frame.id);
            let temp = foundry.utils.duplicate(item.system.compartment)
            //let path = "system.compartment"
            console.log("Temp", temp, "\n Stu - ", temp.F.durability.stu.value, "\n Wou - ", temp[location].durability[dur].value)
            if (actiontype == "inc") {
                temp[location].durability[dur].value = parseInt(position) + 1;

            }
            else if (actiontype == "dec") {
                temp[location].durability[dur].value = parseInt(position);

            }


            let a = await item.update({ "system.compartment": temp })
        }

    }

    /** @override */
    render(force, options) {
        if (this.stopRendering) {
            return this;
        }
        const tabs = Array.from(this.element?.querySelectorAll?.('.tab') ?? []);
        if (tabs.length) {
            this._pendingTabScroll = new Map();
            tabs.forEach((tab, index) => {
                const key = tab?.dataset?.tab ?? `index:${index}`;
                this._pendingTabScroll.set(key, tab.scrollTop ?? 0);
            });
        } else {
            this._pendingTabScroll = null;
        }

        return super.render(force, options);
    }

    async _render(...args) {
        await super._render(...args);
        /*
                if (this._tooltips === null) {
                    this._tooltips = xippy.delegate(`#${this.id}`, {
                        target: '[data-xippy-content]',
                        allowHTML: true,
                        arrow: false,
                        placement: 'top-start',
                        duration: [500, null],
                        delay: [800, null],
                        maxWidth: 600
                    });
                }
                */
    }

    async close(...args) {
        if (this._tooltips !== null) {
            for (const tooltip of this._tooltips) {
                tooltip.destroy();
            }

            this._tooltips = null;
        }

        return super.close(...args);
    }

    /**
     * Handle tab changes (legacy callers). Use Tabs callback for main navigation.
     */
    _onChangeTab(_event, _tabs, active) {
        if (active === "modifiers") this._tabsV2?.modifiers?.activate("effects");
    }

    _onConfigMenu(event) {
        event.preventDefault();
        const button = event.currentTarget;
        let app;
        switch (button.dataset.action) {
            case "movement":
                app = new ActorMovementConfig(this.object);
                break;
        }
        app?.render(true);
    }

    _prepareTraits(traits) {
        const map = {
            "dr": CONFIG.d100A.energyDamageTypes,
            "di": CONFIG.d100A.damageTypes,
            "dv": CONFIG.d100A.damageTypes,
            "ci": CONFIG.d100A.conditionTypes,
            "languages": CONFIG.d100A.languages,
            "weaponProf": CONFIG.d100A.weaponProficiencies,
            "armorProf": CONFIG.d100A.armorProficiencies
        };

        for (let [t, choices] of Object.entries(map)) {
            const trait = traits[t];
            if (!trait) continue;
            let values = [];
            if (trait.value) {
                values = trait.value instanceof Array ? trait.value : [trait.value];
            }
            trait.selected = values.reduce((obj, t) => {
                if (typeof t !== "object") obj[t] = choices[t];
                else {
                    for (const [key, value] of Object.entries(t))
                        obj[key] = `${choices[key]} ${value}`;
                }

                return obj;
            }, {});

            if (trait.custom) {
                trait.custom.split(';').forEach((c, i) => trait.selected[`custom${i + 1}`] = c.trim());
            }
            trait.cssClass = !isObjectEmpty(trait.selected) ? "" : "inactive";
        }
    }

    /**
     * handle cycling whether a skill is a class skill or not
     * 
     * @param {Event} event A click or contextmenu event which triggered the handler
     * @private
     */
    _onCycleClassSkill(event) {
        event.preventDefault();

        const field = $(event.currentTarget).siblings('input[type="hidden"]');

        const level = parseFloat(field.val());
        const levels = [0, 3];

        let idx = levels.indexOf(level);

        if (event.type === "click") {
            field.val(levels[(idx === levels.length - 1) ? 0 : idx + 1]);
        } else if (event.type === "contextmenu") {
            field.val(levels[(idx === 0) ? levels.length - 1 : idx - 1]);
        }

        this._onSubmit(event);
    }

    /**
     * Handle editing a skill
     * @param {Event} event The originating contextmenu event
     */
    _onEditSkill(event) {
        event.preventDefault();
        let skillId = event.currentTarget.parentElement.dataset.skill;

        return this.actor.editSkill(skillId, { event: event });
    }

    /**
     * Handle adding a skill
     * @param {Event} event The originating contextmenu event
     */
    _onAddSkill(event) {
        event.preventDefault();

        return this.actor.addSkill({ event: event });
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event The originating click event
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        let type = header.dataset.type;
        if (!type || type.includes(",")) {
            let types = foundry.utils.duplicate(SFRPG.itemTypes);
            if (type) {
                let supportedTypes = type.split(',');
                console.log("supportedTypes", type, supportedTypes)

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

            let templateData = { upper: "Item", lower: "item", types: types },
                dlg = await foundry.applications.handlebars.renderTemplate(`systems/Alternityd100/templates/apps/localized-entity-create.html`, templateData);

            new Dialog({
                title: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Title" + "jhgf"),
                content: dlg,
                buttons: {
                    create: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Button"),
                        callback: html => {
                            const form = html[0].querySelector("form");
                            let formDataExtended = new FormDataExtended(form);
                            foundry.utils.mergeObject(createData, formDataExtended.toObject());
                            if (!createData.name) {
                                createData.name = game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Name");
                            }

                            this.onBeforeCreateNewItem(createData);

                            this.actor.createEmbeddedDocuments("Item", [createData]);
                        }
                    }
                },
                default: "create"
            }, { classes: ["Alternityd100"] }).render(true);
            return null;
        }

        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type,
            data: foundry.utils.duplicate(header.dataset)
        };
        delete itemData.data['type'];

        this.onBeforeCreateNewItem(itemData);

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }


    _onItemRollAttackx(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        ghjkghjkghk
        return item.rollAttack({ event: event });
    }

    _onItemRollScan(event) {

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.rollScan({ event: event });
    }


    /**
     * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
     * @param {Event} event The triggering event
     */
    _onItemRoll(event) {
        event?.preventDefault?.();
        const currentTarget = event?.currentTarget ?? event?.target;
        const itemElem = currentTarget?.closest?.('.item');
        if (!itemElem) return;

        const itemId = itemElem.dataset?.itemId ?? itemElem.getAttribute?.('data-item-id');
        const type = itemElem.dataset?.type;
        if (!itemId) return;

        if (type == "token") {
            let Atoken = findTokenById(itemId)
            Atoken.setTarget()
            return Atoken;
        }

        const item = this.actor.items.get(itemId);
        console.log(itemId, "\n", item)
        if (!item) return;
        if (item.system.type === "psionic") {
            return this.actor.rollSkillObject(item, { event: event, skipDialog: !event.shiftKey });
        }
        if (item.isSkilled) {
            return this.actor.rollSkillObject(item, { event: event, skipDialog: !event.shiftKey });
        }
        if (item.isChatRole) {
            return this.actor.rollSkillObject(item, { event: event, skipDialog: !event.shiftKey });
        }

        else return item.roll();
    }


    /* -------------------------------------------- */


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
     * Backwards-compatible alias for legacy callers.
     *
     * @param {Event} event The triggering event.
     */
    _onToggleConditions(event) {
        return this._onToggleStatusEffect(event);
    }


    /**
     * Handle rolling an Ability check
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollAbilityCheck(event) {
        event.preventDefault();
        let ability = event.currentTarget.parentElement.dataset.ability;
        this.actor.rollAbility(ability, { event: event });
    }


    /**
     * Handle rolling of an item form the Actor sheet, obtaining the item instance an dispatching to it's roll method.
     * 
     * @param {Event} event The html event
     */
    async _onItemSummary(event, action = false) {

        event?.preventDefault?.();

        const currentTarget = event?.currentTarget ?? event?.target;
        if (!currentTarget) return;

        let li, item, chatData;
        const type = action ? "action" : "item";

        if (!action) {
            li = $(currentTarget).closest('.item');
            const itemId = li.data('item-id') ?? li.attr('data-item-id');
            item = this.actor.items.get(itemId);
            if (!item) return;
            chatData = await item.getChatData({ secrets: this.actor.isOwner, rollData: this.actor.system });
        } else {
            li = $(currentTarget).closest('.action');
            const actionId = li.data('action-id') ?? li.data('actionId') ?? li.attr('data-action-id');
            if (!actionId) return;

            const configuredPack = game.settings.get("Alternityd100", "starshipActionsSource") || "Alternityd100.starship-actions";
            const compendium = game.packs.get(configuredPack) ?? game.packs.get("Alternityd100.starship-actions");
            const itemb = await compendium?.getDocument?.(actionId);
            if (!itemb) return;
            item = itemb;
            chatData = await itemb.getChatData({ secrets: this.actor.isOwner, rollData: this.actor.system });
        }

        let div, props;
        if (li.hasClass('expanded')) {
            let summary = li.children('.' + type + '-summary');
            summary.slideUp(200, () => summary.remove());
        } else {
            //console.log(chatData)
            const desiredDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(chatData.description.short || chatData.description.value, {});
            action ? div = $(`<div class="action-summary">${desiredDescription}</div>`) : div = $(`<div class="item-summary">${desiredDescription}</div>`);

            action ? props = $(`<div class="action-properties"></div>`) : props = $(`<div class="item-properties"></div>`);
            chatData.properties.forEach(p => props.append(`<span class="tag" ${p.tooltip ? ("data-tooltip='" + p.tooltip + "'") : ""}>${p.name}</span>`));

            div.append(props);
            li.append(div.hide());

            div.slideDown(200, function () { /* noop */ });
        }
        li.toggleClass('expanded');

    }



    /**
     * Creates an TraitSelectorSFRPG dialog
     * 
     * @param {Event} event HTML Event
     * @private
     */
    _onTraitSelector(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const label = a.parentElement.querySelector('label');
        const options = {
            name: label.getAttribute("for"),
            title: label.innerText,
            choices: CONFIG.d100A[a.dataset.options]
        };

        new TraitSelectorSFRPG(this.actor, options).render(true);
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


    async xxxxprocessDroppedDataSFRPG(event, parsedDragData) {
        const targetActor = new ActorItemHelper(this.actor.id, this.token?.id, this.token?.parent?.id);





        if (!ActorItemHelper.IsValidHelper(targetActor)) {
            ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragToExternalTokenError"));
            return;
        }


        let itemData = null;
        if (parsedDragData.type !== 'ItemCollection') {
            itemData = await Item.fromDropData(parsedDragData);
        } else {
            itemData = parsedDragData.items[0];
        }

        if (itemData.type === "class") {
            const existingClass = targetActor.findItem(x => x.type === "class" && x.name === itemData.name);
            if (existingClass) {
                const levelUpdate = {};
                levelUpdate["system.levels"] = existingClass.system.levels + 1;
                existingClass.update(levelUpdate)
                return existingClass;
            }
        }
        console.log("Data", this, itemData)
        // if (!this.acceptedItemTypes.includes(itemData.type)) {
        // Reject item
        //   ui.notifications.error(game.i18n.format("SFRPG.InvalidItem", { name: SFRPG.itemTypes[itemData.type], target: SFRPG.actorTypes[this.actor.type] }));
        //    return;
        // }

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
        } else if (parsedDragData.uuid.includes("Compendium")) {
            const createResult = await targetActor.createItem(itemData._source);
            const addedItem = targetActor.getItem(createResult[0].id);

            if (game.settings.get('sfrpg', 'scalingCantrips') && addedItem.type === "spell") {
                _onScalingCantripDrop(addedItem, targetActor);
            }

            if (!(addedItem.type in SFRPG.containableTypes)) {
                targetContainer = null;
            }

            const itemInTargetActor = await moveItemBetweenActorsAsync(targetActor, addedItem, targetActor, targetContainer);
            if (itemInTargetActor === addedItem) {
                await this._onSortItem(event, itemInTargetActor);
                return itemInTargetActor;
            }

            return itemInTargetActor;
        } else if (parsedDragData.uuid.includes("Actor")) {
            const splitUUID = parsedDragData.uuid.split(".");
            let actorID = "";
            if (splitUUID[0] === "Actor") {
                actorID = splitUUID[1];
            }

            const sourceActor = new ActorItemHelper(actorID || parsedDragData.actorId, parsedDragData.tokenId, parsedDragData.sceneId);
            if (!ActorItemHelper.IsValidHelper(sourceActor)) {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
                return;
            }

            const itemToMove = await sourceActor.getItem(itemData.id);

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
                        this._onSortItem(event, itemInTargetActor);
                    }
                });
            } else {
                const itemInTargetActor = await moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer);
                if (itemInTargetActor === itemToMove) {
                    return await this._onSortItem(event, itemInTargetActor);
                }
            }
        } else {
            const sidebarItem = itemData;

            const addedItemResult = await targetActor.createItem(foundry.utils.duplicate(sidebarItem));
            if (addedItemResult.length > 0) {
                const addedItem = targetActor.getItem(addedItemResult[0].id);

                if (game.settings.get('sfrpg', 'scalingCantrips') && sidebarItem.type === "spell") {
                    _onScalingCantripDrop(addedItem, targetActor);
                }

                if (targetContainer) {
                    let newContents = [];
                    if (targetContainer.system.container?.contents) {
                        newContents = foundry.utils.duplicate(targetContainer.system.container?.contents || []);
                    }

                    const preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, addedItem) || 0;
                    newContents.push({ id: addedItem.id, index: preferredStorageIndex });

                    const update = { id: targetContainer.id, "system.container.contents": newContents };
                    await targetActor.updateItem(targetContainer.id, update);
                }

                return addedItem;
            }
            return null;
        }

        console.log("Unknown item source: " + JSON.stringify(parsedDragData));
    }


    async processDroppedData(event, parsedDragData) {
        const targetActor = new ActorItemHelper(this.actor.id, this.token?.id, this.token?.parent?.id);
        console.log("Parsed", parsedDragData)
        if (!ActorItemHelper.IsValidHelper(targetActor)) {
            ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragToExternalTokenError"));
            return;
        }
        let itemData = null
        let targetContainer = null;
        if (event) {
            const targetId = $(event.target).parents('.item').attr('data-item-id')
            targetContainer = targetActor.getItem(targetId);
        }

        //Collection

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
        }
        //Pack
        //documentIndex.uuids
        else if (parsedDragData.pack) {
            const pack = game.packs.get(parsedDragData.pack);
            console.log(pack, parsedDragData.pack, game.packs)
            const itemData = await pack.getDocument(parsedDragData.id);

            if (itemData.type === "class") {
                const existingClass = targetActor.findItem(x => x.type === "class" && x.name === itemData.name);
                if (existingClass) {
                    ui.notifications.warn("You got a class")
                    //const levelUpdate = {};
                    //levelUpdate["levels"] = existingClass.system.levels + 1;
                    //existingClass.update(levelUpdate)
                    return existingClass;
                }
            }
            console.log("itemData", itemData)
            const createResult = await targetActor.createItem(itemData._source);
            const addedItem = targetActor.getItem(createResult[0].id);

            if (!(addedItem.type in SFRPG.containableTypes)) {
                targetContainer = null;
            }

            const itemInTargetActor = await moveItemBetweenActorsAsync(targetActor, addedItem, targetActor, targetContainer);
            if (itemInTargetActor === addedItem) {
                await this._onSortItem(event, itemInTargetActor);
                return itemInTargetActor;
            }

            return itemInTargetActor;
        }

        //Actor  & Tokens     

        else if (parsedDragData.uuid.includes("Actor") || parsedDragData.uuid.includes("Token")) {
            const splitUUID = parsedDragData.uuid.split(".");
            let actorID, itemId, sceneId, tokenId;
            //
            if (splitUUID[0] === "Actor") {
                actorID = splitUUID[1];
                if (splitUUID[2] === "Item") {
                    itemId = splitUUID[3];
                }
            }
            if (splitUUID[0] === "Scene") {
                sceneId = splitUUID[1];
                if (splitUUID[2] === "Token") {
                    tokenId = splitUUID[3];
                }
                if (splitUUID[4] === "Item") {
                    itemId = splitUUID[5];
                }
            }
            parsedDragData.actorId = actorID
            parsedDragData.sceneId = sceneId
            parsedDragData.tokenId = tokenId
            console.log(parsedDragData, "parsedDragData")
            const sourceActor = new ActorItemHelper(parsedDragData.actorId, parsedDragData.tokenId, parsedDragData.sceneId);
            console.log(sourceActor, "sourceActor")
            if (!ActorItemHelper.IsValidHelper(sourceActor)) {
                ui.notifications.warn(game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DragFromExternalTokenError"));
                return;
            }

            const itemToMove = await sourceActor.getItem(itemId);

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
                        this._onSortItem(event, itemInTargetActor);
                    }
                });
            } else {
                const itemInTargetActor = await moveItemBetweenActorsAsync(sourceActor, itemToMove, targetActor, targetContainer);
                if (itemInTargetActor === itemToMove) {
                    return await this._onSortItem(event, itemInTargetActor);
                }
            }
        }

        //Everything else       

        else {

            const splitUUID = parsedDragData.uuid.split(".");
            let itemID = "";
            if (splitUUID[0] === "Item") {
                itemID = splitUUID[1];
            }
            if (splitUUID[0] === "Compendium") {
                itemID = splitUUID[3];
            }

            console.log("\nparsedDragData\n", parsedDragData, itemID)
            const sidebarItem = game.items.get(itemID);

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

                const addedItemResult = await targetActor.createItem(foundry.utils.duplicate(sidebarItem));
                if (addedItemResult.length > 0) {
                    const addedItem = targetActor.getItem(addedItemResult[0].id);

                    if (targetContainer) {
                        let newContents = [];
                        if (targetContainer.system.container?.contents) {
                            newContents = foundry.utils.duplicate(targetContainer.system.container?.contents || []);
                        }

                        const preferredStorageIndex = getFirstAcceptableStorageIndex(targetContainer, addedItem) || 0;
                        newContents.push({ id: addedItem.id, index: preferredStorageIndex });

                        const update = { id: targetContainer.id, "container.contents": newContents };
                        await targetActor.updateItem(update);
                    }

                    return addedItem;
                }
                return null;
            }

            console.log("Unknown item source: " + JSON.stringify(parsedDragData));
        }
    }


    _onItemRollAttack(event, attackType) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        console.log("User Targets", item, game.user?.targets);
        attackType = item.system.fireMode;
        console.log("event", event)
        return item.rollAttack({ event: event, attackType: attackType });
    }

    async _onToggleModeChange(event) {
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        console.log("Mode", item, itemId);

        if (!item || !this.actor?.isOwner) return;

        const isStarshipActor = this.actor?.type === "starship";
        const isStarshipWeapon = item?.type === "starshipWeapon" || item?.system?.type === "starshipWeapon";
        const supportsBattery = !!item?.system?.mode?.battery;

        // Starship Battery assignment behavior:
        // - First time entering battery mode: assign to Battery[0]
        // - While already in battery: second click moves to Battery[1]; third click cycles back to Fire and removes
        if (isStarshipActor && isStarshipWeapon && supportsBattery) {
            const rawBatteries = this.actor.getFlag("Alternityd100", "batteries");
            const batteries = Array.isArray(rawBatteries)
                ? rawBatteries.map(g => Array.isArray(g) ? g.filter(Boolean) : [])
                : [];

            const findGroupIndex = (id) => {
                for (let groupIndex = 0; groupIndex < batteries.length; groupIndex++) {
                    if (batteries[groupIndex]?.includes(id)) return groupIndex;
                }
                return -1;
            };

            const removeFromAllGroups = (id) => {
                for (let groupIndex = 0; groupIndex < batteries.length; groupIndex++) {
                    batteries[groupIndex] = (batteries[groupIndex] ?? []).filter(x => x !== id);
                }
            };

            const ensureGroup = (groupIndex) => {
                while (batteries.length <= groupIndex) batteries.push([]);
                if (!Array.isArray(batteries[groupIndex])) batteries[groupIndex] = [];
                return batteries[groupIndex];
            };

            const tryAddToGroup = (groupIndex, id) => {
                const group = ensureGroup(groupIndex);
                if (group.includes(id)) return true;
                // Rules cap is 4 weapons per battery.
                if (group.length >= 4) return false;
                group.push(id);
                return true;
            };

            const currentMode = item.system?.fireMode ?? "fire";
            const currentGroup = findGroupIndex(itemId);

            // If we're currently in battery mode, cycle battery grouping: [0] -> [1] -> fire
            if (currentMode === "battery") {
                removeFromAllGroups(itemId);
                if (currentGroup <= 0) {
                    // Second click: move this weapon to Battery[1] (still battery mode)
                    if (!tryAddToGroup(1, itemId)) {
                        ui.notifications.warn("Battery[1] is full (max 4 weapons). Cycling to Fire.");
                        await this.actor.setFlag("Alternityd100", "batteries", batteries);
                        return item.update({ ["system.fireMode"]: "fire" });
                    }
                    await this.actor.setFlag("Alternityd100", "batteries", batteries);
                    // Keep fireMode as battery; flag change will rerender.
                    return;
                }

                // Third click: leave battery mode entirely
                await this.actor.setFlag("Alternityd100", "batteries", batteries);
                return item.update({ ["system.fireMode"]: "fire" });
            }

            // Otherwise, follow existing mode cycling and hook battery entry/exit.
            const nextMode = item.changeAttackMode();

            removeFromAllGroups(itemId);
            if (nextMode === "battery") {
                // First battery assignment defaults to Battery[0]. If full, try Battery[1].
                const added = tryAddToGroup(0, itemId) || tryAddToGroup(1, itemId);
                if (!added) {
                    ui.notifications.warn("All batteries are full (max 4 weapons each).");
                }
            }

            await this.actor.setFlag("Alternityd100", "batteries", batteries);
            return item.update({ ["system.fireMode"]: nextMode });
        }

        // Default behavior for everything else
        return item.update({
            ["system.fireMode"]: item.changeAttackMode()
        });
    }


    /* -------------------------------------------- */

    /**
     * Handle dropping of an Actor data onto another Actor sheet
     * @param {DragEvent} event            The concluding DragEvent which contains drop data
     * @param {object} data                The data transfer extracted from the event
     * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
     *                                     not permitted.
     * @protected
     */
    async _onDropActor(event, data) {

        console.log("_onDropActor_Starship", event, data);
        // if ( !this.actor.isOwner ) return false;

        let parsedDragData = data;
        if (!parsedDragData.id) {
            const uuidarray = parsedDragData.uuid.split(".")
            parsedDragData.id = uuidarray[uuidarray.length - 1]
            parsedDragData.uuidarray = uuidarray
        }

        /* parsedDragData.pack = "";
         if (parsedDragData.uuidarray[0] == "Compendium"){
             let packlen = parsedDragData.uuidarray.length-1;
             for(let a = 1; a < packlen;a++){
                 parsedDragData.pack += parsedDragData.uuidarray[a];
                 if (a < packlen-1) parsedDragData.pack += ".";
                 console.log("Builder",packlen,parsedDragData.uuidarray[a],a,parsedDragData.pack)
             }
      
         }
          */

        console.log(this.actor)
        if (!["starship", "vehicle"].includes(this.actor.type)) return false
        if ( ["character","npc"].includes(data.type) ) {
            return this._onCrewDrop(event, parsedDragData);
        }


    }
    /* -------------------------------------------- */
    /**
     * Handles drop events for the Crew list
     * 
     * @param {Event}  event The originating drop event
     * @param {object} data  The data transfer object.
     */
    async _onCrewDrop(event, data) {
        // event.preventDefault();
        console.log(this, event, data)
        // Clear any drop-target highlighting.
        try {
            const highlighted = event?.target?.closest?.('li.crew-header');
            if (highlighted?.style) highlighted.style.background = '';
        } catch (err) {
            // Ignore styling errors; drop handling should still proceed.
        }

        // In practice the drop "target" is often a child element within the header,
        // so resolve the role from the closest ancestor that defines it.
        let targetRole = event?.target?.closest?.('[data-role]')?.dataset?.role;
        if (!targetRole) {
            // If the user drops onto the crew member list (or one of its children),
            // infer the role from the preceding header element.
            const crewItemList = event?.target?.closest?.('ol.crew-item-list');
            const maybeHeader = crewItemList?.previousElementSibling;
            targetRole = maybeHeader?.dataset?.role;
        }

        console.log("targetRole", targetRole, event.target)
        if (!targetRole || !data.id) return false;

        const crew = foundry.utils.duplicate(this.actor.system.crew);
        const crewRole = crew[targetRole];
        const oldRole = this.actor.getCrewRoleForActor(data.id);
        console.log("this.actor.system.crew", this.actor.system.crew)
        console.log("oldRole", oldRole)
        console.log("crewRole", crewRole)
        if (crewRole.limit < -1) {
            ui.notifications.error("Too many", crewRole.limit, targetRole)
            crewRole.limit = -1
        }
        if (crewRole.limit === -1 || crewRole.actorIds.length < crewRole.limit) {
            crewRole.actorIds.push(data.id);

            if (oldRole) {
                const originalRole = crew[oldRole];
                originalRole.actorIds = originalRole.actorIds.filter(x => x != data.id);
            }

            await this.actor.update({
                "system.crew": crew
            }).then(this.render(false));
        } else {
            ui.notifications.error(game.i18n.format("SFRPG.StarshipSheet.Crew.CrewLimitReached", { targetRole: targetRole }));
        }

        return true;
    }

    /* -------------------------------------------- */

    /*****
     * 
     * 
     */



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
        let skill = dataset.skillid;
        let stepbonus = 0//this.actor.system.skills[skill].step
        //console.log("xxxx");
        //console.log("SKILL",skill,"ELEMENT",element,"DATASET",dataset, this, event);
        this.actor.rollSkill(skill, { steps: stepbonus, event: event, skipDialog: getSkipActionPrompt(event) });
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
        switch (button.dataset.action) {
            case "create":
                const cls = getDocumentClass("Item");
                return cls.create({ name: game.i18n.localize("SIMPLE.ItemNew"), type: "item" }, { parent: this.actor });
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
    _xxxonItemRoll(event) {
        let button = $(event.currentTarget);
        const li = button.parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        let r = new Roll(button.data('roll'), this.actor.getRollData());
        return r.toMessage({
            author: game.user.id,
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
    
                const addedItemResult = await targetActor.createItem(foundry.utils.duplicate(sidebarItem.data));
                if (addedItemResult.length > 0) {
                    const addedItem = targetActor.getItem(addedItemResult[0].id);
    
                    if (targetContainer) {
                        let newContents = [];
                        if (targetContainer.system.container?.contents) {
                            newContents = foundry.utils.duplicate(targetContainer.system.container?.contents || []);
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
    async _onItemCreate3(event) {
        event.preventDefault();
        const header = event.currentTarget;
        console.log(header, event)
        let type = header.dataset.type;
        if (!type || type.includes(",")) {
            let types = foundry.utils.duplicate(SFRPG.itemTypes);
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

            let templateData = { upper: "Item", lower: "item", types: types },
                dlg = await foundry.applications.handlebars.renderTemplate(`systems/Alternityd100/templates/apps/localized-entity-create.html`, templateData);

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
                            foundry.utils.mergeObject(createData, formDataExtended.toObject());
                            if (!createData.name) {
                                createData.name = game.i18n.format("SFRPG.NPCSheet.Interface.CreateItem.Name");
                            }

                            this.onBeforeCreateNewItem(createData);

                            this.actor.createEmbeddedDocuments("Item", [createData]);
                        }
                    }
                },
                default: "create"
            }, { classes: ["Alternityd100"] }).render(true);
            return null;
        }

        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type,
            data: foundry.utils.duplicate(header.dataset)
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

        return item.rollDamage({ event: event });
    }
    _onItemRollDefence(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        return item.rollBlankDefence(event, item, this.actor);
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
    _xxxxxxonItemRoll(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (item.data.type === "spell") {
            return this.actor.useSpell(item, { configureDialog: !event.shiftKey });
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
     * Toggle a configured status effect directly on the actor.
     *
     * @param {Event} event The triggering event.
     */
    async _onToggleStatusEffect(event) {
        event.preventDefault();

        const target = event.currentTarget;
        const statusId = target?.dataset?.statusId;
        if (!statusId) return;

        await this.actor.toggleStatusEffect(statusId, { active: !!target.checked, overlay: false });
    }

    _onToggleConditions(event) {
        return this._onToggleStatusEffect(event);
    }

    async _onToggleEffectDisabled(event) {
        event.preventDefault();

        const effectId = event.currentTarget?.dataset?.effectId;
        if (!effectId) return;

        const effect = this.actor.effects.get(effectId);
        if (!effect) return;

        await effect.update({ disabled: !effect.disabled });
    }

    _onActorResourceChanged(event) {
        event.preventDefault();
        const target = $(event.currentTarget);
        const resourceId = target.data('resourceId');
        const resourceItem = this.actor.items.get(resourceId);
        const newBaseValue = parseInt(target[0].value);

        if (!Number.isNaN(newBaseValue)) {
            resourceItem.update({ "data.base": newBaseValue });
        } else {
            resourceItem.update({ "data.base": 0 });
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
        this.actor.rollSave(save, { event: event });
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
        console.log("RELOAD HERE", item)
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

        return item.update({ 'system.container.isOpen': !isOpen });
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
    async _xxxxonItemSummary(event) {
        event.preventDefault();
        let li = $(event.currentTarget).parents('.item'),
            item = this.actor.items.get(li.data('item-id')),
            chatData = item.getChatData({ secrets: this.actor.isOwner, rollData: this.actor.system });

        if (li.hasClass('expanded')) {
            let summary = li.children('.item-summary');
            summary.slideUp(200, () => summary.remove());
        } else {
            const desiredDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(chatData.description.short || chatData.description.value, {});
            let div = $(`<div class="item-summary">${desiredDescription}</div>`);
            let props = $(`<div class="item-properties"></div>`);
            chatData.properties.forEach(p => props.append(`<span class="tag" ${p.tooltip ? ("data-tooltip='" + p.tooltip + "'") : ""}>${p.name}</span>`));

            div.append(props);
            li.append(div.hide());

            div.slideDown(200, function () { /* noop */ });
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

        const itemData = foundry.utils.duplicate(item.data);
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
                    label: lvl >= 0 ? CONFIG.d100A.spellLevels[lvl] : CONFIG.d100A.spellPreparationModes[mode],
                    spells: [],
                    uses: useLabels[lvl] || spellsPerDay.value || 0,
                    slots: useLabels[lvl] || spellsPerDay.max || 0,
                    dataset: { "type": "spell", "level": lvl }
                };

                if (actorData.spells.classes && actorData.spells.classes.length > 0) {
                    spellBook[lvl].classes = [];
                    if (spellsPerDay?.perClass) {
                        for (const [classKey, storedData] of Object.entries(spellsPerDay.perClass)) {
                            const classInfo = actorData.spells.classes.find(x => x.key === classKey);
                            if (storedData.max > 0) {
                                spellBook[lvl].classes.push({ key: classKey, name: classInfo?.name || classKey, value: storedData.value || 0, max: storedData.max });
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

        return super._onDrop(event);

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
