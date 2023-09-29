/**
 * Create a Macro from an attribute drop.
 * Get an existing Alternityd100 macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createAlternityd100Macro(data, slot,a) {
  //let actor = game.actors.get(actorId);

  let A = _parseUuid(data.uuid)
  let B = fromUuidSync(data.uuid)
  let C = fromUuid(data.uuid)
  let actor = game.actors.get(B.actor);
 // const command = `const roll = new Roll("${data.roll}", actor ? actor.getRollData() : {});
 // roll.toMessage({speaker, flavor: "${B.name}"});`;

  const command = ` let Item = fromUuidSync("${data.uuid}"); Item.rollAttack()`;

 //const command = `game.sfrpg.rollItemMacro("${item.name}");`;
  let macro = game.macros.contents.find(m => (m.name === B.name) && (m.command === command));
 
  console.log(data,slot,A,B,command,macro)
  if (!macro) {
    macro = await Macro.create({
      name: B.name,
      img:B.img,
      type: "script",
      command: command,
      flags: { "Alternityd100.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}
/***
 *  if("Item"===t.type)return async function(e,t){const o=await Item.fromDropData(e),r=`game.sfrpg.rollItemMacro("${o.name}");`;
      let i=game.macros.contents.find((e=>e.name===o.name&&e.command===r));
      i||(i=await Macro.create({
        name:o.name,
        type:"script",
        img:o.img,
        command:r,
        flags:{"sfrpg.itemMacro":!0}},
        {displaySheet:!1}));
        game.user.assignHotbarMacro(i,t)}(t,o),!1}))
 * 
 */

/**
 * 
 *  * @param {Object} item The item data
 * @param {number} slot The hotbar slot to use
 * @returns {Promise}
 *
 async function createItemMacro(item, slot) {
 
  const command = `game.sfrpg.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
      macro = await Macro.create({
          name: item.name,
          type: "script",
          img: item.img,
          command: command,
          flags: {"sfrpg.itemMacro": true}
      }, {displaySheet: false});
  }
  console.log(macro)
  game.user.assignHotbarMacro(macro, slot);
}





 */