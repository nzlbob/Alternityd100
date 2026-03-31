//Dont USE Integrate with Actor-inventory
import { d100A } from "../d100Aconfig.js";
import { RPC } from "../rpc.js";

import { value_equals } from "../utils/value_equals.js";
import { generateUUID, measureDistance } from "../utilities.js";
import { d100Actor } from "../d100actor.js";
import {findTokenById,getCanvas} from "./item.js";

const ORDNANCE_RPC_ADD_COMBATANT = "addOrdnanceTokenToCombatant";
const ORDNANCE_COMPONENT_TYPES = new Set(["ordnanceWarhead", "ordnancePropulsion", "ordnanceGuidance"]);
let _ordnanceRpcRegistered = false;

function registerOrdnanceRpcHandlers() {
  if (_ordnanceRpcRegistered) return;
  _ordnanceRpcRegistered = true;

  try {
    RPC.registerCallback(ORDNANCE_RPC_ADD_COMBATANT, "gm", async (message) => {
      try {
        const payload = message?.payload ?? {};
        const combatId = payload?.combatId;
        const sceneId = payload?.sceneId;
        const tokenId = payload?.tokenId;

        if (!combatId || !sceneId || !tokenId) return;

        const combat = game.combats?.get?.(combatId) ?? null;
        if (!combat) return;

        if (combat.combatants?.some?.((c) => c?.tokenId === tokenId)) return;

        const scene = game.scenes?.get?.(sceneId) ?? combat.scene ?? null;
        if (!scene) return;
        const tokenDoc = scene.tokens?.get?.(tokenId) ?? null;
        if (!tokenDoc) return;

        const createData = [{
          tokenId: tokenId,
          sceneId: scene.id,
          actorId: tokenDoc.actorId,
          hidden: tokenDoc.hidden ?? false,
          flags: { d100A: { crewRole: "ordnance" } }
        }];

        await combat.createEmbeddedDocuments("Combatant", createData);
      } catch (err) {
        console.warn("RPC addOrdnanceTokenToCombatant failed", err);
      }
    });
  } catch (_err) {
    // Best-effort; if registration fails, GM-only direct create will still work.
  }
}

registerOrdnanceRpcHandlers();

async function maybeAddOrdnanceTokenToActiveCombat({ ordnanceTokenDoc, firingItem, firingToken }) {
  const combat = game.combat ?? null;
  if (!combat) return;

  const sceneId = canvas?.scene?.id ?? null;
  if (!sceneId || combat.scene?.id !== sceneId) return;

  const ordTokenId = ordnanceTokenDoc?.id ?? null;
  if (!ordTokenId) return;
  if (combat.combatants?.some?.((c) => c?.tokenId === ordTokenId)) return;

  const sourceTokenId = firingToken?.id ?? firingToken?.document?.id ?? null;
  const sourceActorId = firingItem?.actor?.id ?? null;

  // Only add ordnance if the firing ship/operator is already in this combat.
  const sourceInCombat = combat.combatants?.some?.((c) =>
    (sourceTokenId && c?.tokenId === sourceTokenId) || (sourceActorId && c?.actorId === sourceActorId)
  );
  if (!sourceInCombat) return;

  if (game.user?.isGM) {
    await combat.createEmbeddedDocuments("Combatant", [{
      tokenId: ordTokenId,
      sceneId,
      actorId: ordnanceTokenDoc?.actorId ?? ordnanceTokenDoc?.actor?.id,
      hidden: ordnanceTokenDoc?.hidden ?? false,
      flags: { d100A: { crewRole: "ordnance" } }
    }]);
    return;
  }

  // Non-GM: ask an active GM to add the combatant.
  RPC.sendMessageTo("gm", ORDNANCE_RPC_ADD_COMBATANT, {
    combatId: combat.id,
    sceneId,
    tokenId: ordTokenId
  });
}

async function getOrCreateBaseOrdnanceActor() {
  const settingKey = "ordnanceBaseActorId";
  let actorId = "";
  try {
    actorId = String(game.settings.get("Alternityd100", settingKey) ?? "").trim();
  } catch (_err) {
    actorId = "";
  }

  const byId = actorId ? game.actors?.get?.(actorId) : null;
  if (byId && (byId.type === "ordnance" || byId.system?.type === "ordnance")) {
    await sanitizeBaseOrdnanceActor(byId);
    return byId;
  }

  // Heuristic search: prefer an ordnance actor explicitly flagged or named.
  const candidates = (game.actors ?? []).filter(a => a?.type === "ordnance" || a?.system?.type === "ordnance");
  const flagged = candidates.find(a => a?.flags?.d100A?.isBaseOrdnanceActor === true) ?? null;
  const named = candidates.find(a => String(a?.name ?? "").toLowerCase() === "base ordnance") ?? null;
  const first = flagged ?? named ?? candidates[0] ?? null;
  if (first) {
    await sanitizeBaseOrdnanceActor(first);
    try {
      await game.settings.set("Alternityd100", settingKey, first.id);
    } catch (_err) {
      // ignore
    }
    return first;
  }

  // Create it (world-level). Keep it minimal; per-shot data lives on token flags/delta.
  const created = await d100Actor.create({
    name: "Base Ordnance",
    type: "ordnance",
    img: "systems/Alternityd100/images/Ships/ordnance/missile.png",
    prototypeToken: { actorLink: false }
  });

  try {
    await created.setFlag("d100A", "isBaseOrdnanceActor", true);
    await game.settings.set("Alternityd100", settingKey, created.id);
  } catch (_err) {
    // ignore
  }
  await sanitizeBaseOrdnanceActor(created);
  return created;
}

async function sanitizeBaseOrdnanceActor(actor) {
  if (!actor || actor.isToken) return;

  const itemIdsToDelete = actor.items
    ?.filter((item) => ORDNANCE_COMPONENT_TYPES.has(item?.type))
    ?.map((item) => item.id)
    ?? [];

  if (!itemIdsToDelete.length) return;

  try {
    await actor.deleteEmbeddedDocuments("Item", itemIdsToDelete);
  } catch (err) {
    console.warn("sanitizeBaseOrdnanceActor: failed to remove embedded ordnance items from base actor", err);
  }
}

function normalizeOrdnanceKind(raw) {
  const kind = String(raw ?? "").trim().toLowerCase();
  if (["missile", "torpedo", "bomb", "mine"].includes(kind)) return kind;
  return kind ? kind : "other";
}

function buildTokenOwnershipFromShip(shipActor) {
  // Desired: ship owner (all crew actor players). Fallback: ship actor owners.
  const ownerLevel = CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;

  const userIds = new Set();
  const crew = shipActor?.system?.crew ?? null;

  const collectActorOwners = (actorId) => {
    const a = actorId ? game.actors?.get?.(actorId) : null;
    if (!a?.ownership) return;
    for (const [uid, lvl] of Object.entries(a.ownership)) {
      if (Number(lvl) >= ownerLevel) userIds.add(uid);
    }
  };

  if (crew) {
    for (const job of Object.values(crew)) {
      const actorIds = job?.actorIds;
      if (Array.isArray(actorIds)) actorIds.forEach(collectActorOwners);
    }
  }

  if (userIds.size === 0 && shipActor?.ownership) {
    for (const [uid, lvl] of Object.entries(shipActor.ownership)) {
      if (Number(lvl) >= ownerLevel) userIds.add(uid);
    }
  }

  const ownership = {};
  for (const uid of userIds) ownership[uid] = ownerLevel;
  return { gunnerUserIds: Array.from(userIds), ownership };
}
 // export function getCanvas() {


//export async function loadLauncherOrdnance(targetActor, itemToAdd, quantity, targetItem = null, targetItemStorageIndex = null) {
    /**
    * loads a Launcher with dropped Ordnance
    * 
    * @param {rawItemDataa} object type: "Item" , uuid : "Item.G7yYsB1GrbrJW6lV"
    * @param {launchersheet} data The data sheet this was gropped on to
    * @param {loadAll} Boolean Load the complete launcher
    */

export async function loadLauncherOrdnance(rawItemDataa,launchersheet,loadAll, targetActor, itemToAdd, quantity, targetItem) {    
   
    

    let tip = ""
        let rawItemData = foundry.utils.duplicate(rawItemDataa);


  //console.log("Launcher", rawItemDataa, rawItemData);
       
        

        tip = tip.concat("Accuracy: ", rawItemData.system.accur,
        "<br />Firepower: ", rawItemData.system.damage.type,"/", rawItemData.system.firepower,
        "<br />Accel: ", rawItemData.system.accel," End: ", rawItemData.system.end,
        "<br />Firepower: ", rawItemData.system.damage.type,"/", rawItemData.system.firepower,
        "<br />Warhead: ", rawItemData.system.warName," PL", rawItemData.system.warTech,
        "<br />Damage: ", rawItemData.system.damage.ord.dice," ",rawItemData.system.damage.ord.type," / ",rawItemData.system.damage.goo.dice," ",rawItemData.system.damage.goo.type," / ", rawItemData.system.damage.ama.dice," ",rawItemData.system.damage.ama.type,
        "<br />Cost: ", rawItemData.system.price
        
        
        );

       // console.log("Launcher", rawItemData,"tip",tip,launchersheet );
        rawItemData.system.tooltip = tip;  
     //   console.log("Launcher", rawItemData);
        


   
    let ammoData =[]

    if(loadAll){
        let numOrdn = Math.floor(launchersheet.item.system.capacity.max /rawItemData.system.size)
        for(let k=0; k<numOrdn; k++)
        {
            ammoData.push(rawItemData); 
        }
    }
    
    else{
        ammoData = launchersheet.item.system.ordnance
        ammoData.push(rawItemData); 
    } 
  //   console.log("newOrdnance",rawItemData,ammoData,launchersheet.item.system)
     await launchersheet.item.update({
         "system.ordnance": ammoData
     }).then(launchersheet.render(false));
  // console.log("THIS" ,this)
   /*
    if (!ActorItemHelper.IsValidHelper(targetActor)) return null;

    if (targetItem && targetItem === itemToAdd) {
        return itemToAdd;
    }

    const newItemData = foundry.utils.duplicate(itemToAdd);
    newItemData.data.quantity = quantity;

    let desiredParent = null;
    if (targetItem) {
        if (acceptsItem(targetItem, itemToAdd, targetActor.actor)) {
            desiredParent = targetItem;
        } else if (targetItem.name === itemToAdd.name && !containsItems(targetItem) && !containsItems(itemToAdd)) {
            const targetItemNewQuantity = Number(targetItem.system.quantity) + quantity;
            await targetActor.updateItem(targetItem._id, {'system.quantity': targetItemNewQuantity});
            return targetItem;
        } else {
            desiredParent = targetActor.findItem(x => x.data.container?.contents && x.data.container.contents.find(y => y.id === targetItem._id));
        }
    }
    
    let addedItem = null;
    if (targetActor.isToken) {
        const created = await Entity.prototype.createEmbeddedDocuments.call(targetActor.actor, "Item", [newItemData], {temporary: true});
        const items = foundry.utils.duplicate(targetActor.actor.data.items).concat(created instanceof Array ? created : [created]);
        await targetActor.token.update({"actorData.items": items}, {});
        addedItem = targetActor.getItem(created._id);
    } else {
        const result = await targetActor.createEmbeddedDocuments("Item", [newItemData]);
        addedItem = targetActor.getItem(result._id);
    }

    if (desiredParent) {
        let newContents = foundry.utils.duplicate(desiredParent.system.container.contents || []);
        newContents.push({id: addedItem._id, index: targetItemStorageIndex || 0});
        await targetActor.updateItem(desiredParent._id, {"data.container.contents": newContents});
    }
*/
console.log("Launcher", rawItemData,"tip",tip,launchersheet );

    return true; //addedItem;
}
//export async function loadLauncherOrdnance(targetActor, itemToAdd, quantity, targetItem = null, targetItemStorageIndex = null) {
    export async function unloadLauncherOrdnance(tube,launcher, targetActor, itemToAdd, quantity, targetItem) {    
    
    
        let ammoData = launcher.system.ordnance
        
        delete ammoData[tube];
        const arrFiltered = ammoData.filter(el => {
            return el != null && el != '';
          });


     //    console.log("newOrdnance",ammoData,launcher.system,arrFiltered)
         await launcher.update({
             "system.ordnance": arrFiltered
         }).then(launcher.sheet.render(false));
       //console.log("THIS" ,this)
 
        return true; //addedItem;
    }
/**
 * Removes the specified quantity of a given item from an actor.
 * 
 * @param {ActorItemHelper} sourceActor Actor that owns the item.
 * @param {Item} item Item to remove.
 * @param {Number} quantity Number of items to remove, if quantity is greater than or equal to the item quantity, the item will be removed from the actor.
 * @param {Boolean} recursive (Optional) Recursively remove child items too? Setting this to false puts all items into the deleted item's root. Defaults to false.
 * @returns {Boolean} Returns whether or not an update or removal took place.
 */
export async function removeItemFromActorAsync(sourceActor, itemToRemove, quantity, recursive = false) {
    if (!ActorItemHelper.IsValidHelper(sourceActor) || !itemToRemove) return false;

    const sourceItemQuantity = itemToRemove.system.quantity;
    const newItemQuantity = sourceItemQuantity - quantity;

    if (newItemQuantity < 1) {
        return sourceActor.deleteItem(itemToRemove);
    } else {
        return sourceActor.updateItem(itemToRemove._id, {'system.quantity': newItemQuantity });
    }
}

/**
     * Place an attack roll for a starship using an item.
     * @param {Object} options Options to pass to the attack roll
     * 
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     */
export async function rollStarshipLauncherAttack(item, options, targetData, actorToken, weapo) {
  const ordnance = foundry.utils.duplicate(item?.system?.ordnance?.[0] ?? null);
  if (!ordnance) {
    ui.notifications?.warn?.("No ordnance loaded in launcher.");
    return null;
  }

  // Spawn location: random adjacent hex-like offset.
  const dir = Math.floor(Math.random() * 6);
  let locx = actorToken.x;
  let locy = actorToken.y;
  if (dir === 0) { locx += 87.5; locy -= 50; }
  if (dir === 1) { locx += 0; locy -= 100; }
  if (dir === 2) { locx -= 87.5; locy -= 50; }
  if (dir === 3) { locx -= 87.5; locy += 50; }
  if (dir === 4) { locx += 0; locy += 100; }
  if (dir === 5) { locx += 87.5; locy += 50; }

  // Consume one loaded ordnance (tube 0 for now).
  await unloadLauncherOrdnance(0, item);

  // Migration path: spawn token from the single base ordnance actor.
  try {
    const baseActor = await getOrCreateBaseOrdnanceActor();
    if (!baseActor) throw new Error("Base ordnance actor not available");

    const instanceId = `ord-${randomID(6)}`;
    const kind = normalizeOrdnanceKind(ordnance?.system?.ammunitionType);
    const isMine = kind === "mine";

    const combat = game.combat;
    const firedAtRound = Number(combat?.round ?? combat?.roundB ?? 0);
    const firedAtPhase = Number(combat?.flags?.d100A?.phase ?? 0);
    const firedAtAction = Number(combat?.flags?.d100A?.action ?? 0);

    const { gunnerUserIds, ownership } = buildTokenOwnershipFromShip(item.actor);

    const targetTokenDoc = targetData?.[0]?.token ?? null;
    const targetTokenId = targetData?.[0]?._id ?? targetTokenDoc?.id ?? null;
    const targetActorId = targetTokenDoc?.actorId ?? targetTokenDoc?.actor?.id ?? null;

    const roundsRemaining = Math.max(0, Number(ordnance?.system?.end ?? 0) || 0);

    const ordnanceFlags = {
      instanceId,
      kind,
      mode: "active",
      source: {
        shipActorId: item.actor?.id ?? "",
        shipTokenId: actorToken?.id ?? "",
        launcherItemId: item.id,
        gunnerUserIds,
        firedAtRound,
        firedAtPhase,
        firedAtAction
      },
      lifetime: isMine
        ? { type: "endOfCombat" }
        : { type: "duration", roundsRemaining: Number.isFinite(roundsRemaining) ? roundsRemaining : 0 },
      motion: {
        speed: Math.max(0, Number(ordnance?.system?.speed ?? 0) || 0),
        accel: Math.max(0, Number(ordnance?.system?.basicAcceleration ?? ordnance?.system?.accel ?? 0) || 0),
        isFTL: Boolean(ordnance?.system?.isFTL ?? false),
        ftlRange: ordnance?.system?.ftlRange ?? null
      },
      guidance: {
        sensorType: ordnance?.system?.sensorType ?? "",
        sensorMode: ordnance?.system?.sensorMode ?? "",
        targetingStep: Number(ordnance?.system?.targetingStep ?? 0) || 0,
        allowTargeting: Boolean(ordnance?.system?.allowTargeting ?? true)
      },
      warhead: {
        damageType: ordnance?.system?.damage?.type ?? "",
        firepower: String(ordnance?.system?.firepower ?? ordnance?.system?.firepowerN ?? "").trim(),
        damageOrd: String(ordnance?.system?.damage?.ord?.dice ?? "").trim(),
        damageGoo: String(ordnance?.system?.damage?.goo?.dice ?? "").trim(),
        damageAma: String(ordnance?.system?.damage?.ama?.dice ?? "").trim(),
        progressLevel: ordnance?.system?.progressLevel ?? ordnance?.system?.warProgressLevel ?? ""
      },
      target: {
        tokenId: targetTokenId,
        actorId: targetActorId,
        range: null,
        bearing: null
      },
      ui: {
        label: ordnance?.name ?? "Ordnance",
        icon: ordnance?.img ?? null,
        size: ordnance?.system?.size ?? null
      }
    };

    const baseTokenDoc = await baseActor.getTokenDocument({
      x: locx,
      y: locy,
      hidden: false,
      actorLink: false,
      scale: 0.25
    });

    const tokenData = baseTokenDoc.toObject();
    tokenData.name = `${ordnance.name}-${randomID(3)}`;

    tokenData.texture = tokenData.texture ?? {};
    if (ordnance?.img) tokenData.texture.src = ordnance.img;

    tokenData.flags = tokenData.flags ?? {};
    tokenData.flags.d100A = tokenData.flags.d100A ?? {};
    tokenData.flags.d100A.ordnance = ordnanceFlags;

    tokenData.delta = tokenData.delta ?? {};
    // IMPORTANT: Do not replace the base ordnance actor's system data with the launcher item system.
    // Tokens spawned from the base ordnance actor must keep the ordnance-actor-shaped schema
    // (e.g. system.attributes.duration.value) so the ordnance sheet and movement logic keep working.
    tokenData.delta.system = tokenData.delta.system ?? {};

    // Mirror ordnance motion/lifetime into the ordnance actor's standard attribute fields.
    foundry.utils.setProperty(tokenData.delta.system, "attributes.speed.value", ordnanceFlags.motion.speed);
    foundry.utils.setProperty(tokenData.delta.system, "attributes.accel.value", ordnanceFlags.motion.accel);
    if (ordnanceFlags.lifetime?.type === "duration") {
      foundry.utils.setProperty(tokenData.delta.system, "attributes.duration.value", ordnanceFlags.lifetime.roundsRemaining);
    }

    // Keep a few legacy fields for compatibility with existing UI/workflows.
    // (These are extra keys on the ordnance actor system; they should not overwrite attributes.)
    tokenData.delta.system.itemId = ordnance._id;
    tokenData.delta.system.launchedFromId = item.actor?.id ?? null;
    tokenData.delta.system.crew = item.actor?.system?.crew ?? null;
    tokenData.delta.system.skills = item.actor?.system?.skills ?? null;
    tokenData.delta.system.targetData = targetData?.[0] ?? null;
    tokenData.delta.system.ordnanceType = ordnance?.system?.ordnanceType ?? null;
    console.log("Ordnance", ordnance, "targetData", tokenData);
    tokenData.delta.ownership = ownership;

    // Provide component items on the token's synthetic actor.
    // This preserves existing ordnance sheet and attack logic (it expects embedded ordnance* items)
    // without creating per-shot Actors.
    const tokenEmbeddedItems = [];
    tokenEmbeddedItems.push({
      _id: randomID(16),
      img: ordnance.img,
      name: ordnance?.system?.warName || "Warhead",
      type: "ordnanceWarhead",
      system: {
        type: "ordnanceWarhead",
        damage: ordnance?.system?.damage ?? {},
        range: ordnance?.system?.range ?? {},
        firepower: ordnance?.system?.firepower,
        firepowerN: ordnance?.system?.firepowerN,
        skill: "weapo",
        tech: ordnance?.system?.warTech,
        accuracy: ordnance?.system?.warAccur,
        progressLevel: ordnance?.system?.warProgressLevel,
        weaponType: ordnance?.system?.ammunitionType || kind || "missile",
        warheadSize: ordnance?.system?.warwarhead || 1,
        targetLockBonus: {}
      }
    });
    tokenEmbeddedItems.push({
      _id: randomID(16),
      img: ordnance.img,
      name: ordnance?.system?.propName || "Propulsion",
      type: "ordnancePropulsion",
      system: {
        type: "ordnancePropulsion",
        progressLevel: ordnance?.system?.propProgressLevel,
        accuracy: ordnance?.system?.propAcc,
        propulsionPrice: ordnance?.system?.price,
        propulsionTech: ordnance?.system?.tech,
        size: ordnance?.system?.size || 1,
        warheadSize: ordnance?.system?.warhead || 1,
        accel: { base: ordnanceFlags.motion.accel ?? (ordnance?.system?.basicAcceleration || 1) },
        duration: { base: roundsRemaining },
        isEnabled: true,
        targetLockBonus: {}
      }
    });
    tokenEmbeddedItems.push({
      _id: randomID(16),
      img: ordnance.img,
      name: ordnance?.system?.guidName || "Guidance",
      type: "ordnanceGuidance",
      system: {
        type: "ordnanceGuidance",
        accuracy: ordnance?.system?.guidanceAccur,
        sensorMode: ordnance?.system?.sensorMode,
        sensorType: ordnance?.system?.sensorType,
        guidancePrice: ordnance?.system?.price,
        guidanceTech: ordnance?.system?.tech,
        targetingStep: Number(ordnance?.system?.targetingStep ?? 0) || 0,
        allowTargeting: Boolean(ordnance?.system?.allowTargeting ?? true),
        scanTargets: [],
        mount: { arc: {} }
      }
    });

    tokenData.delta.items = tokenEmbeddedItems;

    canvas.scene.activate();
    const cls = getDocumentClass("Token");
    const a = await cls.create(tokenData, { parent: canvas.scene });

    // If we fired during an active combat, ensure the ordnance participates as a combatant.
    try {
      await maybeAddOrdnanceTokenToActiveCombat({
        ordnanceTokenDoc: a,
        firingItem: item,
        firingToken: actorToken
      });
    } catch (_err) {
      // Best-effort.
    }

    // Some Foundry versions may ignore `delta.items` at Token creation time.
    // Re-apply the token delta directly instead of creating embedded actor items,
    // which can leak onto the shared base ordnance actor.
    try {
      if (a) {
        const deltaTypes = new Set();
        const mergedByType = new Map();
        const storeByType = (entry) => {
          const itemType = entry?.type ?? entry?.system?.type ?? null;
          if (!ORDNANCE_COMPONENT_TYPES.has(itemType) || mergedByType.has(itemType)) return;

          const normalized = typeof entry?.toObject === "function"
            ? entry.toObject()
            : foundry.utils.duplicate(entry);
          mergedByType.set(itemType, normalized);
        };

        const deltaItems = a?.delta?.items;
        if (Array.isArray(deltaItems)) {
          deltaItems.forEach((entry) => {
            const itemType = entry?.type ?? entry?.system?.type ?? null;
            if (itemType) deltaTypes.add(itemType);
            storeByType(entry);
          });
        } else if (deltaItems?.forEach) {
          deltaItems.forEach((entry) => {
            const itemType = entry?.type ?? entry?.system?.type ?? null;
            if (itemType) deltaTypes.add(itemType);
            storeByType(entry);
          });
        }

        tokenEmbeddedItems.forEach(storeByType);

        if (deltaTypes.size !== mergedByType.size) {
          const mergedItems = Array.from(mergedByType.values());
          await a.update({ "delta.items": mergedItems });
        }
      }
    } catch (err2) {
      console.warn("rollStarshipLauncherAttack: failed to seed ordnance component items on synthetic actor", err2);
    }

    const targetToken = targetData?.[0]?.token;
    if (a && targetToken) {
      const RandB = await rangeToTarget(a, targetToken);
      targetData[0].range = RandB.range;
      targetData[0].bearing = RandB.bearing;

      if (a?.object?.rotate) a.object.rotate(Math.normalizeDegrees(RandB.bearing - 180));

      await a.update({
        "flags.d100A.ordnance.target.range": RandB.range,
        "flags.d100A.ordnance.target.bearing": RandB.bearing,
        "delta.system.targetData": targetData[0]
      });
    }

    return a;
  } catch (err) {
    console.error("rollStarshipLauncherAttack: base-actor spawn failed; falling back to legacy actor spawn", err);
  }

  // Legacy fallback: create or reuse a dedicated ordnance Actor and embed component items.
  let missile = {};
  const itemsFiltered = game.actors.filter(el => el.system.itemId ? el.system.itemId == ordnance._id : false);
  if (itemsFiltered.length === 0) {
    missile = await d100Actor.create({
      name: ordnance.name + "-" + randomID(3),
      type: "ordnance",
      img: ordnance.img,
      system: ordnance.system,
      weapo: {},
      id: randomID(16),
      prototypeToken: { appendNumber: true }
    });
    missile.system.itemId = ordnance._id;
  } else {
    missile = itemsFiltered[0];
  }

  const newItemData = [];
  newItemData.push({
    img: ordnance.img,
    name: ordnance.system.warName || "Warhead",
    type: "ordnanceWarhead",
    "system.type": "ordnanceWarhead",
    "system.damage": ordnance.system.damage,
    "system.range": ordnance.system.range,
    "system.firepower": ordnance.system.firepower,
    "system.firepowerN": ordnance.system.firepowerN,
    "system.skill": "weapo",
    "system.tech": ordnance.system.warTech,
    "system.accuracy": ordnance.system.warAccur,
    "system.progressLevel": ordnance.system.warProgressLevel,
    "system.weaponType": ordnance.system.ammunitionType || "missile",
    "system.warheadSize": ordnance.system.warwarhead || 1
  });
  newItemData.push({
    img: ordnance.img,
    name: ordnance.system.propName || "Propulsion",
    type: "ordnancePropulsion",
    "system.type": "ordnancePropulsion",
    "system.progressLevel": ordnance.system.propProgressLevel,
    "system.accuracy": ordnance.system.propAcc,
    "system.propulsionPrice": ordnance.system.price,
    "system.propulsionTech": ordnance.system.tech,
    "system.propulsionAcc": ordnance.system.tech,
    "system.size": ordnance.system.size || 1,
    "system.warheadSize": ordnance.system.warhead || 1,
    "system.accel.base": ordnance.system.basicAcceleration || 1,
    "system.duration.base": ordnance.system.end || 1,
    "system.targetLockBonus": {}
  });
  newItemData.push({
    img: ordnance.img,
    name: ordnance.system.guidName || "Guidance",
    type: "ordnanceGuidance",
    "system.type": "ordnanceGuidance",
    "system.accuracy": ordnance.system.guidanceAccur,
    "system.sensorMode": ordnance.system.sensorMode,
    "system.sensorType": ordnance.system.sensorType,
    "system.guidancePrice": ordnance.system.price,
    "system.guidanceTech": ordnance.system.tech
  });

  await missile.createEmbeddedDocuments("Item", newItemData);

  const td = await missile.getTokenDocument({
    x: locx,
    y: locy,
    hidden: false,
    actorLink: false,
    scale: 0.25
  });

  canvas.scene.activate();
  const cls = getDocumentClass("Token");
  const a = await cls.create(td, { parent: canvas.scene });

  // If we fired during an active combat, ensure the ordnance participates as a combatant.
  try {
    await maybeAddOrdnanceTokenToActiveCombat({
      ordnanceTokenDoc: a,
      firingItem: item,
      firingToken: actorToken
    });
  } catch (_err) {
    // Best-effort.
  }

  await a.actor.update({
    name: td.name,
    "system.launchedFrom": item.actor,
    "system.crew": item.actor.system.crew,
    "system.skills": item.actor.system.skills
  });

  const targetToken = targetData?.[0]?.token;
  if (targetToken) {
    const RandB = await rangeToTarget(a, targetToken);
    targetData[0].range = RandB.range;
    targetData[0].bearing = RandB.bearing;
    if (a?.object?.rotate) a.object.rotate(Math.normalizeDegrees(RandB.bearing - 180));
    await a.actor.update({ "system.targetData": targetData[0] });
  }

  return a;
}

/**
 * Compute range (grid distance) and compass bearing from source token to target token.
 */
export async function rangeToTarget(sourceToken, targetToken) {
  function radians_to_degrees(radians) {
    let compass = Math.round(radians * (180 / Math.PI));
    if (compass >= 90) compass -= 90;
    else compass += 270;
    return Math.normalizeDegrees(compass);
  }

  const out = {};
  out.range = Math.ceil(measureDistance({ x: sourceToken.x, y: sourceToken.y }, { x: targetToken.x, y: targetToken.y }));

  const deltax = sourceToken.x - targetToken.x;
  const deltay = sourceToken.y - targetToken.y;
  const theta = Math.atan2(deltay, deltax);
  out.bearing = radians_to_degrees(theta);

  console.log("\n--------Missile Token---------", theta, deltay, deltax, sourceToken, targetToken, out);
  return out;
}
 /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle dropping of Actor data onto the Scene canvas
   * @private
   
   async _onDropActorData(event, data) {

    // Ensure the user has permission to drop the actor and create a Token
    if ( !game.user.can("TOKEN_CREATE") ) {
      return ui.notifications.warn(`You do not have permission to create new Tokens!`);
    }

    // Acquire dropped data and import the actor
    let actor = await Actor.implementation.fromDropData(data);
    if ( !actor.isOwner ) {
      return ui.notifications.warn(`You do not have permission to create a new Token for the ${actor.name} Actor.`);
    }
    if ( actor.compendium ) {
      const actorData = game.actors.fromCompendium(actor);
      actor = await Actor.implementation.create(actorData);
    }

    // Prepare the Token data
    const td = await actor.getTokenData({x: data.x, y: data.y, hidden: event.altKey});

    // Bypass snapping
    if ( event.shiftKey ) td.update({
      x: td.x - (td.width * canvas.grid.w / 2),
      y: td.y - (td.height * canvas.grid.h / 2)
    });

    // Otherwise snap to nearest vertex, adjusting for large tokens
    else {
      const hw = canvas.grid.w/2;
      const hh = canvas.grid.h/2;
      td.update(canvas.grid.getSnappedPosition(td.x - (td.width*hw), td.y - (td.height*hh)));
    }

    // Validate the final position
    if ( !canvas.dimensions.rect.contains(td.x, td.y) ) return false;

    // Submit the Token creation request and activate the Tokens layer (if not already active)
    this.activate();
    const cls = getDocumentClass("Token");
    return cls.create(td, {parent: canvas.scene});
  }

   -------------------------------------------- */
