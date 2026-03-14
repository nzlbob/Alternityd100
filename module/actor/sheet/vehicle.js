//import { ActorSheetSFRPG } from "./base.js";
import { d100ActorSheet } from "../../d100Actor-sheet.js";

export class d100AActorSheetVehicle extends d100ActorSheet {

    static get DEFAULT_OPTIONS() {
        const base = super.DEFAULT_OPTIONS;
        return foundry.utils.mergeObject(base, {
            position: { width: 600, height: 685 },
            window: { contentClasses: [...base.window.contentClasses, "vehicle"] }
        });
    }

        static PARTS = {
            form: { template: 'systems/Alternityd100/templates/actors/vehicle-sheet-full.html' }
        };

   async _prepareContext(options) {
       const data = await super._prepareContext(options);

        let lvl = 1 //parseFloat(data.data.details.level || 0);
        let levels = { 0: "0", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        data.labels["level"] = lvl >= 1 ? String(lvl) : levels[lvl] || 1;

        this._getCrewData(data)
        this._getHangarBayData(data)
// Encrich text editors
data.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.details.biography.value, {async: true});


        return data;
    }

    /**
     * Process any flags that the crew actor might have that would affect the sheet .
     *
     * @param {Object} data The data object to update with any crew data.
     */
    async _getCrewData(data) {
        let crewData = this.actor.system.crew;
        
        const pilotActors = crewData.pilot.actorIds.map(crewId => game.actors.get(crewId));
        const complementActors = crewData.complement.actorIds.map(crewId => game.actors.get(crewId));
        const passengerActors = crewData.passenger.actorIds.map(crewId => game.actors.get(crewId));

        const localizedNoLimit = game.i18n.format("SFRPG.VehicleSheet.Passengers.UnlimitedMax");

        const crew = {
            pilots: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Pilot") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": pilotActors.length, "max": crewData.pilot.limit > -1 ? crewData.pilot.limit : localizedNoLimit}), actors: pilotActors, dataset: { type: "passenger", role: "pilot" }},
            complement: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Complement") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": complementActors.length, "max": crewData.complement.limit > -1 ? crewData.complement.limit : localizedNoLimit}), actors: complementActors, dataset: { type: "passenger", role: "complement" }},
            passengers: { label: game.i18n.format("SFRPG.VehicleSheet.Passengers.Passengers") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": passengerActors.length, "max": crewData.passenger.limit > -1 ? crewData.passenger.limit : localizedNoLimit}), actors: passengerActors, dataset: { type: "passenger", role: "passenger" }}
        };

        data.crew = Object.values(crew);
    }

    /**
     * Process any flags that the hangar bay actor might have that would affect the sheet.
     *
     * @param {Object} data The data object to update with any hangar bay data.
     */
    async _getHangarBayData(data) {
        let hangarBayData = this.actor.system.hangarBay;
        data.hasHangarBays = this.actor.system.hangarBay.limit > 0;

        const hangarBayActors = hangarBayData.actorIds.map(crewId => game.actors.get(crewId));
        const localizedNoLimit = game.i18n.localize("SFRPG.VehicleSheet.Hangar.UnlimitedMax");

        data.hangarBay = { label:  game.i18n.localize("SFRPG.VehicleSheet.Hangar.Vehicles") + " " + game.i18n.format("SFRPG.VehicleSheet.Passengers.AssignedCount", {"current": hangarBayActors.length, "max": hangarBayData.limit > -1 ? hangarBayData.limit : localizedNoLimit}), actors: hangarBayActors, dataset: { type: "vehicle" }};
    }

    /**
     * Organize and classify items for vehicle sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        const actorData = data.data;

        const inventory = {
            inventory: { label: game.i18n.localize("SFRPG.VehicleSheet.Attacks.Attacks"), items: [], dataset: { type: "vehicleAttack,weapon" }, allowAdd: true }
        };

        //   0        1               2              3
        let [attacks, primarySystems, equipment, expansionBays /*, actorResources*/] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;

            if (item.type === "actorResource") {
         //       this._prepareActorResource(item, actorData);
            }

            if (item.type === "weapon" || item.type === "vehicleAttack") {
                arr[0].push(item); // attacks
            }
            else if (item.type === "vehicleSystem") {

                item.isVehicleSystem = true;
                arr[1].push(item); // primarySystems
            }
            else if (item.type === "equipment") arr[2].push(item); // expansionBays
            else if (item.type === "starshipExpansionBay") arr[3].push(item); // expansionBays
            //else if (item.type === "actorResource") arr[4].push(item); // actorResources

            return arr;
        }, [ [], [], [], []/*, []*/]);

        this.processItemContainment(attacks, function (itemType, itemData) {
            // NOTE: We only flag `vehicleAttack` type items as having damage as weapon rolls won't work from the
            // vehicle sheet until we can assign passengers and access their dexterity modifiers.
            if (itemData.item.type === "vehicleAttack") {

                itemData.item.hasDamage = itemData.item.data.damage?.parts && itemData.item.data.damage.parts.length > 0;
            }
            inventory.inventory.items.push(itemData);
        });
        data.inventory = inventory
console.log(data)
        const features = {
            primarySystems: { label: game.i18n.localize("SFRPG.VehicleSheet.Hangar.PrimarySystems"), items: primarySystems, hasActions: true, dataset: { type: "vehicleSystem" } },
            equipment: { label: game.i18n.format("Armor"), items: equipment, dataset: { type: "equipment" }, hasActions: true, },
            expansionBays: { label: game.i18n.format(game.i18n.localize("SFRPG.VehicleSheet.Hangar.ExpansionBays") + " " + game.i18n.localize("SFRPG.VehicleSheet.Hangar.AssignedCount"), {current: expansionBays.length, max: 1 /*data.system.attributes.expansionBays.value*/}), items: expansionBays, hasActions: false, dataset: { type: "starshipExpansionBay" } },
           // resources: { label: game.i18n.format("SFRPG.ActorSheet.Features.Categories.ActorResources"), items: actorResources, hasActions: false, dataset: { type: "actorResource" } }
        };
        data.features = Object.values(features);
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     *
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    _onRender(context, options) {
        super._onRender?.(context, options);

        if (!this.isEditable) return;

        const root = this.element;
        if (!root) return;

        root.querySelectorAll('.crew-delete').forEach((el) => {
            el.addEventListener('click', this._onRemoveFromCrew.bind(this));
        });

        const dragStartHandler = (event) => this._onDragCrewStart(event);
        root.querySelectorAll('li.crew').forEach((li) => {
            li.setAttribute('draggable', true);
            li.addEventListener('dragstart', dragStartHandler, false);
        });

        root.querySelectorAll('.crew-list').forEach((li) => {
            li.addEventListener('dragover', this._onCrewDragOver.bind(this), false);
        });

        root.querySelectorAll('li.crew-header').forEach((li) => {
            li.addEventListener('dragenter', this._onCrewDragEnter, false);
            li.addEventListener('dragleave', this._onCrewDragLeave, false);
        });

        root.querySelectorAll('.vehicle-system-action .roll-piloting').forEach((el) => {
            el.addEventListener('click', (event) => this._onRollPilotingForSystem(event));
        });
        root.querySelectorAll('.item-detail .vehicle-system-activate').forEach((el) => {
            el.addEventListener('click', (event) => this._onActivateVehicleSystem(event));
        });
        root.querySelectorAll('.item-detail .vehicle-system-deactivate').forEach((el) => {
            el.addEventListener('click', (event) => this._onDeactivateVehicleSystem(event));
        });

        root.querySelectorAll('.vehicle-delete').forEach((el) => {
            el.addEventListener('click', this._onRemoveFromHangarBar.bind(this));
        });
        root.querySelectorAll('.vehicle-view').forEach((el) => {
            el.addEventListener('click', (event) => this._onActorView(event));
        });

        root.querySelectorAll('.passenger-view').forEach((el) => {
            el.addEventListener('click', (event) => this._onActorView(event));
        });

        root.querySelectorAll('.passenger-action .passengerPilotingSkill').forEach((el) => {
            el.addEventListener('click', (event) => this._onRollPassengerPilotingSkill(event));
        });
        root.querySelectorAll('.passenger-action .pilotPilotingSkill').forEach((el) => {
            el.addEventListener('click', (event) => this._onRollPilotPilotingSkill(event));
        });
    }

    activateListeners(html) {
        // AppV2 no longer uses this; listeners are bound in _onRender.
        ui.notifications?.warn?.(
            "d100AActorSheetVehicle.activateListeners called - use _onRender(context, options) for AppV2."
        );
    }

    /**
     * This method is called upon form submission after form data is validated
     * 
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const levels = { "1/4": 0.25, "1/3": 1/3, "1/2": 0.5 };
        let v = "data.details.level";
        let lvl = formData[v];
        lvl = levels[lvl] || parseFloat(lvl);
        if (lvl) formData[v] = lvl < 1 ? lvl : parseInt(lvl);

        return super._updateObject(event, formData);
    }

    /** @override */
    async x_onDrop(event) {
        event.preventDefault();

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (!data) {
                return false;
            }
        } catch (err) {
            return false;
        }

        // Case - Dropped Actor
        if (data.type === "Actor") {

            const actorId = data.id;
            const actor = game.actors.get(actorId);

            // Other vehicles are only acceptable if this vehicle has 1 or more hangar bays
            if (actor.data.type === "vehicle") {
                return this._onVehicleDrop(event, data);
            }
            // The only other actors allowed are crew
            else {
                return this._onCrewDrop(event, data);
            }
        }
        else if (data.type === "Item") {
            const rawItemData = await this._getItemDropData(event, data);

            if (rawItemData.type === "weapon" || rawItemData.type === "vehicleAttack") {
                return this.processDroppedData(event, data);
            }
            else if (rawItemData.type === "starshipExpansionBay" || rawItemData.type === "vehicleSystem" || rawItemData.type === "actorResource") {
                return this.actor.createEmbeddedDocuments("Item", [rawItemData]);
            }
        }

        return false;
    }

    /**
     * Get an items data.
     *
     * @param {Event} event The originating drag event
     * @param {object} data The data transfer object
     */
    async _getItemDropData(event, data) {
        let itemData = null;

        const actor = this.actor;
        if (data.pack) {
            const pack = game.packs.get(data.pack);
            if (pack.metadata.entity !== "Item") return;
            itemData = await pack.getEntity(data.id);
        } else if (data.data) {
            let sameActor = data.actorId === actor.id;
            if (sameActor && actor.isToken) sameActor = data.tokenId === actor.token.id;
            if (sameActor) {
                await this._onSortItem(event, data.data);
            }
            itemData = data.data;
        } else {
            let item = game.items.get(data.id);
            if (!item) return;
            itemData = item.data;
        }

        return foundry.utils.duplicate(itemData);
    }


    /**
     * Handles drop events for the Hangar Bay list
     *
     * @param {Event}  event The originating drop event
     * @param {object} data  The data transfer object.
     */
    async _onVehicleDrop(event, data) {
        // event.preventDefault();
        if (event?.currentTarget?.style) {
            event.currentTarget.style.background = "";
        }

        if (!data.id) return false;

        const hangarBay = foundry.utils.duplicate(this.actor.system.hangarBay);

        if (hangarBay.limit === -1 || hangarBay.actorIds.length < hangarBay.limit) {
            hangarBay.actorIds.push(data.id);

            await this.actor.update({
                "data.hangarBay": hangarBay
            }).then(this.render(false));
        } else {
            ui.notifications.error(game.i18n.localize("SFRPG.VehicleSheet.Hangar.VehiclesLimitReached"));
        }

        return true;
    }

        /**
     * Handles drop events for the Passenger list
     *
     * @param {Event}  event The originating drop event
     * @param {object} data  The data transfer object.
     */
    async x_onCrewDrop(event, data) {
        // event.preventDefault();
        if (event?.currentTarget?.style) {
            event.currentTarget.style.background = "";
        }

        const targetRole = event.target.dataset.role;
        if (!targetRole || !data.id) return false;

        const crew = foundry.utils.duplicate(this.actor.system.crew);
        const crewRole = crew[targetRole];
        const oldRole = this.actor.getCrewRoleForActor(data.id);

        if (crewRole.limit === -1 || crewRole.actorIds.length < crewRole.limit) {
            crewRole.actorIds.push(data.id);

            if (oldRole) {
                const originalRole = crew[oldRole];
                originalRole.actorIds = originalRole.actorIds.filter(x => x != data.id);
            }

            await this.actor.update({
                "data.crew": crew
            }).then(this.render(false));
        } else {
            ui.notifications.error(game.i18n.format("SFRPG.VehicleSheet.Passengers.PassengersLimitReached", {targetRole: targetRole}));
        }

        return true;
    }

    /**
     * Handles dragenter for the passengers tab
     * @param {Event} event The originating dragenter event
     */
    _onCrewDragEnter(event) {
        if (event?.currentTarget?.style) {
            event.currentTarget.style.background = "rgba(0,0,0,0.3)";
        }
    }

    /**
     * Handles dragleave for the passengers tab
     * @param {Event} event The originating dragleave event
     */
    _onCrewDragLeave(event) {
        if (event?.currentTarget?.style) {
            event.currentTarget.style.background = "";
        }
    }

    /**
     * Handle dragging crew members on the sheet.
     *
     * @param {Event} event Originating dragstart event
     */
    _onDragCrewStart(event) {
        const actorId = event.currentTarget.dataset.actorId;
        const actor = game.actors.get(actorId);

        const dragData = {
            type: "Actor",
            id: actor.id,
            data: actor.data
        };

        if (this.actor.isToken) dragData.tokenId = actorId;
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    /**
     * Handles ondragover for crew drag-n-drop
     *
     * @param {Event} event Orgininating ondragover event
     */
    _onCrewDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    /**
     * Remove an vehicle from the hangar bay.
     *
     * @param {Event} event The originating click event
     */
    async _onRemoveFromHangarBar(event) {
        event.preventDefault();
        const crewElement = event.currentTarget.closest('.crew');
        const actorId = crewElement?.dataset?.actorId;
        if (!actorId) return null;

        if (!this.actor.data?.data?.hangarBay.actorIds) {
            return null;
        }

        const hangarData = foundry.utils.duplicate(this.actor.system.hangarBay);
        hangarData.actorIds = hangarData.actorIds.filter(x => x !== actorId);
        await this.actor.update({
            "data.hangarBay": hangarData
        });
    }

    /**
     * Remove an actor from the crew.
     *
     * @param {Event} event The originating click event
     */
    async _onRemoveFromCrew(event) {
        event.preventDefault();
        const crewElement = event.currentTarget.closest('.crew');
        const actorId = crewElement?.dataset?.actorId;
        if (!actorId) return;
        this.actor.removeFromCrew(actorId);
    }

    /**
     * Opens the sheet of a passenger.
     *
     * @param {Event} event The originating click event
     */
    async _onActorView(event) {
        event.preventDefault();
        const crewElement = event.currentTarget.closest('.crew');
        const actorId = crewElement?.dataset?.actorId;
        if (!actorId) return;
        let actor = game.actors.get(actorId);
        actor.sheet.render(true);
    }

    /**
     * Rolls the Piloting skill check of a passenger.
     *
     * @param {Event} event The originating click event
     */
    async _onRollPassengerPilotingSkill(event) {
        event.preventDefault();
        const crewElement = event.currentTarget.closest('.crew');
        const actorId = crewElement?.dataset?.actorId;
        if (!actorId) return;
        const role = this.actor.getCrewRoleForActor(actorId);
        const actor = game.actors.get(actorId);
console.log(role,actorId,event,this,this.actor.system.attributes.speed.driveMod.value)

const options = { stepbonus: 0,
    steps:this.actor.system.attributes.speed.driveMod.value ||0, 
    event: event, 
    skipDialog: false, 
    staticRoll: null, 
    chatMessage: true, 
    noSound: false, 
    dice: "1d20",
    skillflavor:"",
    degreeText:{}
}
        await actor.rollSkill(this.actor.system.attributes.controlSkill,options);
    }

    /**
     * Rolls the Piloting skill check of the pilot.
     *
     * @param {Event} event The originating click event
     */
    async _onRollPilotPilotingSkill(event) {
        event.preventDefault();

        this.actor.rollVehiclePilotingSkill();
    }

    /**
     * Performs a Piloting check for a system (generally Autopilot)
     *
     * @param {Event} event The originating click event
     */
    async _onRollPilotingForSystem(event) {

        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const system = this.actor.items.get(itemId);

        this.actor.rollVehiclePilotingSkill(null, null, system);
    }

    /**
     * Deactivates a vehicle system.
     *
     * @param {Event} event The originating click event
     */
    async _onDeactivateVehicleSystem(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        const desiredOutput = (item.system.isActive === true || item.system.isActive === false) ? !item.system.isActive : false;
        await item.update({'system.isActive': desiredOutput});

        // Render the chat card template
        const templateData = {
            actor: this.actor,
            item: item,
            tokenId: this.actor.token?.id,
            action: "SFRPG.ChatCard.ItemActivation.Deactivates"
        };

        const template = `systems/Alternityd100/templates/chat/item-action-card.html`;
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: html
        };

        await ChatMessage.create(chatData, { displaySheet: false });
    }

    /**
     * Activates a vehicle system.
     *
     * @param {Event} event The originating click event
     */
    async _onActivateVehicleSystem(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        const updateData = {};

        const desiredOutput = (item.system.isActive === true || item.system.isActive === false) ? !item.system.isActive : true;
        updateData['system.isActive'] = desiredOutput;

        await item.update(updateData);

        // Render the chat card template
        const templateData = {
            actor: this.actor,
            item: item,
            tokenId: this.actor.token?.id,
            action: "SFRPG.ChatCard.ItemActivation.Activates",
            labels: item.labels,
            hasAttack: item.hasAttack,
            hasDamage: item.hasDamage,
            isVersatile: item.isVersatile,
            hasSave: item.hasSave
        };

        const template = `systems/Alternityd100/templates/chat/item-action-card.html`;
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: html
        };

        await ChatMessage.create(chatData, { displaySheet: false });
    }
}