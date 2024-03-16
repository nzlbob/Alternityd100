import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "./types.js";

export function d100stepdie(step) {
    var die = "";
    if(step < -4){die="-1d20"}
    if(step == -4){die="-1d12"}
    if(step == -3){die="-1d8"}
    if(step == -2){die="-1d6"}
    if(step == -1){die="-1d4"}
    if(step == 0){die="+d0"}
    if(step == 1){die="+1d4"}
    if(step == 2){die="+1d6"}
    if(step == 3){die="+1d8"}
    if(step == 4){die="+1d12"}
    if(step == 5){die="+1d20"}
    if(step == 6){die="+2d20"}
    if(step > 6){die="+3d20"}
    return die;   // The function returns the product of p1 and p2
  }
  export function d100resmod(stat) {
    var mod = "";
    if(stat < 5) return -2; 
    if(stat < 7) return -1; 
    if(stat < 11) return 0; 
    if(stat < 13) return 1; 
    if(stat < 15) return 2; 
    if(stat < 17) return 3; 
    if(stat < 19) return 4; 
    return 5; 
  
     }
/*
     2, Opponent's resistance modifier
     When a hero employs a skill against an opponent the opponent's resistance modifier may have to be considered. Table P10: SKILLS & RESISTANCE Modifiers, on the facing page, lists the skills that cause resistance modifiers to come into play.
     
     Table PIO: Skills & Resistance Modifiers
     Acting Characters Skill ....Resisting Ability
     Deception .Intelligence
     Entertainment ■ Intelligence or Will
     Heavy Weapons — ....Dexterity
     Interaction ... .win
     Leadership .............................Will
     Melee Weapons........ Strerigth
     Modern Ranged Weapons..........Dexterity
     Primitive Ranged Weapons .......... .Dexterity
     Psionic Skills WILL
     Stealth Will
     Street Smart .Intelligence or Will
     Unarmed Attack ....... .Strength
*/

     export function targetResModData(skill,defendersResMo) {
           console.log ("targetResModData", skill,defendersResMo,defendersResMo.dex,skill.broadid + 1)
        if ([46].includes(skill.broadid)) return defendersResMo?.int;  // Deception
        if ([150,137].includes(skill.broadid) ) return Math.max(defendersResMo?.int,defendersResMo?.wil);  // Entertainment
        if ([8,30,34].includes(skill.broadid))  return defendersResMo?.dex; //Heavy Weapons - Modern Ranged Weapons - Primitive Ranged Weapons
        if ([155,162,39].includes(skill.broadid)) return defendersResMo?.wil;  //Interaction - Leadership - Stealth
        if ([11,15].includes(skill.broadid)) return defendersResMo?.str;  //Melee Weapons
        
// NEED TO IMPLEMENT  Psionic Skills WILL
        if (skill.type == "psionic") return defendersResMo?.wil
        return 0
         }
/****
 * 
 * Target size modifier is a characteristic of the ship, noted on your ship record sheet. Small ships are harder to hit than big ships.
Missiles have a +4 step target size modifier.
Range modifier depends on the weapon's range character- istics. A weapon may have a range of 2/4/8 hexes, indicat- ing that a shot of 0-2 hexes is Short range, 3-4 hexes is Medium range, and 5-8 hexes is Long range.
Medium range attacks suffer a +1 step penalty.
Long range attacks suffer a +2 step penalty.
 * 
 * 
 */
export function d100NPCCrewStats(quality){

const arrayData = {green:{
    "actchk" : {
    "label": "Action Check",
    "value": 9,
    "base": 9,
    "marginal": 10,
    "ordinary": 9,
    "good": 4,
    "amazing": 2,
    "apr":2,
    "die":"",
    "step":{ "base":0,"bonus":-1,"total":0,"tooltip" : [] },
    "total":0,
    "tooltip": []
    },
    "skills": getstat("green")
},
trained:{
    "actchk" : {
    "label": "Action Check",
    "value": 10,
    "base": 10,
    "marginal": 11,
    "ordinary": 10,
    "good": 5,
    "amazing": 2,
    "apr":2,
    "die":"",
    "step":{ "base":0,"bonus":-1,"total":0,"tooltip" : [] },
    "total":0,
    "tooltip": []
    },
    "skills": getstat("trained")
}
,
veteran:{
    "actchk" : {
    "label": "Action Check",
    "value": 11,
    "base": 11,
    "marginal": 12,
    "ordinary": 11,
    "good": 5,
    "amazing": 2,
    "apr":2,
    "die":"",
    "step":{ "base":0,"bonus":-1,"total":0,"tooltip" : [] },
    "total":0,
    "tooltip": []
    },
    "skills": getstat("veteran")
},
crack:{
    "actchk" : {
    "label": "Action Check",
    "value": 12,
    "base": 12,
    "marginal": 13,
    "ordinary": 12,
    "good": 6,
    "amazing": 3,
    "apr":3,
    "die":"",
    "step":{ "base":1,"bonus":-1,"total":1,"tooltip" : [] },
    "total":0,
    "tooltip": []
    },
    "skills": getstat("crack")
}
}

function getstat(effectivity){
    let skillNames = ["systeop","spaceve","comma","leade","defen","space","leade","senso","juryr","weapo","engin","inspi","repai","driveas","systeas"]
    let skillLevels = {
        green: {
            base : 10, good : 5,amazing: 2,step:0
        },
        trained: {
            base : 12, good : 6,amazing: 3,step:0
        },
        veteran: {
            base : 14, good : 7,amazing: 3,step:0
        },
        crack: {
            base : 16, good : 8,amazing: 4,step:1
        }
    }
let skillset={}    
    for (let skill of skillNames){
        skillset[skill] = skillLevels[effectivity]
    }

    return skillset
}
    
 

//console.log(arrayData[quality],arrayData,quality)
return arrayData[quality]
}


 export function attackModData(a,b,c){

     var text = '{ "rangedW": {'+
     '"primira": {'+
         ' "short": -1 ,' +
         ' "medium": 1 ,' +
         ' "long": 2 },' +
    '"bow": {'+
         ' "short": -1 ,' +
         ' "medium": 1 ,' +
         ' "long": 2 },' +
    '"cross": {'+
         ' "short": -1 ,' +
         ' "medium": 1 ,' +
         ' "long": 2 },' +
    '"flint": {'+
         ' "short": -1 ,' +
         ' "medium": 1 ,' +
         ' "long": 2 },' +
    '"throw": {'+
         ' "short": -1 ,' +
         ' "medium": 1 ,' +
         ' "long": 2 },' +
    '"sling": {'+
         ' "short": -1 ,' +
         ' "medium": 1 ,' +
         ' "long": 2 },' +
    '"areaeff": {'+
         ' "short": 0 ,' +
         ' "medium": 0 ,' +
         ' "long": 0 },' +
     '"pisto": {'+
         ' "short": -1 ,' +
         ' "medium": 1 ,' +
         ' "long": 3 },' +      
     '"rifle": {'+
         ' "short": -1 ,' +
         ' "medium": 0 ,' +
         ' "long": 1 },' +   
     '"smg": {'+
         ' "short": -1 ,' +
         ' "medium": 1 ,' +
         ' "long": 3 }' +   
     '},' +
  '"heavyW":{ '+
     '"direcfi": {'+
         ' "short": -1 ,' +
         ' "medium": 0 ,' +
         ' "long": 1 },' +
     '"indirfi": {'+
         ' "short": 2 ,' +
         ' "medium": -2 ,' +
         ' "long": 0 }' +    
         '},' +
  '"projectile":{ '+
     '"weapo": {'+
         ' "short": 0 ,' +
         ' "medium": 1 ,' +
         ' "long": 2 }' +
         '},' +
  '"beam":{ '+
     '"weapo": {'+
         ' "short": 0 ,' +
         ' "medium": 1 ,' +
         ' "long": 2 }' +
     '}}'


    // console.log (text)
     //const attackModData = attackModTable; 
     var attackModData = JSON.parse(text);
     console.log (attackModData,a,b,c)
    // attackModData = {"meleeW":{"unarmat":0},}


    if (a == "meleeW") return 0
     return attackModData[a][b][c]
 }

 export function skillStepdieData(skill){
    if(skill.ranks>0){skill.step=0} else{skill.step=1}
    //Rifle bonus
    if(skill.id == 32) { if(skill.ranks>2){skill.step=-1}}
    
    // Vehicle Operation Rank. Benefit
    // Leadership
    if([43,162].includes(skill.broadid)) 
    { if(skill.ranks>3){skill.step=-1}
     if(skill.ranks>7){skill.step=-2}
      if(skill.ranks>11){skill.step=-3}}
    
      // Small Business. Benefit
    if(skill.id ==  60 ) 
    { if(skill.ranks>0){skill.step=-1}
     if(skill.ranks>3){skill.step=-2}
      if(skill.ranks>7){skill.step=-3}
      if(skill.ranks>11){skill.step=-4}
    }
   
    // Hacking. Benefit
    // Tactics Benefit
    if([62,111,112,113].includes(skill.id)) 
    { if(skill.ranks>3){skill.step=-1}
     if(skill.ranks>7){skill.step=-2}
      if(skill.ranks>11){skill.step=-3}
    }
//Language, Specific Skill Benefit
if(skill.id ==  73 ) 
{ if(skill.ranks>0){skill.step=+3}
 if(skill.ranks>1){skill.step=+1}
  if(skill.ranks>2){skill.step=0}
  if(skill.ranks>5){skill.step=-1}
  if(skill.ranks>11){skill.step=-3}
}
//Law, Specific Skill Benefit
//Biology, Botany, Genetics, Zoology Benefit
// Astronomy. Chemistry, Physics, Planetology
if([78,80,81,82,83,84,97,98,99,100].includes(skill.id)) 
{ if(skill.ranks>2){skill.step=-1}
 if(skill.ranks>5){skill.step=-2}
  if(skill.ranks>8){skill.step=-3}
  if(skill.ranks>11){skill.step=-4}
}

//Language, Specific Skill Benefit
if(skill.id ==  91 ) 
{ if(skill.ranks>0){skill.step=+3}
 if(skill.ranks>2){skill.step=+2}
  if(skill.ranks>5){skill.step=+1}
  if(skill.ranks>8){skill.step=0}
  if(skill.ranks>12){skill.step=-1}
}


    
    //const attackModData = attackModTable; 

    return skill.step
}

export function addModifier(bonus, data, item, localizationKey) {
   // console.log(bonus)
        if (bonus.modifierType === SFRPGModifierType.FORMULA) {
            if (item.rolledMods) {
                item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
            } else {
                item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
            }

            return 0;
        }

        let computedBonus = 0;
        try {
            const roll = Roll.create(bonus.modifier.toString(), data).evaluate({maximize: true});
            computedBonus = roll.total;
        } catch {}

        if (computedBonus !== 0 && localizationKey) {
            item.tooltip.push(game.i18n.format(localizationKey, {
                type: bonus.type.capitalize(),
                mod: computedBonus.signedString(),
                source: bonus.name
            }));
        }
        
        return computedBonus;
    };
  
     