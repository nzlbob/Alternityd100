/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
 export class d100ATokenDoc extends TokenDocument {
/** @override */


getData() {
  let data = super.getData();
  console.log("d100ATokenDoc.getData() {\n",this,data)
  
 return data
}
   
  /**
   * Return a reference to a Combatant that represents this Token, if one is present in the current encounter.
   * This runs when the cursor is over the token
   * @type {Combatant|null}
   */
  get combatant() {
//this.displayBars 
this._source.displayBars= 50
//console.log("Hello",this)
    if (!["starship"].includes(this.actor?.type)){
      
    return game.combat?.getCombatantByToken(this.id) || null;
    }
//console.log("Hello",this.actor.name," - ",this.actor.type,this,this.displayBars,this._source.displayBars )
return game.combat?.getCombatantByToken(this.id) || null;

return game.combat?.getCombatantByActor(this.actor.system.crew.pilot.actorIds[0]) || null;

  }

  /* -------------------------------------------- */

  /**
   * An indicator for whether this Token is currently involved in the active combat encounter.
   * @type {boolean}
   */
  get inCombat() {
    return !!this.combatant;
  }




}