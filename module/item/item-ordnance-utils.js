//Dont USE Integrate with Actor-inventory

import { SFRPG } from "../config.js";
import { d100A } from "../d100Aconfig.js";
import { RPC } from "../rpc.js";

import { value_equals } from "../utils/value_equals.js";
import { generateUUID } from "../utilities.js";
import { d100Actor } from "../d100actor.js";
import {findTokenById,getCanvas} from "./item.js";
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
        let rawItemData = duplicate(rawItemDataa);


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

    const newItemData = duplicate(itemToAdd);
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
        const items = duplicate(targetActor.actor.data.items).concat(created instanceof Array ? created : [created]);
        await targetActor.token.update({"actorData.items": items}, {});
        addedItem = targetActor.getItem(created._id);
    } else {
        const result = await targetActor.createEmbeddedDocuments("Item", [newItemData]);
        addedItem = targetActor.getItem(result._id);
    }

    if (desiredParent) {
        let newContents = duplicate(desiredParent.system.container.contents || []);
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
 export async function rollStarshipLauncherAttack(item,options,targetData,actorToken) {
  let ordnance = duplicate(item.system.ordnance[0])
  let locx = actorToken.x + 100;
  let locy = actorToken.y + 100;
  let missile ={};
  unloadLauncherOrdnance(0,item);
  const itemsFiltered = game.actors.filter(el => {
   // el.system.itemId? console.log("is",el.system.itemId, ordnance._id): 
   console.log("not",el.name,el.id,ordnance)
    return el.system.itemId? el.system.itemId == ordnance._id : false;
  });
  //console.log("\n Missile----",missile,ordnance,itemsFiltered)
if (itemsFiltered.length==0){
   missile = await d100Actor.create({
      name: ordnance.name,
      type: "ordnance",
      img: ordnance.img,
      system:ordnance.system,
      id:randomID(16),
    });
    missile.system.itemId = ordnance._id;
    //console.log("\n Missile----",missile)
  }
 else {missile = itemsFiltered[0];
  //console.log("\n Missile----",missile)
  }
  console.log("_rollStarshipLauncherAttack\n",ordnance,item,missile)
  /*
  var attributes = Object.keys(ordnance.system)
    //console.log(attributes)
    for (var i=0;i<attributes.length;i++){
      if ( !missile.system.hasOwnProperty(attributes[i] ) ) {

        //console.log(attributes[i] ,ordnance.data[attributes[i]]);  
          if ( !["id","_id"].includes( attributes[i]) ) {
      //console.log(attributes[i] ,ordnance.data[attributes[i]]  )
      missile.system[attributes[i]] = ordnance.system[attributes[i]]
      }
//5wojbj5jdzy7z1n6
    }
  }


  */
    console.log("_rollStarshipLauncherAttack\n",ordnance,item,missile)



    const td = await missile.getTokenDocument({
      x: locx, 
      y: locy, 
      hidden: false,
      actorLink: false,
      scale:0.25,
      //_id:randomID(16),
  });
    canvas.scene.activate();
    const cls = getDocumentClass("Token");
    let a = await cls.create(td, {parent: canvas.scene});
    console.log("_rollStarshipLauncherAttack",td, missile,game.scenes.current,a,cls)
    //missile.delete;
   const targetToken = targetData[0].token
  // console.log("\n--------Missile Target---------",targetData,targetToken,a)

  const RandB = await rangeToTarget(a,targetToken);

   targetData[0].range = RandB.range;
   targetData[0].bearing = RandB.bearing;


   //a.data.rotation = RandB.bearing;
   a.object.rotate(RandB.bearing)   //             update({"data.rotation" : RandB.bearing})
   
   //console.log("\n--------Missile Token---------",a.data.rotation,RandB.bearing)
   //a.update( {"data.rotation" : RandB.bearing})
    a.actor.update({"system.targetData" : duplicate(targetData[0])})
   // a.render();
   // console.log("\n--------Missile Token---------",a,targetData[0].range,RandB,a.data.rotation)
    //a.refresh
    //game.actors.delete(a.actor._id);
    return a
    
}
/**
     * Place an attack roll for a starship using an item.
     * @param {TokenData} sourceToken Token From
     * @param {TokenData} targetToken Token To
     * Supported options:
     * disableDamageAfterAttack: If the system setting "Roll damage with attack" is enabled, setting this flag to true will disable this behavior.
     * disableDeductAmmo: Setting this to true will prevent ammo being deducted if applicable.
     */
 export async function rangeToTarget(sourceToken,targetToken) {
  function radians_to_degrees(radians)
{
  var compass = 0;
  const pi = Math.PI;
  compass = Math.round(radians * (180/pi));
  if (compass>=90) compass -= 90;
  else if (compass<90) compass +=270;
  return compass
}
  let targetData = {};
  targetData.range = Math.ceil((canvas.grid.measureDistance({x: sourceToken.x, y: sourceToken.y}, {x: targetToken.x, y: targetToken.y})));

  const deltax = sourceToken.x - targetToken.x;
  const deltay = sourceToken.y - targetToken.y;
  const theta = Math.atan2(deltay,deltax)
  
  targetData.bearing = radians_to_degrees(theta)
  console.log("\n--------Missile Token---------",theta,deltay,deltax, sourceToken, targetToken,targetData)
  return targetData

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
