//import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "./types.js";
import { moveItemBetweenActorsAsync, getFirstAcceptableStorageIndex, ActorItemHelper, containsItems } from "../actor/actor-inventory-utils.js";
export async function d100importjson(actor) {
console.log("\n--------Say Hi------\n")


var arr = null;
$.ajax({
    'async': false,
    'global': false,
    'url': "systems/Alternityd100/module/packs/weaponcore.json",
    'dataType': "json",
    'success': function (data) {
        arr = data;
    }
});
console.log(arr)
let firstItem = arr.AttackForms.AttackForm[0];
let walteritem = arr.AttackForms.AttackForm;
console.log(walteritem)

let numItems = 2
let startItem = 21


//Creat a (numItems) number of weapon objects





let wno = 0,skillno,skill ;
let availability = "", avail = "";

for (let vno = 0; vno < numItems;vno++ )
{
let dataset = {type: "weapon",

    damage:{
        ord:{},
        goo:{},
        ama:{},
    },
    avail:"",
    availability:"",
    actions:0,
    accur:0,
    skill:"",
    clipSize:0,
    clipCost:0,
    capacity:{},
    range:{}
}

wno = vno + startItem
let dmg = walteritem[wno].Damage.split("/")

let dmgdie = [dmg[0].slice(0,dmg[0].length-1),dmg[1].slice(0,dmg[1].length-1),dmg[2].slice(0,dmg[2].length-1)]

dataset.damage.ord.dice = dmgdie[0];
dataset.damage.goo.dice = dmgdie[1];
dataset.damage.ama.dice = dmgdie[2];

let dmgtype = [dmg[0].slice(dmg[0].length-1),dmg[1].slice(dmg[1].length-1),dmg[2].slice(dmg[2].length-1)]
for (let x=0;x<3;x++){
    if (dmgtype[x] == 's') dmgtype[x] = dmgtype[x]+'tu';
    if (dmgtype[x] == 'w') dmgtype[x] = dmgtype[x]+'ou';
    if (dmgtype[x] == 'm') dmgtype[x] = dmgtype[x]+'or';
}

dataset.damage.ord.type = dmgtype[0];
dataset.damage.goo.type = dmgtype[1];
dataset.damage.ama.type = dmgtype[2];


dataset.actions = walteritem[wno]._Actions.valueOf();
dataset.accur = walteritem[wno]._Accuracy;

if (walteritem[wno]._Availability == 0) {dataset.availability='any';dataset.avail='Anywhere'}  ;
if (walteritem[wno]._Availability == 1) {dataset.availability='com';dataset.avail='Common'};
if (walteritem[wno]._Availability == 2) {dataset.availability='con';dataset.avail='Controlled'};
if (walteritem[wno]._Availability == 3) {dataset.availability='mil';dataset.avail='Military'};
if (walteritem[wno]._Availability == 4) {dataset.availability='res';dataset.avail='Restricted'};

skillno = walteritem[wno]._SkillID.valueOf()
skill = ""
for (let[key3,stat] of Object.entries(actor.system.abilities)){
for (let [key, skillx] of Object.entries(actor.system.skills[key3])) { if (skillx.id == skillno ) dataset.skill = key} }

dataset.clipCost = walteritem[wno]._ClipCost.valueOf();


//actor.sheet._updateObject()
//console.log(actor)
dataset.clipSize = walteritem[wno]._ClipSize.valueOf();
dataset.capacity.max = walteritem[wno]._ClipSize.valueOf();

dataset.price = walteritem[wno]._Cost;
let dmgtype2 = walteritem[wno]._DamageType.split("/")


dataset.hide = walteritem[wno]._Hide
dataset.mass = walteritem[wno]._Mass.valueOf();
dataset.bulk = walteritem[wno]._Mass.valueOf();

dataset.mode = {fire:false,auto:false,burst:false}
if (walteritem[wno]._Mode.includes("F")) dataset.mode.fire = true
if (walteritem[wno]._Mode.includes("A")) dataset.mode.auto = true
if (walteritem[wno]._Mode.includes("B")) dataset.mode.burst = true
dataset.progressLevel = walteritem[wno]._PL


////UP TO HERE

let rangex = walteritem[wno]._Range.split("/")
let range = []
dataset.range.short = rangex[0].valueOf();
dataset.range.medium = rangex[1].valueOf();
dataset.range.long = rangex[2].valueOf();
dataset.equippable = true;

dataset.manufacturer = "unknown";
if (walteritem[wno]._Type == "0") {dataset.actionType = "mwak" ; dataset.weaponType = "meleeW" };
if (walteritem[wno]._Type == "1") {dataset.actionType = "rwak" ; dataset.weaponType = "rangedW"};
if (walteritem[wno]._Type == "2") {dataset.actionType = "rwak" ; dataset.weaponType = "heavy"};




console.log(dataset)
let itemData = {
    name: walteritem[vno+startItem].Name,
    type: "weapon",
    data: duplicate(dataset)
};

let newItem = await actor.createEmbeddedDocuments("Item", [itemData])
console.log(newItem)
}
let equippable = true;
let source = walteritem[wno]._Source

//.then( item => {
//    console.log(item);
    
//    return item;
//}
//   );





/*console.log("\n", firstItem,
    "\ndmgdie" ,dmgdie,
    "\ndmgtype", dmgtype,
    "\nactions",actions,

    "\naccur", accur,
    "\navailability",availability,
    "\navail",avail,
    "\nskillno",skillno,
    "\nskill",skill,
    "\nclipcost",clipcost,
    "\nclipsize",clipsize,
    "\ncost",cost,
    "\ndmgtype2",dmgtype2,
    "\nhide",hide,
    "\nmass",mass,
    "\nmode",mode,
    "\nprogressLevel",progressLevel,
    "\nrange",range



    )

    */
//console.log(newItem)
//console.log(actor)




    return true; 
  

    
     }


 