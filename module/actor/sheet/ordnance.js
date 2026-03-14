import { Diced100 } from "../../dice.js";
import RollContext from "../../rolls/rollcontext.js";
//import { ActorSheetSFRPG } from "./base.js";
import { d100A as SFRPG } from "../../d100Aconfig.js"
import { d100ActorSheet } from "../../d100Actor-sheet.js";
import { computeKinematicMoveBudget } from "../../utils/space_physics.js";
import { measureDistance } from "../../utilities.js";
export class d100AActorSheetOrdnance extends d100ActorSheet {
    static get DEFAULT_OPTIONS() {
        const base = super.DEFAULT_OPTIONS;
        return foundry.utils.mergeObject(base, {
            position: { width: 600, height: 685 },
            window: { contentClasses: [...(base.window?.contentClasses ?? []), "hazard", "ordnance"] }
        });
    }
    static PARTS = {
      form: { template: 'systems/Alternityd100/templates/actors/ordnance-sheet-full.html' }
    };

    async _prepareContext(options) {
        const data = await super._prepareContext(options);

        const propulsion = this.actor.items.find(i => i.type === "ordnancePropulsion") ?? null;
        const guidance = this.actor.items.find(i => i.type === "ordnanceGuidance") ?? null;
        const warhead = this.actor.items.find(i => i.type === "ordnanceWarhead") ?? null;

        const inventory = {
            ordnanceWarhead: { label: game.i18n.format(SFRPG.itemTypes["ordnanceWarhead"]), items: [], dataset: { type: "ordnanceWarhead" }, allowAdd: !warhead },
            ordnanceGuidance: { label: game.i18n.format(SFRPG.itemTypes["ordnanceGuidance"]), items: [], dataset: { type: "ordnanceGuidance" }, allowAdd: !guidance },
            ordnancePropulsion: { label: game.i18n.format(SFRPG.itemTypes["ordnancePropulsion"]), items: [], dataset: { type: "ordnancePropulsion" }, allowAdd: !propulsion },
            everythingelse: { label: game.i18n.format(SFRPG.itemTypes["everythingelse"]), items: [], dataset: { type: "everythingelse" }, allowAdd: false } 


        };
        for (const item of this.object.items.contents) {
            if (inventory[item.type]) {
                inventory[item.type].items.push({ item });
                continue;
            }

            inventory.everythingelse.items.push({ item });
        }

        data.ordnanceComponents = {
            propulsion,
            guidance,
            warhead
        };

        const getGunnerName = () => {
            const crew = this.actor?.system?.crew;
            if (!crew) return "";

            // Prefer assigned actor IDs (stable to persist) over transient actor refs.
            const actorIds = crew?.gunner?.actorIds;
            if (Array.isArray(actorIds) && actorIds.length > 0) {
                const names = actorIds
                    .map((id) => game?.actors?.get?.(id)?.name)
                    .filter((n) => typeof n === "string" && n.trim().length > 0);
                if (names.length > 0) return names.join(", ");
            }

            const actors = crew?.gunner?.actors;
            if (Array.isArray(actors) && actors.length > 0) {
                const names = actors
                    .map((a) => a?.name)
                    .filter((n) => typeof n === "string" && n.trim().length > 0);
                if (names.length > 0) return names.join(", ");
            }

            // NPC crew mode doesn't store a name; leave blank.
            return "";
        };

        data.gunnerName = getGunnerName();

        data.inventory = Object.values(inventory);
        return data;
    }

    /**
     * Ordnance build: dropping a propulsion/warhead/guidance item installs it.
     * Only one of each type may be installed; dropping a new one replaces the old.
     */
    async _onDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData("text/plain"));
        } catch (_err) {
            return super._onDrop(event);
        }

        if (data?.type !== "Item") return super._onDrop(event);
        if (!this.actor.isOwner) return false;

        const droppedItem = await Item.fromDropData(data);
        if (!droppedItem) return false;

        const allowed = new Set(["ordnancePropulsion", "ordnanceWarhead", "ordnanceGuidance"]);
        if (!allowed.has(droppedItem.type)) return super._onDrop(event);

        // Remove existing installed component of this type
        const existing = this.actor.items.filter(i => i.type === droppedItem.type);
        if (existing.length) {
            await this.actor.deleteEmbeddedDocuments("Item", existing.map(i => i.id));
        }

        // Install (embed) a copy
        const itemData = droppedItem.toObject();
        delete itemData._id;
        await this.actor.createEmbeddedDocuments("Item", [itemData]);

        // Re-render so Details tab reflects the installed component
        this.render(false);
        return true;
    }

    _onRender(context, options) {
        super._onRender?.(context, options);

        const root = this.element;
        if (!root) return;

        root.querySelectorAll('#fortSave').forEach((el) => {
            el.addEventListener('click', this._onFortSaveClicked.bind(this));
        });
        root.querySelectorAll('#reflexSave').forEach((el) => {
            el.addEventListener('click', this._onReflexSaveClicked.bind(this));
        });
        root.querySelectorAll('#willSave').forEach((el) => {
            el.addEventListener('click', this._onWillSaveClicked.bind(this));
        });

        root.querySelectorAll('#attack').forEach((el) => {
            el.addEventListener('click', this._onAttackClicked.bind(this));
        });
        root.querySelectorAll('#damage').forEach((el) => {
            el.addEventListener('click', this._onDamageClicked.bind(this));
        });

        root.querySelectorAll('#autoMove').forEach((el) => {
            el.addEventListener('click', this._onAutoMoveClicked.bind(this));
        });

        root.querySelectorAll('#newtarget').forEach((el) => {
            el.addEventListener('click', this._onReTargetClicked.bind(this));
        });

        root.querySelectorAll('#refreshTarget').forEach((el) => {
            el.addEventListener('click', this._onRefreshTargetClicked.bind(this));
        });

        root.querySelectorAll('#target').forEach((el) => {
            el.addEventListener('click', this._onTargetTokenClicked.bind(this));
        });

        this._attachTargetTokenHook();
        this._updateOrdnanceTargetButton(root);
    }

    async _onReTargetClicked(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.actor?.isOwner) {
            ui.notifications?.warn?.("You do not have permission to re-target this ordnance.");
            return;
        }

        const targets = Array.from(game?.user?.targets ?? []);
        if (!targets.length) {
            ui.notifications?.warn?.("No token targeted. Use Target (T) to target a token first.");
            return;
        }
        if (targets.length > 1) {
            ui.notifications?.info?.("Multiple targets selected; using the first targeted token.");
        }

        const targetToken = targets[0];
        const targetId = targetToken?.document?.id ?? targetToken?.id;
        if (!targetId) {
            ui.notifications?.warn?.("Could not determine targeted token id.");
            return;
        }

        const ordnanceToken = this._getOrdnanceTokenOnCanvas();
        const sourceCenter = ordnanceToken ? this._getTokenCenter(ordnanceToken) : null;
        const targetCenter = this._getTokenCenter(targetToken);

        let range = this.actor?.system?.targetData?.range ?? 0;
        let bearing = this.actor?.system?.targetData?.bearing ?? 0;
        if (sourceCenter) {
            range = Math.ceil(measureDistance(sourceCenter, targetCenter));

            const deltax = sourceCenter.x - targetCenter.x;
            const deltay = sourceCenter.y - targetCenter.y;
            const theta = Math.atan2(deltay, deltax);
            const radiansToCompass = (radians) => {
                const pi = Math.PI;
                let compass = Math.round(radians * (180 / pi));
                if (compass >= 90) compass -= 90;
                else compass += 270;
                return Math.normalizeDegrees(compass);
            };
            bearing = radiansToCompass(theta);
        }

        await this.actor.update({
            "system.targetData": {
                ...(this.actor?.system?.targetData ?? {}),
                _id: targetId,
                Name: targetToken?.name ?? targetToken?.document?.name ?? "Target",
                range,
                bearing
            }
        });

        // Make the UI reflect the new token id immediately.
        this._updateOrdnanceTargetButton();
        this.render(false);
    }

    async _onRefreshTargetClicked(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.actor?.isOwner) {
            ui.notifications?.warn?.("You do not have permission to refresh this ordnance target.");
            return;
        }

        const targetTokenId = this.actor?.system?.targetData?._id;
        if (!targetTokenId) {
            ui.notifications?.warn?.("This ordnance has no target to refresh.");
            return;
        }

        const targetToken = canvas?.tokens?.get?.(targetTokenId)
            ?? canvas?.scene?.tokens?.get?.(targetTokenId)?.object
            ?? null;
        if (!targetToken) {
            ui.notifications?.warn?.("Target token is not on the current scene.");
            return;
        }

        const ordnanceToken = this._getOrdnanceTokenOnCanvas();
        if (!ordnanceToken) {
            ui.notifications?.warn?.("Ordnance token is not on the current scene.");
            return;
        }

        const normalizeDegrees = (deg) => {
            const d = Number.isFinite(Number(deg)) ? Number(deg) : 0;
            if (typeof Math.normalizeDegrees === "function") return Math.normalizeDegrees(d);
            if (foundry?.utils?.normalizeDegrees) return foundry.utils.normalizeDegrees(d);
            return ((d % 360) + 360) % 360;
        };

        const sourceCenter = this._getTokenCenter(ordnanceToken);
        const targetCenter = this._getTokenCenter(targetToken);

        const range = Math.ceil(measureDistance(sourceCenter, targetCenter));
        const deltax = sourceCenter.x - targetCenter.x;
        const deltay = sourceCenter.y - targetCenter.y;
        const theta = Math.atan2(deltay, deltax);
        let bearing = Math.round(theta * (180 / Math.PI));
        if (bearing >= 90) bearing -= 90;
        else bearing += 270;
        bearing = normalizeDegrees(bearing);

        await this.actor.update({
            "system.targetData": {
                ...(this.actor?.system?.targetData ?? {}),
                range,
                bearing,
                Name: targetToken?.name ?? targetToken?.document?.name ?? this.actor?.system?.targetData?.Name
            }
        });

        this.render(false);
    }

    _getOrdnanceTokenOnCanvas() {
        if (!canvas?.ready) return null;

        // Prefer a token currently present on the viewed scene.
        const placeables = canvas?.tokens?.placeables ?? [];
        for (const t of placeables) {
            const actor = t?.actor;
            if (actor?.id && this.actor?.id && String(actor.id) === String(this.actor.id)) return t;
        }

        // Fallback: active tokens from actor, but only if on this scene.
        const activeTokens = this.actor?.getActiveTokens?.(true, true) ?? [];
        for (const t of activeTokens) {
            const sceneId = t?.document?.parent?.id ?? t?.scene?.id;
            if (sceneId && canvas?.scene?.id && String(sceneId) === String(canvas.scene.id)) return t;
        }

        return null;
    }

    _getTokenCenter(tokenOrDoc) {
        // Token placeable
        const tok = tokenOrDoc?.object ? tokenOrDoc.object : tokenOrDoc;
        const center = tok?.center;
        if (center && Number.isFinite(center.x) && Number.isFinite(center.y)) return { x: center.x, y: center.y };

        // As a last resort, use top-left (should be rare).
        const x = Number(tok?.x ?? tokenOrDoc?.x ?? 0);
        const y = Number(tok?.y ?? tokenOrDoc?.y ?? 0);
        return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
    }

    async _onTargetTokenClicked(event) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget;
        const tokenId = button?.dataset?.tokenid || button?.dataset?.tokenId || this.actor?.system?.targetData?._id;
        if (!tokenId) {
            ui.notifications?.warn?.('No target token id found for this ordnance.');
            return;
        }

        const token = canvas?.tokens?.get?.(tokenId)
            ?? canvas?.scene?.tokens?.get?.(tokenId)?.object
            ?? null;

        if (!token?.setTarget) {
            ui.notifications?.warn?.(`Target token not found on the current scene (${tokenId}).`);
            return;
        }

        const nextState = !token.isTargeted;
        const releaseOthers = !event.shiftKey;
        token.setTarget(nextState, { releaseOthers });

        // Update immediately (the hook also fires, but this makes UI feel snappier).
        this._updateOrdnanceTargetButton();
    }

    _attachTargetTokenHook() {
        if (this._d100aTargetTokenHookAttached) return;
        if (!Hooks?.on) return;

        this._d100aTargetTokenHookAttached = true;
        this._d100aTargetTokenHookFn = (user, _token, _targeted) => {
            try {
                const myUserId = game?.user?.id;
                const userId = user?.id ?? user;
                if (myUserId && userId && String(userId) !== String(myUserId)) return;

                if (!this.element) return;
                this._updateOrdnanceTargetButton();
            } catch (err) {
                console.error(err);
            }
        };

        Hooks.on('targetToken', this._d100aTargetTokenHookFn);
    }

    _updateOrdnanceTargetButton(root = this.element) {
        if (!root) return;

        const myUserId = game?.user?.id;
        const button = root.querySelector?.('button.tag.target#target') ?? null;
        if (!button) return;

        const tokenId = button?.dataset?.tokenid || button?.dataset?.tokenId || this.actor?.system?.targetData?._id;
        const token = tokenId
            ? (canvas?.tokens?.get?.(tokenId)
                ?? canvas?.scene?.tokens?.get?.(tokenId)?.object
                ?? null)
            : null;

        const isTargeted = token
            ? (typeof token.isTargeted === 'boolean'
                ? token.isTargeted
                : Boolean(token.targeted?.has?.(myUserId)))
            : false;

        button.classList.toggle('is-targeted', Boolean(isTargeted));
    }

    async close(options = {}) {
        if (this._d100aTargetTokenHookFn && Hooks?.off) {
            Hooks.off('targetToken', this._d100aTargetTokenHookFn);
        }
        this._d100aTargetTokenHookAttached = false;
        this._d100aTargetTokenHookFn = null;
        return super.close?.(options);
    }

    activateListeners(html) {
        // AppV2 no longer uses this; listeners are bound in _onRender.
        ui.notifications?.warn?.(
            "d100AActorSheetOrdnance.activateListeners called - use _onRender(context, options) for AppV2."
        );
    }

    async _render(...args) {
        await super._render(...args);
        const textAreas = this.element?.querySelectorAll('textarea') ?? [];
        for (const textArea of textAreas) {
            textArea.style.height = textArea.scrollHeight + "px";
        }
    }

    /**
     * Organize and classify items for hazard sheets.
     * Hazards don't need items, but this function is required because base.js calls it.
     * 
     * @param {Object} data Data for the sheet
     */
    _prepareItems(data) {

    }

    async _onFortSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Fortitude", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.fort.value, false);
    }

    async _onReflexSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Reflex", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.reflex.value, false);
    }

    async _onWillSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Will", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.will.value, false);
    }

async _onAutoMoveClicked(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!canvas?.ready) {
        ui.notifications?.warn?.('Canvas is not ready.');
        return;
    }

    const normalizeToTokenDocument = (tokenOrDoc) => {
        if (!tokenOrDoc) return null;
        // Token placeable
        if (tokenOrDoc.document) return tokenOrDoc.document;
        // TokenDocument
        if (tokenOrDoc.object || tokenOrDoc.parent) return tokenOrDoc;
        return null;
    };

    const findOrdnanceTokenDocumentOnCanvas = () => {
        const active = this.actor?.getActiveTokens?.(true, true) ?? [];
        for (const t of active) {
            const td = normalizeToTokenDocument(t);
            if (td?.object && td?.parent?.id === canvas?.scene?.id) return td;
        }

        // Fallback: find any token on the viewed scene that resolves to this actor.
        for (const t of (canvas?.tokens?.placeables ?? [])) {
            if (t?.actor?.id === this.actor?.id) return t.document;
            if (t?.document?.actorId && this.actor?.id && String(t.document.actorId) === String(this.actor.id)) return t.document;
        }

        // Last resort: controlled token that matches actor
        const controlled = canvas?.tokens?.controlled ?? [];
        for (const t of controlled) {
            if (t?.actor?.id === this.actor?.id) return t.document;
            if (t?.document?.actorId && this.actor?.id && String(t.document.actorId) === String(this.actor.id)) return t.document;
        }

        return null;
    };

    const ordnanceTokenDoc = findOrdnanceTokenDocumentOnCanvas();
    if (!ordnanceTokenDoc?.object) {
        ui.notifications?.warn?.('No active ordnance token found on the current scene.');
        return;
    }

    const targetTokenId = this.actor?.system?.targetData?._id;
    if (!targetTokenId) {
        ui.notifications?.warn?.('This ordnance has no target token id (system.targetData._id).');
        return;
    }

    const targetToken = canvas?.tokens?.get?.(targetTokenId)
        ?? canvas?.scene?.tokens?.get?.(targetTokenId)?.object
        ?? null;
    if (!targetToken?.document) {
        ui.notifications?.warn?.(`Target token not found on the current scene (${targetTokenId}).`);
        return;
    }

    const driveSpeed = Number(this.actor?.system?.attributes?.speed?.value ?? 0);
    const accel = Number(this.actor?.system?.attributes?.accel?.value ?? 0);

    // Duration normally lives on the ordnance actor schema.
    // Migrated ordnance stores authoritative lifetime on the Token flags and mirrors it into actor duration.
    const tokenLifetimeRemaining = Number(ordnanceTokenDoc?.flags?.d100A?.ordnance?.lifetime?.roundsRemaining);
    let currentDuration = Number(this.actor?.system?.attributes?.duration?.value);
    if (!Number.isFinite(currentDuration) && Number.isFinite(tokenLifetimeRemaining)) {
        currentDuration = tokenLifetimeRemaining;
    }
    if (!Number.isFinite(currentDuration)) {
        ui.notifications?.warn?.("Invalid duration value on this ordnance.");
        return;
    }

    if (currentDuration < 1) {
        const confirmFn = async () => {
            const title = "Duration Expired";
            const content = "<p>Duration expires. Move anyway?</p>";

            // Foundry v13+ (ApplicationV2) confirmation dialog.
            const DialogV2 = foundry?.applications?.api?.DialogV2;
            if (DialogV2?.confirm) {
                const result = await DialogV2.confirm({
                    window: { title },
                    content,
                    modal: true,
                    rejectClose: false
                });
                return result === true;
            }

            // Legacy fallback (pre-v13).
            return await Dialog.confirm({
                title,
                content,
                defaultYes: false
            });
        };

        const proceed = await confirmFn();
        if (!proceed) return;
    }
    const { newSpeed, maxMove } = computeKinematicMoveBudget(driveSpeed, accel);
    if (maxMove <= 0) return;

    const useWaypointMovement = game?.settings?.get?.("Alternityd100", "spaceWaypointMovement") ?? true;

    const gridLayer = canvas.grid;
    const scene = canvas.scene;
    const sceneRect = scene?.dimensions?.sceneRect
        ?? { x: 0, y: 0, width: scene?.width ?? 0, height: scene?.height ?? 0 };

    const gridStep = Number(gridLayer?.size ?? 100);

    const getOffset = gridLayer?.getOffset?.bind(gridLayer)
        ?? gridLayer?.grid?.getOffset?.bind(gridLayer.grid)
        ?? null;

    const getTopLeftPoint = gridLayer?.getTopLeftPoint?.bind(gridLayer)
        ?? gridLayer?.grid?.getTopLeftPoint?.bind(gridLayer.grid)
        ?? null;

    const getCenterPoint = gridLayer?.getCenterPoint?.bind(gridLayer)
        ?? gridLayer?.grid?.getCenterPoint?.bind(gridLayer.grid)
        ?? null;

    const getPixelsFromGridPosition = gridLayer?.getPixelsFromGridPosition?.bind(gridLayer)
        ?? gridLayer?.grid?.getPixelsFromGridPosition?.bind(gridLayer.grid)
        ?? null;

    const pixelsToOffset = (x, y) => {
        let i;
        let j;
        if (getOffset) {
            const off = getOffset({ x, y });
            if (Array.isArray(off)) {
                i = off[0];
                j = off[1];
            } else if (off && typeof off === 'object') {
                // Foundry's various Grid implementations historically used different key names.
                // Ensure we always return a numeric {i, j} pair.
                i = off.i ?? off.col ?? off.column ?? off.c ?? off.x ?? off[0];
                j = off.j ?? off.row ?? off.r ?? off.y ?? off[1];
            }
        }

        if (!Number.isFinite(i) || !Number.isFinite(j)) {
            i = Math.floor(x / gridStep);
            j = Math.floor(y / gridStep);
        }
        i = Number.isFinite(i) ? Math.trunc(i) : i;
        j = Number.isFinite(j) ? Math.trunc(j) : j;
        return { i, j };
    };

    const offsetToPixels = (i, j) => {
        try {
            if (getTopLeftPoint) {
                const pt = getTopLeftPoint({ i, j });
                if (pt && typeof pt === 'object') return { x: pt.x ?? pt[0], y: pt.y ?? pt[1] };
            }
        } catch (_err) {
            // fall through
        }
        try {
            if (getPixelsFromGridPosition) {
                const pt = getPixelsFromGridPosition(i, j);
                if (pt && typeof pt === 'object') return { x: pt.x ?? pt[0], y: pt.y ?? pt[1] };
            }
        } catch (_err) {
            // fall through
        }
        return { x: i * gridStep, y: j * gridStep };
    };

    const inScene = (pt) => {
        return (pt.x >= sceneRect.x && pt.y >= sceneRect.y
            && pt.x < (sceneRect.x + sceneRect.width)
            && pt.y < (sceneRect.y + sceneRect.height));
    };

    const toFinite = (n, fallback) => (Number.isFinite(n) ? n : fallback);
    const tokenCenter = ordnanceTokenDoc.object?.center;
    const startCenter = {
        x: toFinite(Number(tokenCenter?.x), ordnanceTokenDoc.x),
        y: toFinite(Number(tokenCenter?.y), ordnanceTokenDoc.y)
    };
    // Use the center point for offset math too, but keep it as a plain {x,y}.
    const startPos = startCenter;

    const targetPos = { x: targetToken.document.x, y: targetToken.document.y };
    const targetCenter = targetToken.center ?? targetPos;
    const targetSpeed = Math.max(0, Math.floor(Number(targetToken?.actor?.system?.attributes?.speed?.value ?? 0)));
    const targetHeading = Number(targetToken?.document?.d100ARotation ?? targetToken?.d100ARotation ?? targetToken?.document?.rotation ?? targetToken?.rotation ?? 0);

    const startOffset = pixelsToOffset(startPos.x, startPos.y);
    const targetOffset = pixelsToOffset(targetCenter.x, targetCenter.y);

    const isValidOffset = (o) => !!o && Number.isFinite(o.i) && Number.isFinite(o.j);
    const isValidPoint = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);

    // Foundry v13 HexagonalGrid.getDirectPath expects an array of waypoint points ({x,y}).
    // Passing offsets ({i,j}) or non-array inputs can cause waypoints[0] to be undefined,
    // which then yields undefined offsets inside getOffset/getCube and crashes.
    const getDirectPath = (fromPt, toPt) => {
        if (!isValidPoint(fromPt) || !isValidPoint(toPt)) {
            console.debug("Auto Move: getDirectPath skipped (invalid points)", {
                fromPt,
                toPt,
                startCenter,
                targetCenter,
                targetPos
            });
            return null;
        }

        const waypoints = [
            { x: fromPt.x, y: fromPt.y },
            { x: toPt.x, y: toPt.y }
        ];

        try {
            return gridLayer?.getDirectPath?.(waypoints)
                ?? gridLayer?.grid?.getDirectPath?.(waypoints)
                ?? null;
        } catch (err) {
            console.warn("Auto Move: getDirectPath failed.", {
                err,
                waypoints,
                startOffset,
                targetOffset
            });
            return null;
        }
    };

    const isHexagonal = canvas?.grid?.isHexagonal ?? canvas?.grid?.isHex ?? false;

    const offsetKey = (o) => `${o.i},${o.j}`;
    const offsetsEqual = (a, b) => a?.i === b?.i && a?.j === b?.j;

    const offsetToCenter = (o) => {
        try {
            if (getCenterPoint) {
                const c = getCenterPoint(o);
                if (c && Number.isFinite(c.x) && Number.isFinite(c.y)) return { x: c.x, y: c.y };
            }
        } catch (_err) {
            // fall through
        }
        const px = offsetToPixels(o.i, o.j);
        return {
            x: (px.x ?? 0) + (gridStep / 2),
            y: (px.y ?? 0) + (gridStep / 2)
        };
    };

    const safeGetCenterPoint = (pt) => {
        try {
            if (getCenterPoint && pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
                const c = getCenterPoint(pt);
                if (c && Number.isFinite(c.x) && Number.isFinite(c.y)) return { x: c.x, y: c.y };
            }
        } catch (_err) {
            // fall through
        }
        return pt;
    };

    const normalizeDegrees = (deg) => {
        const d = Number.isFinite(Number(deg)) ? Number(deg) : 0;
        if (typeof Math.normalizeDegrees === "function") return Math.normalizeDegrees(d);
        if (foundry?.utils?.normalizeDegrees) return foundry.utils.normalizeDegrees(d);
        return ((d % 360) + 360) % 360;
    };

    // Alternity compass heading: 0° = North, 90° = East.
    // Foundry canvas direction: 0° = East, 90° = South.
    const compassToFoundryDirection = (compassDeg) => normalizeDegrees(Number(compassDeg) - 90);

    const measureStepsBetween = (a, b) => {
        try {
            const measurePath = gridLayer?.measurePath?.bind(gridLayer)
                ?? gridLayer?.grid?.measurePath?.bind(gridLayer.grid)
                ?? null;
            if (!measurePath) return null;

            // Prefer a cost function that counts each grid-to-grid move as 1.
            // This makes the result independent of the Scene distance units.
            const countCost = () => 1;
            let result = null;
            try {
                result = measurePath([a, b], { cost: countCost });
            } catch (_err) {
                result = null;
            }

            if (result?.distance == null) result = measurePath([a, b]);

            const distance = Number(result?.distance);
            if (!Number.isFinite(distance)) return null;
            return Math.max(0, Math.ceil(distance));
        } catch (_err) {
            return null;
        }
    };

    const getHexNeighbors = (o) => {
        // Candidate neighbors for both common offset coordinate layouts.
        // We'll validate by pixel distance to keep this robust across hex orientations.
        const i = o.i;
        const j = o.j;

        const oddQ = (i & 1) === 1;
        const oddR = (j & 1) === 1;

        // odd-q vertical layout (columns offset)
        const candOddQ = oddQ
            ? [
                { i: i + 1, j: j + 1 },
                { i: i + 1, j: j },
                { i: i, j: j - 1 },
                { i: i - 1, j: j },
                { i: i - 1, j: j + 1 },
                { i: i, j: j + 1 }
            ]
            : [
                { i: i + 1, j: j },
                { i: i + 1, j: j - 1 },
                { i: i, j: j - 1 },
                { i: i - 1, j: j - 1 },
                { i: i - 1, j: j },
                { i: i, j: j + 1 }
            ];

        // odd-r horizontal layout (rows offset)
        const candOddR = oddR
            ? [
                { i: i + 1, j: j },
                { i: i + 1, j: j - 1 },
                { i: i, j: j - 1 },
                { i: i - 1, j: j },
                { i: i, j: j + 1 },
                { i: i + 1, j: j + 1 }
            ]
            : [
                { i: i + 1, j: j },
                { i: i, j: j - 1 },
                { i: i - 1, j: j - 1 },
                { i: i - 1, j: j },
                { i: i - 1, j: j + 1 },
                { i: i, j: j + 1 }
            ];

        const currentCenter = offsetToCenter(o);
        const acceptable = (n) => {
            const c = offsetToCenter(n);
            const dx = c.x - currentCenter.x;
            const dy = c.y - currentCenter.y;
            const d = Math.hypot(dx, dy);
            return Number.isFinite(d) && d > (gridStep * 0.25) && d < (gridStep * 1.75);
        };

        const combined = [...candOddQ, ...candOddR]
            .filter(isValidOffset)
            .filter(acceptable);

        // Deduplicate
        const seen = new Set();
        const out = [];
        for (const n of combined) {
            const k = offsetKey(n);
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(n);
        }
        return out;
    };

    const buildGreedyHexPath = (from, to, steps) => {
        const path = [];
        if (!isValidOffset(from) || !isValidOffset(to) || steps <= 0) return path;

        let current = { i: from.i, j: from.j };
        const goal = { i: to.i, j: to.j };
        const visited = new Set([offsetKey(current)]);

        for (let s = 0; s < steps; s++) {
            if (offsetsEqual(current, goal)) break;

            const neighbors = getHexNeighbors(current);
            if (!neighbors.length) break;

            const goalCenter = offsetToCenter(goal);
            let best = null;
            let bestDist = Number.POSITIVE_INFINITY;
            for (const n of neighbors) {
                const k = offsetKey(n);
                if (visited.has(k)) continue;
                const nc = offsetToCenter(n);
                const d = Math.hypot(nc.x - goalCenter.x, nc.y - goalCenter.y);
                if (d < bestDist) {
                    bestDist = d;
                    best = n;
                }
            }

            if (!best) break;
            path.push(best);
            current = best;
            visited.add(offsetKey(current));
        }

        return path;
    };

    const normalizeDirectPath = (path) => {
        if (!Array.isArray(path) || !path.length) return [];
        return path.map((p) => ({
            i: p?.i ?? p?.x ?? p?.col ?? p?.column ?? p?.c ?? p?.[0],
            j: p?.j ?? p?.y ?? p?.row ?? p?.r ?? p?.[1]
        }))
            .map((o) => ({
                i: Number.isFinite(o.i) ? Math.trunc(o.i) : o.i,
                j: Number.isFinite(o.j) ? Math.trunc(o.j) : o.j
            }))
            .filter(p => Number.isFinite(p.i) && Number.isFinite(p.j));
    };

    // 1) If we can reach the target hex, move only to the target hex.
    // 2) Otherwise, aim for a point ahead of the target's heading by a distance equal to its current speed.
    let canReachTarget = false;
    let stepsToTarget = null;
    const directToTarget = normalizeDirectPath(getDirectPath(startCenter, targetCenter));

    // Prefer Foundry's own path measurement if available.
    const measuredStepsToTarget = measureStepsBetween(startCenter, targetCenter);
    if (Number.isFinite(measuredStepsToTarget)) {
        stepsToTarget = measuredStepsToTarget;
        canReachTarget = measuredStepsToTarget <= maxMove;
    }

    // Otherwise, fall back to direct-path length.
    if (!Number.isFinite(stepsToTarget) && directToTarget.length) {
        const startsWithStart = isValidOffset(startOffset)
            && directToTarget[0].i === startOffset.i
            && directToTarget[0].j === startOffset.j;
        stepsToTarget = directToTarget.length - (startsWithStart ? 1 : 0);
        canReachTarget = stepsToTarget <= maxMove;
    }

    // Last-resort reach check if neither measurePath nor direct path length is available.
    if (!Number.isFinite(stepsToTarget)) {
        const rayToTarget = new foundry.canvas.geometry.Ray(startCenter, targetCenter);
        const approxSteps = Math.ceil((rayToTarget?.distance ?? 0) / gridStep);
        stepsToTarget = approxSteps;
        canReachTarget = approxSteps <= maxMove;
    }

    const goalPt = (() => {
        if (canReachTarget) return targetCenter;

        // Where the target is going next: translate along its heading by its current speed (in grid spaces).
        // Prefer the grid API so this respects hex geometry and scene configuration.
        try {
            const getTranslatedPoint = gridLayer?.getTranslatedPoint?.bind(gridLayer)
                ?? gridLayer?.grid?.getTranslatedPoint?.bind(gridLayer.grid)
                ?? null;
            if (typeof getTranslatedPoint === "function") {
                const dir = compassToFoundryDirection(targetHeading);
                const pt = getTranslatedPoint(targetCenter, dir, targetSpeed);
                if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) return safeGetCenterPoint({ x: pt.x, y: pt.y });
            }
        } catch (_err) {
            // fall through
        }

        // Fallback: Heading vector in Alternity compass space (0° = North).
        const heading = normalizeDegrees(targetHeading);
        const rad = heading * (Math.PI / 180);
        const vx = Math.sin(rad);
        const vy = -Math.cos(rad);
        const pt = {
            x: targetCenter.x + (vx * targetSpeed * gridStep),
            y: targetCenter.y + (vy * targetSpeed * gridStep)
        };
        return safeGetCenterPoint(pt);
    })();

    const ray = new foundry.canvas.geometry.Ray(startCenter, goalPt);
    if (!ray?.distance) return;

    const goalOffset = pixelsToOffset(goalPt.x, goalPt.y);

    const offsetsPath = [];
    const pushOffset = (o) => {
        if (!o || !Number.isFinite(o.i) || !Number.isFinite(o.j)) return;
        const prev = offsetsPath[offsetsPath.length - 1];
        if (prev && prev.i === o.i && prev.j === o.j) return;
        offsetsPath.push({ i: o.i, j: o.j });
    };

    // Prefer Foundry's direct-path helper if it exists.
    const directPath = normalizeDirectPath(getDirectPath(startCenter, goalPt));
    if (directPath.length) {
        const startsWithStart = isValidOffset(startOffset)
            && directPath[0].i === startOffset.i
            && directPath[0].j === startOffset.j;
        const startIndex = startsWithStart ? 1 : 0;
        const steps = canReachTarget ? Math.min(maxMove, stepsToTarget ?? maxMove) : maxMove;
        for (const o of directPath.slice(startIndex, startIndex + steps)) pushOffset(o);
    }

    // Fallback: sample points along the ray at grid-size increments.
    if (!offsetsPath.length) {
        const steps = canReachTarget ? Math.min(maxMove, stepsToTarget ?? maxMove) : maxMove;

        // Hex fallback: build a neighbor-to-neighbor path if Foundry's getDirectPath is unstable.
        if (isHexagonal && isValidOffset(startOffset) && isValidOffset(goalOffset)) {
            console.debug("Auto Move: using hex fallback pathing", { startOffset, goalOffset, steps });
            for (const o of buildGreedyHexPath(startOffset, goalOffset, steps)) pushOffset(o);
        }

        if (offsetsPath.length) {
            // We have a hex path; skip ray sampling.
        }
        else {
        const ux = ray.dx / ray.distance;
        const uy = ray.dy / ray.distance;

        for (let step = 1; step <= steps; step++) {
            const pt = {
                x: startCenter.x + (ux * gridStep * step),
                y: startCenter.y + (uy * gridStep * step)
            };
            if (!inScene(pt)) break;
            pushOffset(pixelsToOffset(pt.x, pt.y));
        }
        }
    }

    // If we can reach the target, guarantee we end exactly on the target offset.
    if (canReachTarget && Number.isFinite(targetOffset?.i) && Number.isFinite(targetOffset?.j)) {
        pushOffset(targetOffset);
    }

    if (!offsetsPath.length) return;
    const waypoints = offsetsPath.map((o) => {
        // TokenDocument.move uses token top-left coordinates.
        // Use the grid-space top-left point for the offset so the token aligns properly.
        const pt = offsetToPixels(o.i, o.j);
        return { x: pt.x, y: pt.y, snapped: true };
    });

    const lastWp = waypoints[waypoints.length - 1];
    if (!lastWp || !Number.isFinite(lastWp.x) || !Number.isFinite(lastWp.y)) return;

    let moved = true;
    if (useWaypointMovement && typeof ordnanceTokenDoc.move === 'function') {
        moved = await ordnanceTokenDoc.move(waypoints, {
            method: 'api',
            autoRotate: true,
            showRuler: true
        });
    } else {
        // Direct update (either setting disabled or move API unavailable)
        moved = !!(await ordnanceTokenDoc.update({ x: lastWp.x, y: lastWp.y }));
    }

    if (moved) {
        const combat = game?.combat;
        const inStarshipCombat = !!(combat
            && (combat.scene?.id === canvas?.scene?.id)
            && (combat.flags?.d100A?.combatType === "starship"));

        const tokenLifetime = ordnanceTokenDoc?.flags?.d100A?.ordnance?.lifetime;
        const hasDurationLifetime = tokenLifetime?.type === "duration" && Number.isFinite(Number(tokenLifetime?.roundsRemaining));

        const actorUpdate = {
            ['system.attributes.speed.value']: newSpeed
        };

        // In starship combat, lifetime is decremented once per Piloting subphase transition.
        // Don't decrement here (it would double-count); just keep the actor duration mirrored.
        if (hasDurationLifetime && inStarshipCombat) {
            const remaining = Number(tokenLifetime.roundsRemaining);
            if (Number.isFinite(remaining) && remaining !== currentDuration) {
                actorUpdate['system.attributes.duration.value'] = remaining;
            }
            await this.actor.update(actorUpdate);
            return;
        }

        // Outside starship combat, this button owns the duration decrement.
        const nextDuration = Math.max(0, currentDuration - 1);
        actorUpdate['system.attributes.duration.value'] = nextDuration;
        await this.actor.update(actorUpdate);

        // Keep migrated token lifetime in sync when not managed by the combat tick.
        if (hasDurationLifetime) {
            try {
                await ordnanceTokenDoc.update({
                    "flags.d100A.ordnance.lifetime.roundsRemaining": nextDuration
                });
            } catch (_err) {
                // Best-effort; ownership/permissions may prevent token flag updates.
            }
        }
    }
}


    async _onAttackClicked(event) {
        event?.preventDefault?.();
        event?.stopPropagation?.();

        if (!this.actor) return;

        const warhead = this.actor.items.find(i => i.type === "ordnanceWarhead") ?? null;
        if (!warhead) {
            ui.notifications?.warn?.("No ordnance warhead installed.");
            return;
        }

        // Ensure the starship-weapon operator dropdown can be populated.
        await this._ensureOrdnanceGunnerActors();

        // If the user hasn't targeted anything, fall back to the ordnance's stored target.
        await this._ensureOrdnanceStoredTargetIsTargeted(event);

        // Delegate to the warhead item's existing attack logic, which uses the Starship Weapon dialog
        // for starship/ordnance actors and applies the selected operator's skills.
        return warhead.rollAttack({ event });
    }

    async _ensureOrdnanceStoredTargetIsTargeted(event) {
        try {
            const currentTargets = game?.user?.targets;
            const hasUserTargets = currentTargets && (currentTargets.size ?? currentTargets.ids?.length ?? 0) > 0;
            if (hasUserTargets) return;

            const tokenId = this.actor?.system?.targetData?._id;
            if (!tokenId) return;

            const token = canvas?.tokens?.get?.(tokenId)
                ?? canvas?.scene?.tokens?.get?.(tokenId)?.object
                ?? null;

            if (!token?.setTarget) return;
            token.setTarget(true, { releaseOthers: true });
        } catch (_err) {
            // Best-effort; if targeting fails, the attack roll can still proceed using manual targets.
        }
    }

    async _ensureOrdnanceGunnerActors() {
        try {
            const crew = this.actor?.system?.crew;
            if (!crew) return;
            if (crew.useNPCCrew) return;

            const gunner = crew.gunner ?? {};
            const rawActors = Array.isArray(gunner.actors) ? gunner.actors : [];

            const extractId = (a) => {
                if (!a) return null;
                if (typeof a === "string") return a;
                return a.id ?? a._id ?? null;
            };

            // If the crew structure only has actorIds (or actors are stored as strings), create the
            // expected array-of-{_id} shape that the starship weapon dialog uses.
            const actorIds = [];

            for (const a of rawActors) {
                const id = extractId(a);
                if (id) actorIds.push(id);
            }

            if (!actorIds.length && Array.isArray(gunner.actorIds)) {
                for (const id of gunner.actorIds) {
                    if (typeof id === "string" && id) actorIds.push(id);
                }
            }

            // Nothing to fix.
            if (!actorIds.length) return;

            // If we already have objects with _id, we're good.
            const alreadyObjects = rawActors.length > 0 && typeof rawActors[0] === "object";
            const hasIdsOnObjects = alreadyObjects && rawActors.some((a) => a && (a.id || a._id));
            if (rawActors.length > 0 && hasIdsOnObjects) return;

            if (!this.actor.isOwner) return;
            const sanitized = actorIds.map((id) => ({ _id: id }));
            await this.actor.update({ "system.crew.gunner.actors": sanitized });
        } catch (_err) {
            // Best-effort; if this fails, the dialog will warn about missing gunners.
        }
    }

    async _onDamageClicked(event) {
        event.preventDefault();

        if (this.actor.system.attributes.damage.value) {
            const rollContext = new RollContext();
            rollContext.addContext("main", this.actor);
            rollContext.setMainContext("main");
    
            this.actor.setupRollContexts(rollContext);
    
            const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Damage", {name: this.actor.name});
            return Diced100.damageRoll({
                event: event,
                rollContext: rollContext,
                parts: [{ formula: this.actor.system.attributes.damage.value }],
                title: name,
                flavor: name,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                dialogOptions: {
                    left: event ? event.clientX - 80 : null,
                    top: event ? event.clientY - 80 : null
                },
                onClose: (roll, formula, finalFormula, isCritical) => {
                    if (roll) {
                        Hooks.callAll("damageRolled", {actor: this.actor, item: null, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: null});
                    }
                }
            });
        } else {
            ui.notifications.warn(game.i18n.format("SFRPG.HazardSheet.Notifications.NoDamage", {name: this.actor.name}));
        }
    }

    _performRoll(event, rollName, rollValue, isAttack) {
        const rollContext = new RollContext();
        rollContext.addContext("main", this.actor);
        rollContext.setMainContext("main");

        this.actor.setupRollContexts(rollContext);

        return Diced100.attackRoll({
            event: event,
            rollContext: rollContext,
            parts: [rollValue],
            title: rollName,
            flavor: null,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                left: event ? event.clientX - 80 : null,
                top: event ? event.clientY - 80 : null
            },
            onClose: (roll, formula, finalFormula) => {
                if (roll && isAttack) {
                    Hooks.callAll("attackRolled", {actor: this.actor, item: null, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: null});
                }
            }
        });
    }
}