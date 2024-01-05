
import { d100AActorSheetCharacter } from "../../actor/sheet/character.js";


export class d100AActorSheetCharacterSmall extends d100AActorSheetCharacter {

    get template() {
        const path = "systems/Alternityd100/templates/actors/";
     //  if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "character-sheet-small.html";
    }
}

