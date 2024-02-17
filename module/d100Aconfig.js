// Namespace SFRPG Configuration Values
export const d100A = {};

/**
 * The set of ability scores used with the system
 * @type {Object}
 */
d100A.itemAttack = {
   "range": {
      "short": "Short",
      "medium": "Medium",
      "long": "Long"
   }
}
d100A.pilotingSkills = {
   "vehicop": "d100A.vehicop",
   "airve": "d100A.airve",
   "landve": "d100A.landve",
   "spaceve": "d100A.spaceve",
   "waterve": "d100A.waterve"
}

d100A.npc = {
   abilityBasis: {
      "Administrator": { "str": 2, "dex": 5, "con": 2, "int": 6, "wil": 14, "per": 15 },
      "Bartender": { "str": 6, "dex": 2, "con": 5, "int": 2, "wil": 14, "per": 15 },
      "Brawler": { "str": 15, "dex": 6, "con": 14, "int": 2, "wil": 6, "per": 5 },
      "Corporate Executive": { "str": 2, "dex": 6, "con": 5, "int": 14, "wil": 15, "per": 2 },
      "Doctor": { "str": 2, "dex": 14, "con": 2, "int": 15, "wil": 6, "per": 5 },
      "Laborer": { "str": 14, "dex": 5, "con": 15, "int": 2, "wil": 6, "per": 2 },
      "Military Officer": { "str": 6, "dex": 4, "con": 5, "int": 6, "wil": 13, "per": 7 },
      "Law Enforcer": { "str": 6, "dex": 14, "con": 6, "int": 6, "wil": 3, "per": 5 },
      "Reporter": { "str": 1, "dex": 5, "con": 2, "int": 8, "wil": 15, "per": 8 },
      "Scientist": { "str": 2, "dex": 9, "con": 2, "int": 15, "wil": 10, "per": 6 },
      "Soldier": { "str": 6, "dex": 14, "con": 14, "int": 2, "wil": 6, "per": 2 },
      "Spacehand": { "str": 14, "dex": 6, "con": 8, "int": 5, "wil": 6, "per": 2 },
      "Spy": { "str": 2, "dex": 6, "con": 2, "int": 12, "wil": 14, "per": 10 },
      "Trader": { "str": 2, "dex": 5, "con": 2, "int": 6, "wil": 14, "per": 15 }
   },
   npcQuality: {
      marginal: "Marginal",
      ordinary: "Ordinary",
      good: "Good",
      amazing: "Amazing"
   },
   abilityArray: [
      [9, 9, 9, 9],
      [8, 9, 10, 10],
      [8, 9, 10, 11],
      [8, 9, 10, 12],
      [9, 10, 10, 11],
      [9, 10, 11, 11],
      [9, 10, 11, 12],
      [8, 10, 12, 13],
      [9, 10, 11, 13],
      [9, 10, 12, 12],
      [10, 10, 11, 12],
      [10, 11, 11, 12],
      [9, 11, 12, 13],
      [10, 11, 11, 13],
      [10, 11, 12, 13],
      [10, 11, 12, 14],
      [10, 10, 11, 12]
   ],
   skills: {
      "Administrator": {
         "marginal": {
            "busin": 1,
            "speakl": { label: "Sociology", ranks: 1 },
            "burea": 1,
            "manag": 1,
            "resol": 1,
            "cultu": 1,
            "barga": 1,
            "interv": 1
         },
         "ordinary": {
            "corpo": 2,
            "burea": 2,
            "etiqu": 1,
            "bluff": 1,
            "bribe": 1,
            "gambl": 1,
            "barga": 2,
            "leade": 1
         },
         "good": {
            "law": 1,
            "inves": 1,
            "etiqu": 3,
            "bluff": 1,
            "burea": 4,
            "manag": 3,
            "mentare": 2,
            "comma": 2,
         },
         "amazing": {
            "corpo": 4,
            "compuop": 1,
            "deduc": 2,
            "burea": 6,
            "manag": 6,
            "barga": 4,
            "interv": 3,
            "comma": 4,
            "inspi": 2,
         }
      },
      "Bartender": {
         "marginal": {
            "unarmat": 1,
            "vehicop": 1,
            "busin": 1,
            "streesm": 1,
            "barga": 1,
            "charm": 1,
         },
         "ordinary": {
            "bludg": 1,
            "illicbu": 1,
            "smallbu": 1,
            "streekn": 1,
            "crimiel": 1,
            "decep": 1,
            "enter": 1,
         },
         "good": {
            "bludg": 2,
            "illicbu": 2,
            "streekn": 2,
            "crimiel": 2,
            "bluff": 1,
            "gambl": 1,
            "cultu": 1,
            "barga": 3,
            "charm": 3,
            "interv": 1,
            "intim": 1,
            "seduc": 1,
            "taunt": 1,
         },
         "amazing": {
            "brawl": 2,
            "psych": 1,
            "streekn": 6,
            "bluff": 3,
            "bribe": 1,
            "gambl": 3,
            "barga": 4,
            "charm": 4,
            "interv": 2,
            "intim": 2,
            "seduc": 3,
            "taunt": 2
         }
      },
      "Brawler": {
         "marginal": {
            "athle": 1,
            "meleewe": 1,
            "brawl": 1,
            "moderra": 1,
            "vehicop": 1,
            "stami": 1,
            "streesm": 1,
            "interact": 1

         },
         "ordinary": {
            "blade": 1,
            "brawl": 2,
            "pisto": 2,
            "endur": 2,
            "crimiel": 1,
            "streekn": 1,
            "intim": 1,

         },
         "good": {
            "blade": 3,
            "bludg": 2,
            "brawl": 4,
            "endur": 3,
            "resispa": 1,
            "firstai": 1,
            "physire": 1,
            "leade": 1,

         },
         "amazing": {
            "powerwe": 2,
            "pisto": 4,
            "smg": 1,
            "hide": 1,
            "sneak": 1,
            "illicbu": 1,
            "tacti": 1,
            "crimiel": 1,
            "streekn": 1,
            "bluff": 1,
            "bribe": 1,
            "gambl": 1,
            "comma": 2,

         }
      },
      "Corporate Executive": {
         "marginal": {
            "corpo": 1,
            "compuop": 1,
            "manag": 1,
            "decep": 1,
            "barga": 1,
            "interv": 1,

         },
         "ordinary": {
            "moderra": 1,
            "corpo": 3,
            "illicbu": 1,
            "bluff": 1,
            "bribe": 2,
            "barga": 2,
            "charm": 1,
            "interv": 2,
            "intim": 1,

         },
         "good": {
            "pisto": 1,
            "vehicop": 1,
            "corpo": 4,
            "illicbu": 2,
            "inves": 1,
            "resol": 1,
            "etiqu": 1,
            "barga": 4,
            "charm": 2,
            "leade": 1,

         },
         "amazing": {
            "corpo": 8,
            "illicbu": 4,
            "mentare": 1,
            "bluff": 4,
            "bribe": 4,
            "interv": 4,
            "intim": 3,

         }
      },
      "Doctor": {
         "marginal": {
            "compuop": 1,
            "biolo": 1,
            "medickn": 1,
            "treat": 1,
            "physi": 1,

         },
         "ordinary": {
            "vehicop": 1,
            "medickn": 2,
            "psych": 1,
            "surge": 1,
            "treat": 2,
            "chemi": 1,
            "inves": 1,
            "interact": 1,

         },
         "good": {
            "deduc": 1,
            "biolo": 1,
            "foren": 1,
            "medickn": 3,
            "surge": 2,
            "treat": 4,
            "systeop": 1,
            "burea": 1,
            "teach": 1,
            "spec1": 1,
            "charm": 1,

         },
         "amazing": {
            "busin": 1,
            "xenol": 1,
            "foren": 2,
            "medickn": 4,
            "surge": 5,
            "treat": 8,
            "xenom": 1,
            "creat": 1,
            "spec1": 3,
            "comma": 1,
            "inspi": 1,

         }
      },
      "Laborer": {
         "marginal": {
            "athle": 1,
            "brawl": 1,
            "endur": 1,
            "streesm": 1,

         },
         "ordinary": {
            "throw": 1,
            "throwspec": 1,
            "blade": 1,
            "bludg": 1,
            "landve": 1,
            "endur": 2,
            "streekn": 1,

         },
         "good": {
            "brawl": 3,
            "endur": 3,
            "resispa": 1,
            "busin": 1,
            "technsc": 1,
            "admin": 1,
            "gambl": 1,
            "barga": 1,

         },
         "amazing": {
            "blade": 3,
            "bludg": 3,
            "endur": 4,
            "knowl": 1,
            "firstai": 1,
            "systeop": 1,
            "juryr": 1,
            "repai": 1,
            "crimiel": 1,
            "streekn": 4,
            "leade": 1,

         }
      },
      "Military Officer": {
         "marginal": {
            "moderra": 1,
            "vehicop": 1,
            "systeop": 1,
            "tacti": 1,
            "leade": 1,

         },
         "ordinary": {
            "armorop": 1,
            "pisto": 1,
            "rifle": 1,
            "airve": 1,
            "landve": 1,
            "compuop": 1,
            "firstai": 1,
            "senso": 1,
            "interro": 1,

         },
         "good": {
            "powerma": 1,
            "pisto": 2,
            "rifle": 2,
            "spaceve": 1,
            "navig": 1,
            "weapo": 1,
            "infan": 1,
            "comma": 2,
            "inspi": 1,

         },
         "amazing": {
            "infan": 3,
            "space": 3,
            "vehic": 3,
            "comma": 6,
            "inspi": 4,

         }
      },
      "Law Enforcer": {
         "marginal": {
            "bludg": 1,
            "pisto": 1,
            "vehicop": 1,
            "law": 1,

         },
         "ordinary": {
            "landve": 1,
            "firstai": 1,
            "lawen": 1,
            "interro": 1,
            "crimiel": 1,
            "interact": 1,

         },
         "good": {
            "bludg": 2,
            "powerwe": 1,
            "pisto": 3,
            "rifle": 1,
            "lawen": 3,
            "secur": 1,
            "interro": 2,
            "searc": 1,
            "track": 1,
            "intim": 1,

         },
         "amazing": {
            "pisto": 6,
            "courtpr": 1,
            "lawen": 6,
            "protepr": 3,
            "securde": 1,
            "comma": 1,

         }
      },
      "Reporter": {
         "marginal": {
            "spec2": 1,
            "inves": 1,
            "streesm": 1,
            "decep": 1,
            "charm": 1,
            "interv": 1

         },
         "ordinary": {
            "shado": 1,
            "sneak": 1,
            "vehicop": 1,
            "deduc": 1,
            "searc": 1,
            "track": 1,
            "charm": 2,
            "seduc": 1,

         },
         "good": {
            "manip": 1,
            "busin": 1,
            "law": 1,
            "secur": 1,
            "admin": 1,
            "spec2": 3,
            "resol": 1,
            "etiqu": 1,
            "bluff": 1,
            "bribe": 1,

         },
         "amazing": {
            "pisto": 1,
            "shado": 3,
            "sneak": 3,
            "compusc": 1,
            "deduc": 3,
            "searc": 3,
            "track": 3,
            "mentare": 1,
            "charm": 4,
            "interv": 3,
            "seduc": 2

         }
      },
      "Scientist": {
         "marginal": {
            "compusc": 1,
            "knowl": 1,
            "lifesc": 1,
            "physisc": 1,
            "technsc": 1,

         },
         "ordinary": {
            "vehicop": 1,
            "hacki": 2,
            "hardw": 2,
            "progr": 2,
            "demol": 2,
            "disar": 2,
            "scrat": 2,
            "setexp": 2,
            "foren": 2,
            "medickn": 2,
            "psych": 2,
            "surge": 2,
            "treat": 2,
            "xenom": 2,
            "astro": 2,
            "chemi": 2,
            "physi": 2,
            "plane": 2,
            "systeop": 1,
            "inven": 2,
            "juryr": 2,
            "repai": 2,
            "technkn": 2,
            "inves": 1,

         },
         "good": {
            "moderra": 1,
            "hacki": 3,
            "hardw": 3,
            "progr": 3,
            "demol": 3,
            "disar": 3,
            "scrat": 3,
            "setexp": 3,
            "deduc": 1,
            "foren": 3,
            "medickn": 3,
            "psych": 3,
            "surge": 3,
            "treat": 3,
            "xenom": 3,
            "astro": 3,
            "chemi": 3,
            "physi": 3,
            "plane": 3,
            "senso": 1,
            "inven": 3,
            "juryr": 3,
            "repai": 3,
            "technkn": 3,
            "burea": 1,
            "inves": 1,
            "spec1": 1,
            "interact": 1,

         },
         "amazing": {
            "pisto": 1,
            "busin": 1,
            "hacki": 5,
            "hardw": 5,
            "progr": 5,
            "demol": 5,
            "disar": 5,
            "scrat": 5,
            "setexp": 5,
            "foren": 5,
            "medickn": 5,
            "psych": 5,
            "surge": 5,
            "treat": 5,
            "xenom": 5,
            "astro": 5,
            "chemi": 5,
            "physi": 5,
            "plane": 5,
            "inven": 5,
            "juryr": 5,
            "repai": 5,
            "technkn": 5,
            "spec2": 1,
            "spec1": 3,

         }
      },
      "Soldier": {
         "marginal": {
            "armorop": 1,
            "athle": 1,
            "unarmat": 1,
            "moderra": 1,
            "vehicop": 1,
            "stami": 1

         },
         "ordinary": {
            "combaar": 1,
            "heavywe": 1,
            "brawl": 1,
            "pisto": 1,
            "rifle": 2,
            "endur": 1,
            "resispa": 1,
            "firstai": 1,
            "interact": 1

         },
         "good": {
            "combaar": 3,
            "powerar": 1,
            "climb": 1,
            "throw": 1,
            "direcfi": 1,
            "meleewe": 1,
            "pisto": 2,
            "rifle": 3,
            "smg": 1,
            "endur": 3,
            "survi": 1,

         },
         "amazing": {
            "powerar": 3,
            "blade": 1,
            "powerwe": 3,
            "pisto": 3,
            "rifle": 5,
            "survitr": 1,
            "infan": 3,
            "vehic": 1,
            "comma": 3,

         }
      },
      "Spacehand": {
         "marginal": {
            "brawl": 1,
            "systeop": 1,
            "technsc": 1,

         },
         "ordinary": {
            "athle": 1,
            "moderra": 1,
            "vehicop": 1,
            "endur": 1,
            "commu": 1,
            "defen": 1,
            "engin": 1,
            "senso": 1,
            "weapo": 1,
            "juryr": 1,
            "interact": 1,

         },
         "good": {
            "brawl": 3,
            "spaceve": 1,
            "busin": 1,
            "commu": 2,
            "defen": 2,
            "engin": 2,
            "senso": 2,
            "weapo": 2,
            "repai": 1,
            "admin": 1,
            "streesm": 1,
            "gambl": 1,
            "barga": 3,
            "charm": 1,

         },
         "amazing": {
            "climb": 1,
            "endur": 3,
            "firstai": 1,
            "speclan": 1,
            "commu": 4,
            "defen": 4,
            "engin": 4,
            "senso": 4,
            "weapo": 4,
            "juryr": 3,
            "repai": 2,
            "taunt": 1,
            "leade": 1,

         }
      },
      "Spy": {
         "marginal": {
            "pisto": 1,
            "shado": 1,
            "protepr": 1,
            "bluff": 1,
            "bribe": 1,
            "interact": 1

         },
         "ordinary": {
            "defenma": 1,
            "dodge": 1,
            "manip": 1,
            "sneak": 1,
            "vehicop": 1,
            "stami": 1,
            "charm": 1,
            "interv": 1,
            "seduc": 1

         },
         "good": {
            "dared": 1,
            "pisto": 2,
            "smg": 1,
            "hide": 1,
            "resispa": 1,
            "systeop": 1,
            "inves": 1,
            "resol": 1,
            "etiqu": 1

         },
         "amazing": {
            "pisto": 3,
            "rifle": 1,
            "smg": 2,
            "hide": 2,
            "shado": 3,
            "sneak": 3,
            "searc": 2,
            "mentare": 2,
            "physire": 2,
            "charm": 3,
            "interv": 3,
            "seduc": 3

         }
      },
      "Trader": {
         "marginal": {
            "spaceve": 1,
            "busin": 1,
            "compuop": 1,
            "cultu": 1,
            "barga": 1,
            "charm": 1

         },
         "ordinary": {
            "lockp": 1,
            "pickp": 1,
            "illicbu": 1,
            "smallbu": 1,
            "streesm": 1,
            "decep": 1,
            "barga": 3,
            "intim": 1,

         },
         "good": {
            "corpo": 1,
            "illicbu": 2,
            "smallbu": 2,
            "law": 1,
            "inves": 1,
            "mentare": 1,
            "crimiel": 1,
            "streekn": 1,
            "etiqu": 3,
            "bluff": 1,
            "bribe": 1,

         },
         "amazing": {
            "corpo": 2,
            "illicbu": 4,
            "smallbu": 4,
            "deduc": 3,
            "burea": 1,
            "manag": 1,
            "bluff": 3,
            "bribe": 3,
            "gambl": 1,
            "barga": 6,
            "charm": 3,
            "leade": 1,

         }
      }
   }
}



d100A.skillArray = {
   captain: [{ attrib: "per", name: "comma", bname: "leade" }, { attrib: "int", name: "space", bname: "tacti" }],
   pilot: [{ attrib: "dex", name: "spaceve", bname: "vehicop" }],
   copilot: [{ attrib: "dex", name: "spaceve", bname: "vehicop" }],
   // navigation: [{attrib : "int",name : "systeas",bname : "navig"},{attrib : "int",name : "driveas",bname : "navig"} ],
   communications: [{ attrib: "int", name: "commu", bname: "systeop" }],
   damageControl: [{ attrib: "int", name: "repai", bname: "technsc" }, { attrib: "int", name: "juryr", bname: "technsc" }],
   defences: [{ attrib: "int", name: "defen", bname: "systeop" }],
   engineer: [{ attrib: "int", name: "engin", bname: "systeop" }],
   sensors: [{ attrib: "int", name: "senso", bname: "systeop" }],

   gunner: [{ attrib: "int", name: "weapo", bname: "systeop" }],
   //  scienceOfficers: [],
   //  chiefMates: [],
   //  magicOfficers: [],
   //  passengers: []

}
//  "captain", "pilot", "copilot", "sensors" , "communications", "engineer", "damageControl", "defences",  "gunner", "scienceOfficer",  "navigation","chiefMate", "magicOfficer", "openCrew", "minorCrew"
d100A.NPCattributes = {
   "fat": {
      "label": "Fatigue",
      "min": 0,
      "base": 1,
      "value": 7,
      "temp": 0,
      "tempmax": 100,
      "tooltip": [],
      "pending": 0
   },
   "stu": {
      "label": "Stun",
      "min": 0,
      "base": 1,
      "value": 8,
      "temp": 0,
      "tempmax": 100,
      "tooltip": [],
      "pending": 0
   },
   "wou": {
      "label": "Wounds",
      "min": 0,
      "base": 1,
      "value": 9,
      "temp": 0,
      "tempmax": 100,
      "tooltip": [],
      "pending": 0
   },
   "mor": {
      "label": "Mortal",
      "min": 0,
      "base": 1,
      "value": 10,
      "temp": 0,
      "tempmax": 100,
      "tooltip": [],
      "pending": 0
   },
   "actchk": {
      "label": "Action Check",
      "value": 0,
      "base": 0,
      "marginal": 0,
      "ordinary": 0,
      "good": 0,
      "amazing": 0,
      "apr": 0,
      "die": "",
      "step": { "base": 0, "bonus": -1, "total": 0, "tooltip": [] },
      "total": 0,
      "tooltip": []

   }

}


d100A.NPCCrewArray = {
   "captain": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,],
   "pilot": [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,],
   "copilot": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,],
   "sensors": [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,],
   "communications": [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,],
   "engineer": [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,],
   "damageControl": [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 1, 1,],
   "defences": [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2,],
   "gunner": [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2,],
   "scienceOfficer": [],

   //"navigation": [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,],




   chiefMates: [],
   magicOfficers: [],
   passengers: []

}

d100A.skillData = {

   "armorop": { "name": "d100A.armorop", "attrib": "str", "isBroad": true, "id": 0, "broad": "armorop", "tooltip": "Armor that's bulky, heavy, and cumbersome hinders the character using it. This is reflected by a penalty la the character s action check and the lessening or negating of a character s Dexterity resistance modifier. The Armor Operation broad skill and its specially skills help to alleviate these penalties Table P41: AlLMOR an page ESB in Chapter Jl: Weapons & Armor lists the various types of armor available and indicates which ones require the user to take an action check and Dexterity resistance modifier penalty, Under the Skill 1 column on that table, an entry of ' means that the Armor Operation skill is not needed to use the armor effectively, and no action check or Dexterity resistance modifier penalty is associated with it. II either Armor Op / combat / or 'powered appears under Skill, then the penalty (given in the AP" },
   "combaar": { "name": "d100A.combaar", "attrib": "str", "isBroad": false, "id": 1, "broad": "armorop" },
   "powerar": { "name": "d100A.powerar", "attrib": "str", "isBroad": false, "id": 2, "broad": "armorop" },
   "athle": { "name": "d100A.athle", "attrib": "str", "isBroad": true, "id": 3, "broad": "athle" },
   "climb": { "name": "d100A.climb", "attrib": "str", "isBroad": false, "id": 4, "broad": "athle" },
   "jump": { "name": "d100A.jump", "attrib": "str", "isBroad": false, "id": 5, "broad": "athle" },
   "throw": { "name": "d100A.throw", "attrib": "str", "isBroad": false, "id": 6, "broad": "athle" },
   "throwspec": { "name": "d100A.throwspec", "attrib": "str", "isBroad": false, "id": 7, "broad": "athle" },
   "heavywe": { "name": "d100A.heavywe", "attrib": "str", "isBroad": true, "id": 8, "broad": "heavywe" },
   "direcfi": { "name": "d100A.direcfi", "attrib": "str", "isBroad": false, "id": 9, "broad": "heavywe" },
   "indirfi": { "name": "d100A.indirfi", "attrib": "str", "isBroad": false, "id": 10, "broad": "heavywe" },
   "meleewe": { "name": "d100A.meleewe", "attrib": "str", "isBroad": true, "id": 11, "broad": "meleewe" },
   "blade": { "name": "d100A.blade", "attrib": "str", "isBroad": false, "id": 12, "broad": "meleewe" },
   "bludg": { "name": "d100A.bludg", "attrib": "str", "isBroad": false, "id": 13, "broad": "meleewe" },
   "powerwe": { "name": "d100A.powerwe", "attrib": "str", "isBroad": false, "id": 14, "broad": "meleewe" },
   "unarmat": { "name": "d100A.unarmat", "attrib": "str", "isBroad": true, "id": 15, "broad": "unarmat" },
   "brawl": { "name": "d100A.brawl", "attrib": "str", "isBroad": false, "id": 16, "broad": "unarmat" },
   "powerma": { "name": "d100A.powerma", "attrib": "str", "isBroad": false, "id": 17, "broad": "unarmat" },

   "acrob": { "name": "d100A.acrob", "attrib": "dex", "isBroad": true, "id": 18, "broad": "acrob" },
   "dared": { "name": "d100A.dared", "attrib": "dex", "isBroad": false, "id": 19, "broad": "acrob" },
   "defenma": { "name": "d100A.defenma", "attrib": "dex", "isBroad": false, "id": 20, "broad": "acrob" },
   "dodge": { "name": "d100A.dodge", "attrib": "dex", "isBroad": false, "id": 21, "broad": "acrob" },
   "fall": { "name": "d100A.fall", "attrib": "dex", "isBroad": false, "id": 22, "broad": "acrob" },
   "fligh": { "name": "d100A.fligh", "attrib": "dex", "isBroad": false, "id": 23, "broad": "acrob" },
   "zerogtr": { "name": "d100A.zerogtr", "attrib": "dex", "isBroad": false, "id": 24, "broad": "acrob" },
   "zerospec": { "name": "d100A.zerospec", "attrib": "dex", "isBroad": false, "id": 25, "broad": "acrob" },
   "manip": { "name": "d100A.manip", "attrib": "dex", "isBroad": true, "id": 26, "broad": "manip" },
   "lockp": { "name": "d100A.lockp", "attrib": "dex", "isBroad": false, "id": 27, "broad": "manip" },
   "pickp": { "name": "d100A.pickp", "attrib": "dex", "isBroad": false, "id": 28, "broad": "manip" },
   "prest": { "name": "d100A.prest", "attrib": "dex", "isBroad": false, "id": 29, "broad": "manip" },
   "moderra": { "name": "d100A.moderra", "attrib": "dex", "isBroad": true, "id": 30, "broad": "moderra" },
   "pisto": { "name": "d100A.pisto", "attrib": "dex", "isBroad": false, "id": 31, "broad": "moderra" },
   "rifle": { "name": "d100A.rifle", "attrib": "dex", "isBroad": false, "id": 32, "broad": "moderra" },
   "smg": { "name": "d100A.smg", "attrib": "dex", "isBroad": false, "id": 33, "broad": "moderra" },
   "primira": { "name": "d100A.primira", "attrib": "dex", "isBroad": true, "id": 34, "broad": "primira" },
   "bow": { "name": "d100A.bow", "attrib": "dex", "isBroad": false, "id": 35, "broad": "primira" },
   "cross": { "name": "d100A.cross", "attrib": "dex", "isBroad": false, "id": 36, "broad": "primira" },
   "flint": { "name": "d100A.flint", "attrib": "dex", "isBroad": false, "id": 37, "broad": "primira" },
   "sling": { "name": "d100A.sling", "attrib": "dex", "isBroad": false, "id": 38, "broad": "primira" },
   "steal": { "name": "d100A.steal", "attrib": "dex", "isBroad": true, "id": 39, "broad": "steal" },
   "hide": { "name": "d100A.hide", "attrib": "dex", "isBroad": false, "id": 40, "broad": "steal" },
   "shado": { "name": "d100A.shado", "attrib": "dex", "isBroad": false, "id": 41, "broad": "steal" },
   "sneak": { "name": "d100A.sneak", "attrib": "dex", "isBroad": false, "id": 42, "broad": "steal" },
   "vehicop": { "name": "d100A.vehicop", "attrib": "dex", "isBroad": true, "id": 43, "broad": "vehicop" },
   "airve": { "name": "d100A.airve", "attrib": "dex", "isBroad": false, "id": 44, "broad": "vehicop" },
   "landve": { "name": "d100A.landve", "attrib": "dex", "isBroad": false, "id": 45, "broad": "vehicop" },
   "spaceve": { "name": "d100A.spaceve", "attrib": "dex", "isBroad": false, "id": 46, "broad": "vehicop" },
   "waterve": { "name": "d100A.waterve", "attrib": "dex", "isBroad": false, "id": 47, "broad": "vehicop" },
   "movem": { "name": "d100A.movem", "attrib": "dex", "isBroad": true, "id": 48, "broad": "movem" },
   "race": { "name": "d100A.race", "attrib": "dex", "isBroad": false, "id": 49, "broad": "movem" },
   "swim": { "name": "d100A.swim", "attrib": "dex", "isBroad": false, "id": 50, "broad": "movem" },
   "trail": { "name": "d100A.trail", "attrib": "dex", "isBroad": false, "id": 51, "broad": "movem" },

   "stami": { "name": "d100A.stami", "attrib": "con", "isBroad": true, "id": 52, "broad": "stami" },
   "endur": { "name": "d100A.endur", "attrib": "con", "isBroad": false, "id": 53, "broad": "stami" },
   "resispa": { "name": "d100A.resispa", "attrib": "con", "isBroad": false, "id": 54, "broad": "stami" },
   "survi": { "name": "d100A.survi", "attrib": "con", "isBroad": true, "id": 55, "broad": "survi" },
   "survitr": { "name": "d100A.survitr", "attrib": "con", "isBroad": false, "id": 56, "broad": "survi" },

   "busin": { "name": "d100A.busin", "attrib": "int", "isBroad": true, "id": 57, "broad": "busin" },
   "corpo": { "name": "d100A.corpo", "attrib": "int", "isBroad": false, "id": 58, "broad": "busin" },
   "illicbu": { "name": "d100A.illicbu", "attrib": "int", "isBroad": false, "id": 59, "broad": "busin" },
   "smallbu": { "name": "d100A.smallbu", "attrib": "int", "isBroad": false, "id": 60, "broad": "busin" },
   "compusc": { "name": "d100A.compusc", "attrib": "int", "isBroad": true, "id": 61, "broad": "compusc" },
   "hacki": { "name": "d100A.hacki", "attrib": "int", "isBroad": false, "id": 62, "broad": "compusc" },
   "hardw": { "name": "d100A.hardw", "attrib": "int", "isBroad": false, "id": 63, "broad": "compusc" },
   "progr": { "name": "d100A.progr", "attrib": "int", "isBroad": false, "id": 64, "broad": "compusc" },
   "demol": { "name": "d100A.demol", "attrib": "int", "isBroad": true, "id": 65, "broad": "demol" },
   "disar": { "name": "d100A.disar", "attrib": "int", "isBroad": false, "id": 66, "broad": "demol" },
   "scrat": { "name": "d100A.scrat", "attrib": "int", "isBroad": false, "id": 67, "broad": "demol" },
   "setexp": { "name": "d100A.setexp", "attrib": "int", "isBroad": false, "id": 68, "broad": "demol" },
   "knowl": { "name": "d100A.knowl", "attrib": "int", "isBroad": true, "id": 69, "broad": "knowl" },
   "compuop": { "name": "d100A.compuop", "attrib": "int", "isBroad": false, "id": 70, "broad": "knowl" },
   "deduc": { "name": "d100A.deduc", "attrib": "int", "isBroad": false, "id": 71, "broad": "knowl" },
   "firstai": { "name": "d100A.firstai", "attrib": "int", "isBroad": false, "id": 72, "broad": "knowl" },
   "speakl": { "name": "d100A.speakl", "attrib": "int", "isBroad": false, "id": 73, "broad": "knowl" },
   "speclan": { "name": "d100A.speclan", "attrib": "int", "isBroad": false, "id": 74, "broad": "knowl" },
   "law": { "name": "d100A.law", "attrib": "int", "isBroad": true, "id": 75, "broad": "law" },
   "courtpr": { "name": "d100A.courtpr", "attrib": "int", "isBroad": false, "id": 76, "broad": "law" },
   "lawen": { "name": "d100A.lawen", "attrib": "int", "isBroad": false, "id": 77, "broad": "law" },
   "lawspec": { "name": "d100A.lawspec", "attrib": "int", "isBroad": false, "id": 78, "broad": "law" },
   "lifesc": { "name": "d100A.lifesc", "attrib": "int", "isBroad": true, "id": 79, "broad": "lifesc" },
   "biolo": { "name": "d100A.biolo", "attrib": "int", "isBroad": false, "id": 80, "broad": "lifesc" },
   "botan": { "name": "d100A.botan", "attrib": "int", "isBroad": false, "id": 81, "broad": "lifesc" },
   "genet": { "name": "d100A.genet", "attrib": "int", "isBroad": false, "id": 82, "broad": "lifesc" },
   "xenol": { "name": "d100A.xenol", "attrib": "int", "isBroad": false, "id": 83, "broad": "lifesc" },
   "zoolo": { "name": "d100A.zoolo", "attrib": "int", "isBroad": false, "id": 84, "broad": "lifesc" },
   "medicsc": { "name": "d100A.medicsc", "attrib": "int", "isBroad": true, "id": 85, "broad": "medicsc" },
   "foren": { "name": "d100A.foren", "attrib": "int", "isBroad": false, "id": 86, "broad": "medicsc" },
   "medickn": { "name": "d100A.medickn", "attrib": "int", "isBroad": false, "id": 87, "broad": "medicsc" },
   "psych": { "name": "d100A.psych", "attrib": "int", "isBroad": false, "id": 88, "broad": "medicsc" },
   "surge": { "name": "d100A.surge", "attrib": "int", "isBroad": false, "id": 89, "broad": "medicsc" },
   "treat": { "name": "d100A.treat", "attrib": "int", "isBroad": false, "id": 90, "broad": "medicsc" },
   "xenom": { "name": "d100A.xenom", "attrib": "int", "isBroad": false, "id": 91, "broad": "medicsc" },
   "navig": { "name": "d100A.navig", "attrib": "int", "isBroad": true, "id": 92, "broad": "navig" },
   "driveas": { "name": "d100A.driveas", "attrib": "int", "isBroad": false, "id": 93, "broad": "navig" },
   "surfa": { "name": "d100A.surfa", "attrib": "int", "isBroad": false, "id": 94, "broad": "navig" },
   "systeas": { "name": "d100A.systeas", "attrib": "int", "isBroad": false, "id": 95, "broad": "navig" },
   "physisc": { "name": "d100A.physisc", "attrib": "int", "isBroad": true, "id": 96, "broad": "physisc" },
   "astro": { "name": "d100A.astro", "attrib": "int", "isBroad": false, "id": 97, "broad": "physisc" },
   "chemi": { "name": "d100A.chemi", "attrib": "int", "isBroad": false, "id": 98, "broad": "physisc" },
   "physi": { "name": "d100A.physi", "attrib": "int", "isBroad": false, "id": 99, "broad": "physisc" },
   "plane": { "name": "d100A.plane", "attrib": "int", "isBroad": false, "id": 100, "broad": "physisc" },
   "secur": { "name": "d100A.secur", "attrib": "int", "isBroad": true, "id": 101, "broad": "secur" },
   "protepr": { "name": "d100A.protepr", "attrib": "int", "isBroad": false, "id": 102, "broad": "secur" },
   "securde": { "name": "d100A.securde", "attrib": "int", "isBroad": false, "id": 103, "broad": "secur" },
   "systeop": { "name": "d100A.systeop", "attrib": "int", "isBroad": true, "id": 104, "broad": "systeop" },
   "commu": { "name": "d100A.commu", "attrib": "int", "isBroad": false, "id": 105, "broad": "systeop" },
   "defen": { "name": "d100A.defen", "attrib": "int", "isBroad": false, "id": 106, "broad": "systeop" },
   "engin": { "name": "d100A.engin", "attrib": "int", "isBroad": false, "id": 107, "broad": "systeop" },
   "senso": { "name": "d100A.senso", "attrib": "int", "isBroad": false, "id": 108, "broad": "systeop" },
   "weapo": { "name": "d100A.weapo", "attrib": "int", "isBroad": false, "id": 109, "broad": "systeop" },
   "tacti": { "name": "d100A.tacti", "attrib": "int", "isBroad": true, "id": 110, "broad": "tacti" },
   "infan": { "name": "d100A.infan", "attrib": "int", "isBroad": false, "id": 111, "broad": "tacti" },
   "space": { "name": "d100A.space", "attrib": "int", "isBroad": false, "id": 112, "broad": "tacti" },
   "vehic": { "name": "d100A.vehic", "attrib": "int", "isBroad": false, "id": 113, "broad": "tacti" },
   "technsc": { "name": "d100A.technsc", "attrib": "int", "isBroad": true, "id": 114, "broad": "technsc" },
   "inven": { "name": "d100A.inven", "attrib": "int", "isBroad": false, "id": 115, "broad": "technsc" },
   "juryr": { "name": "d100A.juryr", "attrib": "int", "isBroad": false, "id": 116, "broad": "technsc" },
   "repai": { "name": "d100A.repai", "attrib": "int", "isBroad": false, "id": 117, "broad": "technsc" },
   "technkn": { "name": "d100A.technkn", "attrib": "int", "isBroad": false, "id": 118, "broad": "technsc" },

   "admin": { "name": "d100A.admin", "attrib": "wil", "isBroad": true, "id": 119, "broad": "admin" },
   "burea": { "name": "d100A.burea", "attrib": "wil", "isBroad": false, "id": 120, "broad": "admin" },
   "manag": { "name": "d100A.manag", "attrib": "wil", "isBroad": false, "id": 121, "broad": "admin" },
   "animaha": { "name": "d100A.animaha", "attrib": "wil", "isBroad": true, "id": 122, "broad": "animaha" },
   "animari": { "name": "d100A.animari", "attrib": "wil", "isBroad": false, "id": 123, "broad": "animaha" },
   "animatr": { "name": "d100A.animatr", "attrib": "wil", "isBroad": false, "id": 124, "broad": "animaha" },
   "aware": { "name": "d100A.aware", "attrib": "wil", "isBroad": true, "id": 125, "broad": "aware" },
   "intui": { "name": "d100A.intui", "attrib": "wil", "isBroad": false, "id": 126, "broad": "aware" },
   "perce": { "name": "d100A.perce", "attrib": "wil", "isBroad": false, "id": 127, "broad": "aware" },
   "creat": { "name": "d100A.creat", "attrib": "wil", "isBroad": true, "id": 128, "broad": "creat" },
   "spec2": { "name": "d100A.spec2", "attrib": "wil", "isBroad": false, "id": 129, "broad": "creat" },
   "inves": { "name": "d100A.inves", "attrib": "wil", "isBroad": true, "id": 130, "broad": "inves" },
   "interro": { "name": "d100A.interro", "attrib": "wil", "isBroad": false, "id": 131, "broad": "inves" },
   "searc": { "name": "d100A.searc", "attrib": "wil", "isBroad": false, "id": 132, "broad": "inves" },
   "track": { "name": "d100A.track", "attrib": "wil", "isBroad": false, "id": 133, "broad": "inves" },
   "resol": { "name": "d100A.resol", "attrib": "wil", "isBroad": true, "id": 134, "broad": "resol" },
   "mentare": { "name": "d100A.mentare", "attrib": "wil", "isBroad": false, "id": 135, "broad": "resol" },
   "physire": { "name": "d100A.physire", "attrib": "wil", "isBroad": false, "id": 136, "broad": "resol" },
   "streesm": { "name": "d100A.streesm", "attrib": "wil", "isBroad": true, "id": 137, "broad": "streesm" },
   "crimiel": { "name": "d100A.crimiel", "attrib": "wil", "isBroad": false, "id": 138, "broad": "streesm" },
   "streekn": { "name": "d100A.streekn", "attrib": "wil", "isBroad": false, "id": 139, "broad": "streesm" },
   "teach": { "name": "d100A.teach", "attrib": "wil", "isBroad": true, "id": 140, "broad": "teach" },
   "spec1": { "name": "d100A.spec1", "attrib": "wil", "isBroad": false, "id": 141, "broad": "teach" },

   "cultu": { "name": "d100A.cultu", "attrib": "per", "isBroad": true, "id": 142, "broad": "cultu" },
   "diplo": { "name": "d100A.diplo", "attrib": "per", "isBroad": false, "id": 143, "broad": "cultu" },
   "etiqu": { "name": "d100A.etiqu", "attrib": "per", "isBroad": false, "id": 144, "broad": "cultu" },
   "firsten": { "name": "d100A.firsten", "attrib": "per", "isBroad": false, "id": 145, "broad": "cultu" },
   "decep": { "name": "d100A.decep", "attrib": "per", "isBroad": true, "id": 146, "broad": "decep" },
   "bluff": { "name": "d100A.bluff", "attrib": "per", "isBroad": false, "id": 147, "broad": "decep" },
   "bribe": { "name": "d100A.bribe", "attrib": "per", "isBroad": false, "id": 148, "broad": "decep" },
   "gambl": { "name": "d100A.gambl", "attrib": "per", "isBroad": false, "id": 149, "broad": "decep" },
   "enter": { "name": "d100A.enter", "attrib": "per", "isBroad": true, "id": 150, "broad": "enter" },
   "act": { "name": "d100A.act", "attrib": "per", "isBroad": false, "id": 151, "broad": "enter" },
   "dance": { "name": "d100A.dance", "attrib": "per", "isBroad": false, "id": 152, "broad": "enter" },
   "musicin": { "name": "d100A.musicin", "attrib": "per", "isBroad": false, "id": 153, "broad": "enter" },
   "sing": { "name": "d100A.sing", "attrib": "per", "isBroad": false, "id": 154, "broad": "enter" },
   "interact": { "name": "d100A.interact", "attrib": "per", "isBroad": true, "id": 155, "broad": "interact" },
   "barga": { "name": "d100A.barga", "attrib": "per", "isBroad": false, "id": 156, "broad": "interact" },
   "charm": { "name": "d100A.charm", "attrib": "per", "isBroad": false, "id": 157, "broad": "interact" },
   "interv": { "name": "d100A.interv", "attrib": "per", "isBroad": false, "id": 158, "broad": "interact" },
   "intim": { "name": "d100A.intim", "attrib": "per", "isBroad": false, "id": 159, "broad": "interact" },
   "seduc": { "name": "d100A.seduc", "attrib": "per", "isBroad": false, "id": 160, "broad": "interact" },
   "taunt": { "name": "d100A.taunt", "attrib": "per", "isBroad": false, "id": 161, "broad": "interact" },
   "leade": { "name": "d100A.leade", "attrib": "per", "isBroad": true, "id": 162, "broad": "leade" },
   "comma": { "name": "d100A.comma", "attrib": "per", "isBroad": false, "id": 163, "broad": "leade" },
   "inspi": { "name": "d100A.inspi", "attrib": "per", "isBroad": false, "id": 164, "broad": "leade" },

}

d100A.phases = {

   "normal": "Normal",
   "movement": "Movement"
}




d100A.skills = {

   "armorop": "d100A.armorop",
   "combaar": "d100A.combaar",
   "powerar": "d100A.powerar",
   "athle": "d100A.athle",
   "climb": "d100A.climb",
   "jump": "d100A.jump",
   "throw": "d100A.throw",
   "throwspec": "d100A.throwspec",
   "heavywe": "d100A.heavywe",
   "direcfi": "d100A.direcfi",
   "indirfi": "d100A.indirfi",
   "meleewe": "d100A.meleewe",
   "blade": "d100A.blade",
   "bludg": "d100A.bludg",
   "powerwe": "d100A.powerwe",
   "unarmat": "d100A.unarmat",
   "brawl": "d100A.brawl",
   "powerma": "d100A.powerma",

   "acrob": "d100A.acrob",
   "dared": "d100A.dared",
   "defenma": "d100A.defenma",
   "dodge": "d100A.dodge",
   "fall": "d100A.fall",
   "fligh": "d100A.fligh",
   "zerogtr": "d100A.zerogtr",
   "zerospec": "d100A.zerospec",
   "manip": "d100A.manip",
   "lockp": "d100A.lockp",
   "pickp": "d100A.pickp",
   "prest": "d100A.prest",
   "moderra": "d100A.moderra",
   "pisto": "d100A.pisto",
   "rifle": "d100A.rifle",
   "smg": "d100A.smg",
   "primira": "d100A.primira",
   "bow": "d100A.bow",
   "cross": "d100A.cross",
   "flint": "d100A.flint",
   "sling": "d100A.sling",
   "steal": "d100A.steal",
   "hide": "d100A.hide",
   "shado": "d100A.shado",
   "sneak": "d100A.sneak",
   "vehicop": "d100A.vehicop",
   "airve": "d100A.airve",
   "landve": "d100A.landve",
   "spaceve": "d100A.spaceve",
   "waterve": "d100A.waterve",
   "movem": "d100A.movem",
   "race": "d100A.race",
   "swim": "d100A.swim",
   "trail": "d100A.trail",

   "stami": "d100A.stami",
   "endur": "d100A.endur",
   "resispa": "d100A.resispa",
   "survi": "d100A.survi",
   "survitr": "d100A.survitr",

   "busin": "d100A.busin",
   "corpo": "d100A.corpo",
   "illicbu": "d100A.illicbu",
   "smallbu": "d100A.smallbu",
   "compusc": "d100A.compusc",
   "hacki": "d100A.hacki",
   "hardw": "d100A.hardw",
   "progr": "d100A.progr",
   "demol": "d100A.demol",
   "disar": "d100A.disar",
   "scrat": "d100A.scrat",
   "setexp": "d100A.setexp",
   "knowl": "d100A.knowl",
   "compuop": "d100A.compuop",
   "deduc": "d100A.deduc",
   "firstai": "d100A.firstai",
   "speakl": "d100A.speakl",
   "speclan": "d100A.speclan",
   "law": "d100A.law",
   "courtpr": "d100A.courtpr",
   "lawen": "d100A.lawen",
   "lawspec": "d100A.lawspec",
   "lifesc": "d100A.lifesc",
   "biolo": "d100A.biolo",
   "botan": "d100A.botan",
   "genet": "d100A.genet",
   "xenol": "d100A.xenol",
   "zoolo": "d100A.zoolo",
   "medicsc": "d100A.medicsc",
   "foren": "d100A.foren",
   "medickn": "d100A.medickn",
   "psych": "d100A.psych",
   "surge": "d100A.surge",
   "treat": "d100A.treat",
   "xenom": "d100A.xenom",
   "navig": "d100A.navig",
   "driveas": "d100A.driveas",
   "surfa": "d100A.surfa",
   "systeas": "d100A.systeas",
   "physisc": "d100A.physisc",
   "astro": "d100A.astro",
   "chemi": "d100A.chemi",
   "physi": "d100A.physi",
   "plane": "d100A.plane",
   "secur": "d100A.secur",
   "protepr": "d100A.protepr",
   "securde": "d100A.securde",
   "systeop": "d100A.systeop",
   "commu": "d100A.commu",
   "defen": "d100A.defen",
   "engin": "d100A.engin",
   "senso": "d100A.senso",
   "weapo": "d100A.weapo",
   "tacti": "d100A.tacti",
   "infan": "d100A.infan",
   "space": "d100A.space",
   "vehic": "d100A.vehic",
   "technsc": "d100A.technsc",
   "inven": "d100A.inven",
   "juryr": "d100A.juryr",
   "repai": "d100A.repai",
   "technkn": "d100A.technkn",

   "admin": "d100A.admin",
   "burea": "d100A.burea",
   "manag": "d100A.manag",
   "animaha": "d100A.animaha",
   "animari": "d100A.animari",
   "animatr": "d100A.animatr",
   "aware": "d100A.aware",
   "intui": "d100A.intui",
   "perce": "d100A.perce",
   "creat": "d100A.creat",
   "spec2": "d100A.spec2",
   "inves": "d100A.inves",
   "interro": "d100A.interro",
   "searc": "d100A.searc",
   "track": "d100A.track",
   "resol": "d100A.resol",
   "mentare": "d100A.mentare",
   "physire": "d100A.physire",
   "streesm": "d100A.streesm",
   "crimiel": "d100A.crimiel",
   "streekn": "d100A.streekn",
   "teach": "d100A.teach",
   "spec1": "d100A.spec1",

   "cultu": "d100A.cultu",
   "diplo": "d100A.diplo",
   "etiqu": "d100A.etiqu",
   "firsten": "d100A.firsten",
   "decep": "d100A.decep",
   "bluff": "d100A.bluff",
   "bribe": "d100A.bribe",
   "gambl": "d100A.gambl",
   "enter": "d100A.enter",
   "act": "d100A.act",
   "dance": "d100A.dance",
   "musicin": "d100A.musicin",
   "sing": "d100A.sing",
   "interact": "d100A.interact",
   "barga": "d100A.barga",
   "charm": "d100A.charm",
   "interv": "d100A.interv",
   "intim": "d100A.intim",
   "seduc": "d100A.seduc",
   "taunt": "d100A.taunt",
   "leade": "d100A.leade",
   "comma": "d100A.comma",
   "inspi": "d100A.inspi",

}


d100A.weaponTypes = {

   "meleeW": "d100A.WeaponTypesMelee",
   "rangedW": "d100A.WeaponTypesRanged",
   "explos": "d100A.WeaponTypesExplosive",
   "heavyW": "d100A.WeaponTypesHeavy"

};
d100A.mountTypes = {

   "unmounted": "d100A.mountTypeUnmounted",
   "standard": "d100A.mountTypeStandard",
   "fixed": "d100A.mountTypeFixed",
   "turret": "d100A.mountTypeTurret"

};
d100A.manufacturers = {

   "gronk": "Gronks best Armor",
   "unknown": "Unknown",
   "generic": "Generic",
   "natural": "Natural Armor",
   "bling": "Black Lazer Int.",
   "austrinontis": "Austrin-Ontis Armor Division",
   "brusilev": "Brusilev Armor Manufacturing",
   "dietierlich": "Dietierlich Industries",
   "koshimi": "Koshimi Industries",
   "eurotech": "New EuroTech Manufacturing",
   "olsen": "Olsen Personal Defense Corp.",
   "raupp": "Raupp Arms, Thulda Prime",
   "sekuretek": "SekureTek Group Ltd."


};

d100A.hullTypes = {
   "fighter": { "name": "Fighter", "zones": 2, "baseHullPoint": 10, "zoneLimit": 7, size: "small" },
   "strikefighter": { "name": "Strike fighter", "zones": 2, "baseHullPoint": 15, "zoneLimit": 10, size: "small" },
   "cutter": { "name": "Cutter", "zones": 2, "baseHullPoint": 20, "zoneLimit": 14, size: "small" },
   "scout": { "name": "Scout", "zones": 4, "baseHullPoint": 30, "zoneLimit": 10, size: "small" },
   "escort": { "name": "Escort", "zones": 4, "baseHullPoint": 40, "zoneLimit": 14, size: "small" },
   "corvette": { "name": "Corvette", "zones": 6, "baseHullPoint": 80, "zoneLimit": 22, size: "light" },
   "heavycorvette": { "name": "Heavy Corvette", "zones": 6, "baseHullPoint": 100, "zoneLimit": 27, size: "light" },
   "frigate": { "name": "Frigate", "zones": 6, "baseHullPoint": 120, "zoneLimit": 33, size: "light" },
   "destroyer": { "name": "Destroyer", "zones": 6, "baseHullPoint": 160, "zoneLimit": 44, size: "light" },
   "lightcruiser": { "name": "Light cruiser", "zones": 8, "baseHullPoint": 320, "zoneLimit": 75, size: "medium" },
   "heavycruiser": { "name": "Heavy cruiser", "zones": 8, "baseHullPoint": 400, "zoneLimit": 96, size: "medium" },
   "armoredcruiser": { "name": "Armored cruiser", "zones": 8, "baseHullPoint": 480, "zoneLimit": 115, size: "medium" },
   "battlecruiser": { "name": "Battlecruiser", "zones": 12, "baseHullPoint": 960, "zoneLimit": 156, size: "heavy" },
   "battleship": { "name": "Battleship", "zones": 12, "baseHullPoint": 1200, "zoneLimit": 195, size: "heavy" },
   "fleetcarrier": { "name": "Fleet carrier", "zones": 12, "baseHullPoint": 1600, "zoneLimit": 260, size: "heavy" },
   "dreadnought": { "name": "Dreadnought ", "zones": 20, "baseHullPoint": 3200, "zoneLimit": 480, size: "super" },
   "supercarrier": { "name": "Super-carrier", "zones": 20, "baseHullPoint": 4000, "zoneLimit": 600, size: "super" },
   "superdread": { "name": "Super-dread.", "zones": 20, "baseHullPoint": 6400, "zoneLimit": 960, size: "super" },
   "fortressship": { "name": "Fortress ship", "zones": 20, "baseHullPoint": 12000, "zoneLimit": 1800, size: "super" },

   "launch": { "name": "Launch", "zones": 2, "baseHullPoint": 8, "zoneLimit": 5, size: "small" },
   "courier": { "name": "Courier", "zones": 2, "baseHullPoint": 16, "zoneLimit": 10, size: "small" },
   "trader": { "name": "Trader", "zones": 2, "baseHullPoint": 24, "zoneLimit": 8, size: "small" },
   "fastfreighter": { "name": "Fast freighter", "zones": 2, "baseHullPoint": 32, "zoneLimit": 11, size: "small" },
   "fasttransport": { "name": "Fast transport", "zones": 2, "baseHullPoint": 40, "zoneLimit": 14, size: "small" },
   "hauler": { "name": "Hauler", "zones": 2, "baseHullPoint": 72, "zoneLimit": 20, size: "light" },
   "industrial": { "name": "Industrial", "zones": 2, "baseHullPoint": 96, "zoneLimit": 27, size: "light" },
   "mediumfreighter": { "name": "Medium freighter", "zones": 2, "baseHullPoint": 240, "zoneLimit": 58, size: "medium" },
   "clipper": { "name": "Clipper", "zones": 2, "baseHullPoint": 360, "zoneLimit": 87, size: "medium" },
   "mediumtransport": { "name": "Medium transport", "zones": 2, "baseHullPoint": 480, "zoneLimit": 115, size: "medium" },
   "tanker": { "name": "Tanker", "zones": 2, "baseHullPoint": 720, "zoneLimit": 117, size: "heavy" },
   "liner": { "name": "Liner", "zones": 2, "baseHullPoint": 840, "zoneLimit": 137, size: "heavy" },
   "heavytransport": { "name": "Heavy transport", "zones": 2, "baseHullPoint": 1280, "zoneLimit": 208, size: "heavy" },
   "superfreighter": { "name": "Super-freighter", "zones": 2, "baseHullPoint": 2400, "zoneLimit": 360, size: "super" },
   "colonytransport": { "name": "Colony transport", "zones": 2, "baseHullPoint": 3600, "zoneLimit": 540, size: "super" },
   "special": { "name": "Special", "zones": 1, "baseHullPoint": 10, "zoneLimit": 10, size: "small" },


};

d100A.progressLevel = {

   "0": "d100A.Progress0",
   "1": "d100A.Progress1",
   "2": "d100A.Progress2",
   "3": "d100A.Progress3",
   "4": "d100A.Progress4",
   "5": "d100A.Progress5",
   "6": "d100A.Progress6",
   "7": "d100A.Progress7",
   "8": "d100A.Progress8",
   "9": "d100A.Progress9"

};

d100A.pubnsource = {
   "core": "d100A.source.core",
   "gmg": "d100A.source.gmg",
   "starships": "d100A.source.starships",
   "warships": "d100A.source.warships",
   "tangents": "d100A.source.tangents",
   "dataware": "d100A.source.dataware",
   "mindwalking": "d100A.source.mindwalking",
   "dragon273": "d100A.source.dragon273",
   "externals": "d100A.source.externals",
   "gammaworld": "d100A.source.gammaworld",
   "sdaeg": "d100A.source.sdaeg",
   "campaign": "d100A.source.campaign"

};

d100A.availability = {
   "any": "d100A.availany",
   "com": "d100A.availcom",
   "con": "d100A.availcon",
   "mil": "d100A.availmil",
   "res": "d100A.availres"


};
d100A.damagetype = {

   "LI": "d100A.Items.Weapon.type.LI",
   "HI": "d100A.Items.Weapon.type.HI",
   "EN": "d100A.Items.Weapon.type.EN"
},


   d100A.firepower = {
      "O": "d100A.Items.Weapon.firepower.O",
      "G": "d100A.Items.Weapon.firepower.G",
      "A": "d100A.Items.Weapon.firepower.A"
   }
//[data.firepower][armor.system.firepower]
d100A.firepowerRating = {
   "G": {
      "G": { "stu": "stu", "wou": "wou", "mor": "mor", "cri": "cri" },
      "A": { "stu": null, "wou": "stu", "mor": "wou", "cri": "mor" },
      "L": { "stu": null, "wou": null, "mor": "stu", "cri": "wou" },
      "M": { "stu": null, "wou": null, "mor": null, "cri": "stu" },
      "H": { "stu": null, "wou": null, "mor": null, "cri": null },
      "S": {
         "stu": null, "wou": null, "mor": null, "cri": null
      }
   },
   "A": {
      "A": { "stu": "stu", "wou": "wou", "mor": "mor", "cri": "cri" },
      "L": { "stu": null, "wou": "stu", "mor": "wou", "cri": "mor" },
      "M": { "stu": null, "wou": null, "mor": "stu", "cri": "wou" },
      "H": { "stu": null, "wou": null, "mor": null, "cri": "stu" },
      "S": { "stu": null, "wou": null, "mor": null, "cri": null },
      "G": {
         "stu": "wou", "wou": "mor", "mor": "cri", "cri": "cri"
      }
   },
   "L": {
      "L": { "stu": "stu", "wou": "wou", "mor": "mor", "cri": "cri" },
      "M": { "stu": null, "wou": "stu", "mor": "wou", "cri": "mor" },
      "H": { "stu": null, "wou": null, "mor": "stu", "cri": "wou" },
      "S": { "stu": null, "wou": null, "mor": null, "cri": "stu" },
      "G": { "stu": "mor", "wou": "cri", "mor": "cri", "cri": "cri" },
      "A": {
         "stu": "wou", "wou": "mor", "mor": "cri", "cri": "cri"
      }
   },
   "M": {
      "M": { "stu": "stu", "wou": "wou", "mor": "mor", "cri": "cri" },
      "H": { "stu": null, "wou": "stu", "mor": "wou", "cri": "mor" },
      "S": { "stu": null, "wou": null, "mor": "stu", "cri": "wou" },
      "G": { "stu": "cri", "wou": "cri", "mor": "cri", "cri": "cri" },
      "A": { "stu": "mor", "wou": "cri", "mor": "cri", "cri": "cri" },
      "L": {
         "stu": "wou", "wou": "mor", "mor": "cri", "cri": "cri"
      }
   },
   "H": {
      "H": { "stu": "stu", "wou": "wou", "mor": "mor", "cri": "cri" },
      "S": { "stu": null, "wou": "stu", "mor": "wou", "cri": "mor" },
      "G": { "stu": "cri", "wou": "cri", "mor": "cri", "cri": "cri" },
      "A": { "stu": "cri", "wou": "cri", "mor": "cri", "cri": "cri" },
      "L": { "stu": "mor", "wou": "cri", "mor": "cri", "cri": "cri" },
      "M": {
         "stu": "wou", "wou": "mor", "mor": "cri", "cri": "cri"
      }
   },
   "S": {
      "S": { "stu": "stu", "wou": "wou", "mor": "mor", "cri": "cri" },
      "G": { "stu": "cri", "wou": "cri", "mor": "cri", "cri": "cri" },
      "A": { "stu": "cri", "wou": "cri", "mor": "cri", "cri": "cri" },
      "L": { "stu": "cri", "wou": "cri", "mor": "cri", "cri": "cri" },
      "M": { "stu": "mor", "wou": "cri", "mor": "cri", "cri": "cri" },
      "H": {
         "stu": "wou", "wou": "mor", "mor": "cri", "cri": "cri"
      }
   }



}
d100A.firepowerMultiplier = {
   "G": {
      "G": { "stu": 1, "wou": 1, "mor": 1, "cri": 1 },
      "A": { "stu": 0, "wou": 1, "mor": 1, "cri": 1 },
      "L": { "stu": 0, "wou": 0, "mor": 1, "cri": 1 },
      "M": { "stu": 0, "wou": 0, "mor": 0, "cri": 1 },
      "H": { "stu": 0, "wou": 0, "mor": 0, "cri": 0 },
      "S": {
         "stu": 0, "wou": 0, "mor": 0, "cri": 0
      }
   },
   "A": {
      "A": { "stu": 1, "wou": 1, "mor": 1, "cri": 1 },
      "L": { "stu": 0, "wou": 1, "mor": 1, "cri": 1 },
      "M": { "stu": 0, "wou": 0, "mor": 1, "cri": 1 },
      "H": { "stu": 0, "wou": 0, "mor": 0, "cri": 1 },
      "S": { "stu": 0, "wou": 0, "mor": 0, "cri": 0 },
      "G": {
         "stu": 1, "wou": 1, "mor": 1, "cri": 2
      }
   },
   "L": {
      "L": { "stu": 1, "wou": 1, "mor": 1, "cri": 1 },
      "M": { "stu": 0, "wou": 1, "mor": 1, "cri": 1 },
      "H": { "stu": 0, "wou": 0, "mor": 1, "cri": 1 },
      "S": { "stu": 0, "wou": 0, "mor": 0, "cri": 1 },
      "G": { "stu": 1, "wou": 1, "mor": 2, "cri": 3 },
      "A": {
         "stu": 1, "wou": 1, "mor": 1, "cri": 2
      }
   },
   "M": {
      "M": { "stu": 1, "wou": 1, "mor": 1, "cri": 1 },
      "H": { "stu": 0, "wou": 1, "mor": 1, "cri": 1 },
      "S": { "stu": 0, "wou": 0, "mor": 1, "cri": 1 },
      "G": { "stu": 1, "wou": 2, "mor": 3, "cri": 4 },
      "A": { "stu": 1, "wou": 1, "mor": 2, "cri": 3 },
      "L": {
         "stu": 1, "wou": 1, "mor": 1, "cri": 2
      }
   },
   "H": {
      "H": { "stu": 1, "wou": 1, "mor": 1, "cri": 1 },
      "S": { "stu": 0, "wou": 1, "mor": 1, "cri": 1 },
      "G": { "stu": 2, "wou": 3, "mor": 4, "cri": 4 },
      "A": { "stu": 1, "wou": 2, "mor": 3, "cri": 4 },
      "L": { "stu": 1, "wou": 1, "mor": 2, "cri": 3 },
      "M": {
         "stu": 1, "wou": 1, "mor": 1, "cri": 2
      }
   },
   "S": {
      "S": { "stu": 1, "wou": 1, "mor": 1, "cri": 1 },
      "G": { "stu": 3, "wou": 4, "mor": 4, "cri": 4 },
      "A": { "stu": 2, "wou": 3, "mor": 4, "cri": 4 },
      "L": { "stu": 1, "wou": 2, "mor": 3, "cri": 4 },
      "M": { "stu": 1, "wou": 1, "mor": 2, "cri": 3 },
      "H": {
         "stu": 1, "wou": 1, "mor": 1, "cri": 2
      }
   }







}

d100A.starshipFirepowerDial = {

   "G": "d100A.Items.StarshipWeapon.firepower.G",
   "A": "d100A.Items.StarshipWeapon.firepower.A",
   "L": "d100A.Items.StarshipWeapon.firepower.L",
   "M": "d100A.Items.StarshipWeapon.firepower.M",
   "H": "d100A.Items.StarshipWeapon.firepower.H",
   "S": "d100A.Items.StarshipWeapon.firepower.S"
}
d100A.starshipFirepower = {

   "good": "d100A.Items.StarshipWeapon.firepower.G",
   "small": "d100A.Items.StarshipWeapon.firepower.A",
   "light": "d100A.Items.StarshipWeapon.firepower.L",
   "medium": "d100A.Items.StarshipWeapon.firepower.M",
   "heavy": "d100A.Items.StarshipWeapon.firepower.H",
   "super": "d100A.Items.StarshipWeapon.firepower.S"
}
d100A.starshipFirepowerExtra = {
   "abbr": {
      "good": "G",
      "small": "A",
      "light": "L",
      "medium": "M",
      "heavy": "H",
      "super": "S"
   },
   "val": {
      "good": 2,
      "small": 3,
      "light": 4,
      "medium": 5,
      "heavy": 6,
      "super": 7
   }
}


d100A.toughnessrbyHullpoints = { "civilian": 30 }

d100A.toughnessbyType =
{
   "civilian": {
      "vsmall": "good",
      "small": "small",
      "light": "small",
      "medium": "light",
      "heavy": "medium",
      "super": "heavy"
   },
   "military": {
      "small": "small",
      "light": "light",
      "medium": "medium",
      "heavy": "heavy",
      "super": "super"
   }

}


d100A.mode = {
   "fire": "d100A.Items.Weapon.fire",
   "burst": "d100A.Items.Weapon.burst",
   "auto": "d100A.Items.Weapon.auto"

}

d100A.starshipMode = {
   "fire": "d100A.Items.Weapon.fire",
   "burst": "d100A.Items.Weapon.burst",
   "auto": "d100A.Items.Weapon.auto",
   "battery": "d100A.Items.Weapon.battery"

}
d100A.range = {
   "short": "d100A.Items.Weapon.range.short",
   "medium": "d100A.Items.Weapon.range.medium",
   "long": "d100A.Items.Weapon.range.long"

}
d100A.damage = {
   "ord": "d100A.Items.Weapon.damage.ord",
   "goo": "d100A.Items.Weapon.damage.goo",
   "ama": "d100A.Items.Weapon.damage.ama"

}
d100A.starshipDurability = {
   "stu": "d100A.stun",
   "wou": "d100A.wound",
   "mor": "d100A.mortal",
   "cri": "d100A.critical"
}
d100A.damageQ = {
   "stu": "d100A.stun",
   "wou": "d100A.wound",
   "mor": "d100A.mortal"

}

d100A.starshipSensorModes = {
   "active": "d100A.ShipSystems.starshipSensorModes.Active",
   "passive": "d100A.ShipSystems.starshipSensorModes.Passive",
};

d100A.starshipSensorTypes = {
   "radar": "d100A.ShipSystems.starshipSensorTypes.Radar",
   "laser": "d100A.ShipSystems.starshipSensorTypes.Laser",
   "mass": "d100A.ShipSystems.starshipSensorTypes.Mass",
   "thermal": "d100A.ShipSystems.starshipSensorTypes.Thermal",
   "psi": "d100A.ShipSystems.starshipSensorTypes.Psi",

};

d100A.hitLocation = {
   "small2": {
      "die": 6,
      "fwd": { "F": [1, 2, 3, 4, 5], "A": [6] },
      "port": { "F": [1, 2, 3], "A": [4, 5, 6] },
      "stbd": { "F": [1, 2, 3], "A": [4, 5, 6] },
      "aft": { "F": [1], "A": [2, 3, 4, 5, 6] }
   },
   "small4": {
      "die": 8,
      "fwd": { "F": [1, 2, 3], "FC": [4, 5, 6], "AC": [7, 8], "A": [] },
      "port": { "F": [1, 2], "FC": [3, 4], "AC": [5, 6], "A": [7, 8] },
      "stbd": { "F": [1, 2], "FC": [3, 4], "AC": [5, 6], "A": [7, 8] },
      "aft": { "F": [], "FC": [1, 2], "AC": [3, 4, 5], "A": [6, 7, 8] }
   },
   "light": {
      "die": 8,
      "fwd": { "F": [1, 2], "FC": [3, 4], "L": [5, 6], "R": [7, 8], "AC": [], "A": [] },
      "port": { "F": [1, 2], "FC": [3, 4], "L": 5, "R": [], "AC": [5, 6], "A": [7, 8] },
      "stbd": { "F": [1, 2], "FC": [3, 4], "L": [], "R": [5], "AC": [5, 6], "A": [7, 8] },
      "aft": { "F": [], "FC": [], "L": [1, 2], "R": [3, 4], "AC": [5, 6], "A": [7, 8] }
   },
   "medium": {
      "die": 12,
      "fwd": { "F": [1, 2, 3], "FL": [4, 5], "FC": [6, 7], "FR": [8, 9], "AL": [10], "AC": [11], "AR": [12], "A": [] },
      "port": { "F": [1, 2], "FL": [3, 4, 5], "FC": [6], "FR": [], "AL": [7, 8, 9], "AC": [10], "AR": [], "A": [11, 12] },
      "stbd": { "F": [1, 2], "FL": [], "FC": [3], "FR": [4, 5, 6], "AL": [], "AC": [7], "AR": [8, 9, 10], "A": [11, 12] },
      "aft": { "F": [], "FL": [1], "FC": [2], "FR": [3], "AL": [4, 5], "AC": [6, 7], "AR": [8, 9], "A": [10, 11, 12] }
   },
   "heavy": {
      "die": 20,
      "fwd": { "F": [1, 2, 3, 4, 5], "FC": [6, 7], "FL": [8, 9, 10, 11], "CF": [12, 13], "FR": [14, 15, 16, 17], "L": [18], "CA": [19], "R": [20], "AL": [], "AC": [], "AR": [], "A": [] },
      "port": { "F": [1, 2], "FC": [3, 4], "FL": [5, 6, 7], "CF": [8], "FR": [], "L": [9, 10, 11, 12], "CA": [13], "R": [], "AL": [14, 15, 16], "AC": [17, 18], "AR": [], "A": [19, 20] },
      "stbd": { "F": [1, 2], "FC": [3, 4], "FL": [], "CF": [5], "FR": [6, 7, 8], "L": [], "CA": [9], "R": [10, 11, 12, 13], "AL": [], "AC": [14, 15], "AR": [16, 17, 18], "A": [19, 20] },
      "aft": { "F": [], "FC": [], "FL": [], "CF": [1], "FR": [], "L": [2], "CA": [3, 4], "R": [5], "AL": [6, 7, 8.9], "AC": [10, 11], "AR": [12, 13, 14, 15], "A": [16, 17, 18, 19, 20] }
   },
   "super": {
      "die": 20,
      "fwd": { "F": [1, 2, 3], "FFC": [4, 5], "FFL": [6, 7, 8], "FC": [9], "FFR": [9, 10, 11, 12], "FL": [13, 14], "CF": [], "FR": [15, 16], "L": [17, 18], "CL": [], "CA": [], "CR": [], "R": [19, 20], "AL": [], "AC": [], "AR": [], "AAL": [], "AAC": [], "AAR": [], "A": [] },
      "port": { "F": [1], "FFC": [2], "FFL": [3, 4], "FC": [5], "FFR": [], "FL": [6, 7], "CF": [8], "FR": [], "L": [9, 10], "CL": [11, 12], "CA": [13], "CR": [], "R": [], "AL": [14, 15], "AC": [16], "AR": [], "AAL": [17, 18], "AAC": [19], "AAR": [], "A": [20] },
      "stbd": { "F": [1], "FFC": [2], "FFL": [], "FC": [3], "FFR": [4, 5], "FL": [], "CF": [6], "FR": [7, 8], "L": [], "CL": [], "CA": [9], "CR": [10, 11], "R": [12, 13], "AL": [], "AC": [14], "AR": [15, 16], "AAL": [], "AAC": [17], "AAR": [18, 19], "A": [20] },
      "aft": { "F": [], "FFC": [], "FFL": [], "FC": [], "FFR": [], "FL": [], "CF": [], "FR": [], "L": [1, 2], "CL": [], "CA": [], "CR": [], "R": [3, 4], "AL": [5, 6], "AC": [7], "AR": [8, 9], "AAL": [10, 11, 12], "AAC": [13, 14], "AAR": [15, 16, 17], "A": [18, 19, 20] }
   }


}






d100A.compartment = {
   "small2": { "F": "Forward", "A": "Aft" },
   "small4": { "F": "Forward", "FC": "Forward Centre", "AC": "Aft Centre", "A": "Aft" },
   "light": { "F": "Forward", "FC": "Forward Centre", "AC": "Aft Centre", "A": "Aft", "L": "Left", "R": "Right" },
   "medium": { "F": "Forward", "FC": "Forward Centre", "AC": "Aft Centre", "A": "Aft", "FL": "Forward Left", "FR": "Forward Right", "AL": "Aft Left", "AR": "Aft Right" },
   "heavy": { "F": "Forward", "FC": "Forward Centre", "CF": "Centre Forward", "CA": "Centre Aft", "AC": "Aft Centre", "A": "Aft", "FL": "Forward Left", "FR": "Forward Right", "L": "Left", "R": "Right", "AL": "Aft Left", "AR": "Aft Right" },
   "super": { "F": "Forward", "FFC": "Forward Forward Centre", "FC": "Forward Centre", "CF": "Centre Forward", "CA": "Centre Aft", "AC": "Aft Centre", "AAC": "Aft Aft Centre", "A": "Aft", "FFL": "Forward Forward Left", "FFR": "Forward Forward Right", "FL": "Forward Left", "FR": "Forward Right", "CL": "Centre Left", "CR": "Centre Right", "AL": "Aft Left", "AR": "Aft Right", "AAL": "Aft Aft Left", "AAR": "Aft Aft Right", "L": "Left", "R": "Right" }

}
d100A.compartmentDurability = { "stu": { "name": "Stun", "value": 0, "max": 1, "EndPhase": 0, "good": [], "bad": [] }, "wou": { "name": "Wound", "value": 0, "max": 0, "EndPhase": 0, "good": [], "bad": [] }, "mor": { "name": "Mortal", "value": 0, "max": 0, "EndPhase": 0, "good": [], "bad": [] } }

d100A.starship = {
   "compartmentShape": {
      "small2": [[false, "F", false], [false, "A", false]],
      "small4": [[false, "F", false], [false, "FC", false], [false, "AC", false], [false, "A", false]],
      "light": [[false, "F", false], [false, "FC", false], ["L", "AC", "R"], [false, "A", false]],
      "medium": [[false, "F", false], ["FL", "FC", "FR"], ["AL", "AC", "AR"], [false, "A", false]],
      "heavy": [[false, "F", false], ["FL", "FC", "FR"], [false, "CF", false], ["L", "CA", "R"], ["AL", "AC", "AR"], [false, "A", false]],
      "super": [[false, "F", false], [false, "FFC", false], ["FFL", "FC", "FFR"], ["FL", "CF", "FR"], ["CL", "CA", "CR"], ["AL", "AC", "AR"], ["AAL", "AAC", "AAR"], [false, "A", false], ["L", false, "R"]],
   },
   "numCompartments": {
      "small2": 2,
      "small4": 4,
      "light": 6,
      "medium": 8,
      "heavy": 12,
      "super": 20
   }

}

d100A.shortcompartments = {
   "small2": ["F", "A"],
   "small4": ["F", "FC", "AC", "A"],
   "light": ["F", "FC", "AC", "A", "L", "R"],
   "medium": ["F", "FC", "AC", "A", "FL", "FR", "AL", "AR"],
   "heavy": ["F", "FC", "CF", "CA", "AC", "A", "FL", "FR", "L", "R", "AL", "AR"],
   "super": ["F", "FFC", "FC", "CF", "CA", "AC", "AAC", "A", "FFL", "FFR", "FL", "FR", "CL", "CR", "AL", "AR", "AAL", "AAR", "L", "R"],
}


d100A.compartments = {
   "small2": [
      { name: "Forward", location: "F", contents: {}, shortname: "FWD", contents: [], sub: "A" },
      { name: "Aft", location: "A", contents: {}, shortname: "AFT", contents: [], sub: "F" }
   ],
   "small4": [
      { name: "Forward", location: "F", contents: {}, shortname: "FWD", contents: [], sub: "FC" },
      { name: "Forward Centre", location: "FC", contents: {}, shortname: "FWD-CTR", contents: [], sub: "AC" },
      { name: "Aft Centre", location: "A", contents: {}, shortname: "AFT-CTR", contents: [], sub: "FC" },
      { name: "Aft", location: "A", contents: {}, shortname: "AFT", contents: [], sub: "AC" }
   ],
   "light": [
      { name: "Forward", location: "F", contents: {}, shortname: "FWD", contents: [], sub: "FC" },
      { name: "Forward Centre", location: "FC", contents: {}, shortname: "FWD-CTR", contents: [], sub: "AC" },
      { name: "Aft Centre", location: "AC", contents: {}, shortname: "AFT-CTR", contents: [], sub: "FC" },
      { name: "Aft", location: "A", contents: {}, shortname: "AFT", contents: [], sub: "AC" },
      { name: "Left", location: "L", contents: {}, shortname: "LH", contents: [], sub: "AC" },
      { name: "Right", location: "R", contents: {}, shortname: "RH", contents: [], sub: "AC" }
   ],
   "medium": [
      { name: "Forward", location: "F", contents: {}, shortname: "FWD", contents: [], sub: "FC" },
      { name: "Forward Centre", location: "FC", contents: {}, shortname: "FWD-CTR", contents: [], sub: "AC" },
      { name: "Aft Centre", location: "AC", contents: {}, shortname: "AFT-CTR", contents: [], sub: "FC" },
      { name: "Aft", location: "A", contents: {}, shortname: "AFT", contents: [], sub: "AC" },
      { name: "Forward Left", location: "FL", contents: {}, shortname: "FWD-LH", contents: [], sub: "FC" },
      { name: "Forward Right", location: "FR", contents: {}, shortname: "FWD-RH", contents: [], sub: "FC" },
      { name: "Aft Left", location: "AL", contents: {}, shortname: "AFT-LH", contents: [], sub: "AC" },
      { name: "Aft Right", location: "AR", contents: {}, shortname: "AFT-RH", contents: [], sub: "AC" }
   ],
   "heavy": [
      { name: "Forward", location: "F", contents: {}, shortname: "FWD", contents: [], sub: "FC" },
      { name: "Forward Centre", location: "FC", contents: {}, shortname: "FWD-CTR", contents: [], sub: "CF" },
      { name: "Centre Forward", location: "CF", contents: {}, shortname: "CTR-FWD", contents: [], sub: "CA" },
      { name: "Centre Aft", location: "CA", contents: {}, shortname: "CTR-AFT", contents: [], sub: "CF" },
      { name: "Aft Centre", location: "AC", contents: {}, shortname: "AFT-CTR", contents: [], sub: "CA" },
      { name: "Aft", location: "A", contents: {}, shortname: "AFT", contents: [], sub: "AC" },
      { name: "Forward Left", location: "FL", contents: {}, shortname: "FWD-LH", contents: [], sub: "FC" },
      { name: "Forward Right", location: "FR", contents: {}, shortname: "FWD-RH", contents: [], sub: "FC" },
      { name: "Left", location: "L", contents: {}, shortname: "LH", contents: [], sub: "CA" },
      { name: "Right", location: "R", contents: {}, shortname: "RH", contents: [], sub: "CA" },
      { name: "Aft Left", location: "AL", contents: {}, shortname: "AFT-LH", contents: [], sub: "AC" },
      { name: "Aft Right", location: "AR", contents: {}, shortname: "AFT-RH", contents: [], sub: "AC" }
   ],
   "super": [
      { name: "Forward", location: "F", contents: {}, shortname: "FWD", contents: [], sub: "FFC" },
      { name: "Forward Forward Centre", location: "FFC", contents: {}, shortname: "FWD-FWD-CTR", contents: [], sub: "FC" },
      { name: "Forward Centre", location: "FC", contents: {}, shortname: "FWD-CTR", contents: [], sub: "CF" },
      { name: "Centre Forward", location: "CF", contents: {}, shortname: "CTR-FWD", contents: [], sub: "CA" },
      { name: "Centre Aft", location: "CA", contents: {}, shortname: "CTR-AFT", contents: [], sub: "CF" },
      { name: "Aft Centre", location: "AC", contents: {}, shortname: "AFT-CTR", contents: [], sub: "CA" },
      { name: "Aft Aft Centre", location: "AAC", contents: {}, shortname: "AFT-AFT-CTR", contents: [], sub: "CA" },
      { name: "Aft", location: "A", contents: {}, shortname: "AFT", contents: [], sub: "AAC" },
      { name: "Forward Forward Left", location: "FFL", contents: {}, shortname: "FWD-FWD-LH", contents: [], sub: "FC" },
      { name: "Forward Forward Right", location: "FFR", contents: {}, shortname: "FWD-FWD-RH", contents: [], sub: "FC" },
      { name: "Forward Left", location: "FL", contents: {}, shortname: "FWD-LH", contents: [], sub: "CF" },
      { name: "Forward Right", location: "FR", contents: {}, shortname: "FWD-RH", contents: [], sub: "CF" },
      { name: "Centre Left", location: "CL", contents: {}, shortname: "CTR-LH", contents: [], sub: "CA" },
      { name: "Centre Right", location: "CR", contents: {}, shortname: "CTR-RH", contents: [], sub: "CA" },
      { name: "Aft Left", location: "AL", contents: {}, shortname: "AFT-LH", contents: [], sub: "AC" },
      { name: "Aft Right", location: "AR", contents: {}, shortname: "AFT-RH", contents: [], sub: "AC" },
      { name: "Aft Aft Left", location: "AAL", contents: {}, shortname: "AFT-AFT-LH", contents: [], sub: "AAC" },
      { name: "Aft Aft Right", location: "AAR", contents: {}, shortname: "AFT-AFT-RH", contents: [], sub: "AAC" },
      { name: "Left", location: "L", contents: {}, shortname: "LH", contents: [], sub: "CL" },
      { name: "Right", location: "R", contents: {}, shortname: "RH", contents: [], sub: "CR" }
   ]
};
d100A.compartmentData = {



   "F": {

      "name": "Forward",
      "location": "F",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 5,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "FFC": {

      "name": "Forward Forward Centre",
      "location": "FFC",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "FC": {

      "name": "Forward Centre",
      "location": "FC",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "CF": {

      "name": "Centre Forward",
      "location": "CF",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "CA": {

      "name": "Centre Aft",
      "location": "CA",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "AC": {

      "name": "Aft Centre",
      "location": "AC",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "AAC": {

      "name": "Aft Aft Centre",
      "location": "AAC",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "A": {

      "name": "Aft",
      "location": "A",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "FFL": {

      "name": "Forward Forward Left",
      "location": "FFL",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "FFR": {

      "name": "Forward Forward Right",
      "location": "FFR",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "FL": {

      "name": "Forward Left",
      "location": "FL",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "FR": {

      "name": "Forward Right",
      "location": "FR",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "CL": {

      "name": "Centre Left",
      "location": "CR",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "CR": {

      "name": "Centre Right",
      "location": "CR",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "AL": {

      "name": "Aft Left",
      "location": "AL",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "AR": {

      "name": "Aft Right",
      "location": "AR",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "AAL": {

      "name": "Aft Aft Left",
      "location": "AAL",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "AAR": {

      "name": "Aft Aft Right",
      "location": "AAR",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "L": {

      "name": "Left",
      "location": "L",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   },
   "R": {

      "name": "Right",
      "location": "R",
      "contents": [],
      "sub": "",
      "isCompartment": false,
      "value": 0,
      "max": 10,
      "durability": { "stu": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Stun", "value": 0 }, "wou": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Wound", "value": 0 }, "mor": { "endPhase": 0, "bad": [], "good": [], "max": 0, "name": "Mortal", "value": 0 } }
   }


},

   d100A.modifierResistanceAffectedValues = {
      "str": "d100A.RestistanceModifierSTR",
      "dex": "d100A.RestistanceModifierDEX",
      "con": "d100A.RestistanceModifierCON",
      "int": "d100A.RestistanceModifierINT",
      "wil": "d100A.RestistanceModifierWIL",
      "per": "d100A.RestistanceModifierPER"
   };
d100A.coverType = {
   "+0": "d100A.CoverType.none",
   "+1": "d100A.CoverType.Light",
   "+2": "d100A.CoverType.Medium",
   "+3": "d100A.CoverType.Heavy",
}
d100A.movementType = {
   "0": "d100A.MovementType.none",
   "2": "d100A.MovementType.Run",
   "s2": "d100A.MovementType.ESwim",
   "3": "d100A.MovementType.Sprint"

}
d100A.dodgeType = {
   "-2": "d100A.DodgeType.-2",
   "+0": "d100A.DodgeType.0",
   "+1": "d100A.DodgeType.1",
   "+2": "d100A.DodgeType.2",
   "+3": "d100A.DodgeType.3"
}
d100A.resistanceType = {
   "-5": "-5",
   "-4": "-4",
   "-3": "-3",
   "-2": "-2",
   "-1": "-1",
   "+0": "+0",
   "+1": "+1",
   "+2": "+2",
   "+3": "+3",
   "+4": "+4",
   "+5": "+5",
   "+6": "+6"
}


d100A.allowableSkills = {
   "meleeW": {
      "blade": "d100A.blade",
      "bludg": "d100A.bludg",
      "powerwe": "d100A.powerwe",
      "unarmat": "d100A.unarmat",
      "brawl": "d100A.brawl",
      "powerma": "d100A.powerma",
   },
   "rangedW": {
      "throw": "d100A.throw",
      "pisto": "d100A.pisto",
      "rifle": "d100A.rifle",
      "smg": "d100A.smg",
      "bow": "d100A.bow",
      "cross": "d100A.cross",
      "flint": "d100A.flint"
   },
   "explos": {
      "throw": "d100A.throw"
   },

   "heavyW": {
      "direcfi": "d100A.direcfi",
      "indirfi": "d100A.indirfi"
   }

}

d100A.modifierEffectTypes = {
   "all-actions": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllActions",
   "ignore-mortal": "SFRPG.ActorSheet.Modifiers.EffectTypes.IgnoreMortal",
   "actions": "SFRPG.ModifierEffectTypeActions",
   "hit-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Hitpoints",
   "ac": "SFRPG.ModifierEffectTypeAC",

   //"hit-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Hitpoints",

   "initiative": "SFRPG.ModifierEffectTypeInit",

   "skill": "SFRPG.ModifierEffectTypeSkill",
   "all-skills": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllSkills",
   //"skill-ranks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SkillRanks",

   //"ranged-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.RangedAttackRolls",
   // "melee-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.MeleeAttackRolls",
   // "spell-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpellAttackRolls",
   // "weapon-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpecificWeaponAttackRolls",
   // "all-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllAttackRolls",

   /* "stamina-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Stamina",
    "resolve-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Resolve",
    "base-attack-bonus": "SFRPG.ActorSheet.Modifiers.EffectTypes.BaseAttackBonus",
    "cmd": "SFRPG.ModifierEffectTypeCMD",
    "acp": "SFRPG.ModifierEffectTypeACP",
    
    "ability-skills": "SFRPG.ModifierEffectTypeAbilitySkills",*/
   "ability-score": "SFRPG.ModifierEffectTypeAbilityScore",
   /*"ability-check": "SFRPG.ModifierEffectTypeAbilityCheck",
   "ability-checks": "SFRPG.ModifierEffectTypeAbilityChecks",
   
   "all-skills": "SFRPG.ModifierEffectTypeAllSkills",
   "skill-points": "SFRPG.ActorSheet.Modifiers.EffectTypes.Skillpoints",
   "skill-ranks": "SFRPG.ActorSheet.Modifiers.EffectTypes.SkillRanks",
   "saves": "SFRPG.ModifierEffectTypeSaves",
   "save": "SFRPG.ModifierEffectTypeSave",

   "weapon-property-attacks": "SFRPG.ActorSheet.Modifiers.EffectTypes.WeaponPropertyAttackRolls",
   "ranged-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.RangedAttackDamage",
   "melee-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.MeleeAttackDamage",
   "spell-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpellAttackDamage",
   "weapon-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpecificWeaponAttackDamage",
   "all-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllAttackDamage",
   "weapon-property-damage": "SFRPG.ActorSheet.Modifiers.EffectTypes.WeaponPropertyDamage",
   "bulk": "SFRPG.ActorSheet.Modifiers.EffectTypes.Encumbrance",
   "all-speeds": "SFRPG.ActorSheet.Modifiers.EffectTypes.AllSpeeds",
   "specific-speed": "SFRPG.ActorSheet.Modifiers.EffectTypes.SpecificSpeed",
   "multiply-all-speeds": "SFRPG.ActorSheet.Modifiers.EffectTypes.MultiplyAllSpeeds",


   "actor-resource": "SFRPG.ActorSheet.Modifiers.EffectTypes.ActorResource"*/
};
d100A.psionAbility = {
   "con": "d100A.AbilityCon",
   "int": "d100A.AbilityInt",
   "wil": "d100A.AbilityWil",
   "per": "d100A.AbilityPer"

};
d100A.psionBroadSkill = {
   "con": {
      "name": "d100A.PsionBroadSkills.con.name",
      "tooltip": "d100A.PsionBroadSkills.con.tooltip"
   },
   "int": {
      "name": "d100A.PsionBroadSkills.int.name",
      "tooltip": "d100A.PsionBroadSkills.int.tooltip"
   },
   "wil": {
      "name": "d100A.PsionBroadSkills.wil.name",
      "tooltip": "d100A.PsionBroadSkills.int.tooltip"
   },
   "per": {
      "name": "d100A.PsionBroadSkills.per.name",
      "tooltip": "d100A.PsionBroadSkills.per.tooltip"
   }



}

d100A.modifierType = {
   "constant": "SFRPG.ModifierTypeConstant",
   "formula": "SFRPG.ModifierTypeFormula"
};

d100A.modifierArmorClassAffectedValues = {
   "both": "SFRPG.ModifierArmorClassBoth",
   "eac": "SFRPG.EnergyArmorClass",
   "kac": "SFRPG.KineticArmorClass"
};

d100A.modifierActionCheckAffectedValues = {
   //"fat": "d100A.hptype.fat",
   "bonus": "d100A.modifierNames.bonus",
   "steps": "d100A.modifierNames.steps",

};

d100A.modifierHitPointsAffectedValues = {
   //"fat": "d100A.hptype.fat",
   "stu": "d100A.hptype.stu",
   "wou": "d100A.hptype.wou",
   "mor": "d100A.hptype.mor"
};

d100A.abilities = {
   "str": "d100A.AbilityStr",
   "dex": "d100A.AbilityDex",
   "con": "d100A.AbilityCon",
   "int": "d100A.AbilityInt",
   "wil": "d100A.AbilityWil",
   "per": "d100A.AbilityPer"
};

d100A.feature = {
   "costp": "d100A.feature.costp",
   "costf": "d100A.feature.costf",
   "acb": "d100A.feature.acb"
}
d100A.ordnanceTypes = {
   "bomb": "d100A.Items.Ordnance.Type.Bombs",
   "mine": "d100A.Items.Ordnance.Type.Mines",
   "missile": "d100A.Items.Ordnance.Type.Missiles",
};

d100A.equipmentStatus = {
   "normal": "Normal",
   "degraded": "Degraded",
   "knocked": "Knocked Out",
   "destroyed": "Destroyed"

};


d100A.statusEffects =
   [
      {
         "id": "dead",
         "label": "EFFECT.StatusDead",
         "icon": "systems/Alternityd100/icons/conditions/dead3.png",
         modifiers: [],
         tooltip: "<strong>Dead</strong><br><br>This is the End"
      },
      {
         "id": "dying",
         "label": "EFFECT.StatusDying",
         "icon": "systems/Alternityd100/icons/conditions/dying3.png"
      },

      {
         "id": "knockedout",
         "label": "EFFECT.StatusKnockedOut",
         "icon": "systems/Alternityd100/icons/conditions/ko.png"
      },
      {
         "id": "suppressed",
         "label": "EFFECT.StatusSuppressed",
         "icon": "systems/Alternityd100/icons/conditions/suppressed.png"
      },
      {
         "id": "run",
         "label": "EFFECT.StatusRunning",
         "icon": "systems/Alternityd100/icons/conditions/run2.png",
         modifiers: [],
         tooltip: "<strong>Running</strong><br><br>+2 Step Penalty"
      },
      {
         "id": "sprint",
         "label": "EFFECT.StatusSprinting",
         "icon": "systems/Alternityd100/icons/conditions/sprint.png"
      },
      {
         "id": "charging",
         "label": "EFFECT.StatusCharging",
         "icon": "systems/Alternityd100/icons/conditions/charge.png"
      },
      {
         "id": "glide",
         "label": "EFFECT.StatusGliding",
         "icon": "systems/Alternityd100/icons/conditions/glide.png"
      },
      {
         "id": "flying",
         "label": "EFFECT.StatusFlying",
         "icon": "systems/Alternityd100/icons/conditions/flying2.png"
      },
      {
         "id": "eswim",
         "label": "EFFECT.StatusEasySwim",
         "icon": "systems/Alternityd100/icons/conditions/eswim2.png"
      },
      {
         "id": "swim",
         "label": "EFFECT.StatusSwim",
         "icon": "systems/Alternityd100/icons/conditions/swim3.png"
      },
      {
         "id": "aiming",
         "label": "EFFECT.Aiming",
         "icon": "systems/Alternityd100/icons/conditions/aiming.png"
      },
      {
         "id": "prone",
         "label": "EFFECT.StatusProne",
         "icon": "systems/Alternityd100/icons/conditions/falling.png"
      }, {
         "id": "coverlight",
         "label": "EFFECT.StatusCoverLight",
         "icon": "systems/Alternityd100/icons/conditions/coverlight.png"
      }, {
         "id": "covermedium",
         "label": "EFFECT.StatusCoverMedium",
         "icon": "systems/Alternityd100/icons/conditions/covermedium.png"
      }, {
         "id": "coverheavy",
         "label": "EFFECT.StatusCoverHeavy",
         "icon": "systems/Alternityd100/icons/conditions/coverheavy.png"
      },
      {
         "id": "dodgecri",
         "label": "EFFECT.StatusDodgeCri",
         "icon": "systems/Alternityd100/icons/conditions/dodge_04.webp"
      },
      {
         "id": "dodgeord",
         "label": "EFFECT.StatusDodgeOrd",
         "icon": "systems/Alternityd100/icons/conditions/dodge_02.webp"
      }, {
         "id": "dodgegoo",
         "label": "EFFECT.StatusDodgeGoo",
         "icon": "systems/Alternityd100/icons/conditions/dodge_01.webp"
      }, {
         "id": "dodgeama",
         "label": "EFFECT.StatusDodgeAma",
         "icon": "systems/Alternityd100/icons/conditions/dodge_03.webp"
      },


   ]

   ;
d100A.statusEffectIcons = [
   "systems/Alternityd100/icons/conditions/dead3.png",
   "systems/Alternityd100/icons/conditions/dying3.png",
   "systems/Alternityd100/icons/conditions/ko.png",
   "systems/Alternityd100/icons/conditions/suppressed.png",
   "systems/Alternityd100/icons/conditions/run2.png",
   "systems/Alternityd100/icons/conditions/sprint.png",
   "systems/Alternityd100/icons/conditions/charge.png",
   "systems/Alternityd100/icons/conditions/glide.png",
   "systems/Alternityd100/icons/conditions/flying2.png",
   "systems/Alternityd100/icons/conditions/eswim2.png",
   "systems/Alternityd100/icons/conditions/swim3.png",
   "systems/Alternityd100/icons/conditions/aiming.png",
   "systems/Alternityd100/icons/conditions/falling.png",
   "systems/Alternityd100/icons/conditions/coverlight.png",
];

d100A.statusEffectIconMapping = {

   "dead": "systems/Alternityd100/icons/conditions/dead3.png",
   "dying": "systems/Alternityd100/icons/conditions/dying3.png",
   "knockedout": "systems/Alternityd100/icons/conditions/ko.png",
   "suppressed": "systems/Alternityd100/icons/conditions/suppressed.png",
   "run": "systems/Alternityd100/icons/conditions/run2.png",
   "sprint": "systems/Alternityd100/icons/conditions/sprint.png",
   "charging": "systems/Alternityd100/icons/conditions/charge.png",
   "glide": "systems/Alternityd100/icons/conditions/glide.png",
   "flying": "systems/Alternityd100/icons/conditions/flying2.png",
   "eswim": "systems/Alternityd100/icons/conditions/eswim2.png",
   "swim": "systems/Alternityd100/icons/conditions/swim3.png",
   "aiming": "systems/Alternityd100/icons/conditions/aiming.png",
   "prone": "systems/Alternityd100/icons/conditions/falling.png",
   "coverlight": "systems/Alternityd100/icons/conditions/coverlight.png",
   "covermedium": "systems/Alternityd100/icons/conditions/covermedium.png",
   "coverheavy": "systems/Alternityd100/icons/conditions/coverheavy.png",
   "dodgecri": "systems/Alternityd100/icons/conditions/dodge_04.webp",
   "dodgeord": "systems/Alternityd100/icons/conditions/dodge_02.webp",
   "dodgegoo": "systems/Alternityd100/icons/conditions/dodge_01.webp",
   "dodgeama": "systems/Alternityd100/icons/conditions/dodge_03.webp",

};
// This creates the Character sheet Conditions
d100A.conditionTypes = {
   "dead": "SFRPG.ConditionsDead",
   "dying": "SFRPG.ConditionsDying",
   "knockedout": "SFRPG.ConditionsKnockedOut",
   "suppressed": "SFRPG.ConditionsSuppressed",
   "run": "SFRPG.ConditionsRun",
   "sprint": "SFRPG.ConditionsSprint",
   "charging": "SFRPG.ConditionsCharging",
   "glide": "SFRPG.ConditionsGlide",
   "flying": "SFRPG.ConditionsFlying",
   "eswim": "SFRPG.ConditionsEswim",
   "swim": "SFRPG.ConditionsSwim",
   "aiming": "SFRPG.ConditionsAiming",
   "prone": "SFRPG.ConditionsProne",
   "coverlight": "SFRPG.ConditionsCoverLight",
   "covermedium": "SFRPG.ConditionsCoverMedium",
   "coverheavy": "SFRPG.ConditionsCoverHeavy",
   "dodgecri": "SFRPG.ConditionsDodgeCri",
   "dodgeord": "SFRPG.ConditionsDodgeOrd",
   "dodgegoo": "SFRPG.ConditionsDodgeGoo",
   "dodgeama": "SFRPG.ConditionsDodgeAma"

};
// TODO localize
d100A.conditions = {
   "dead": {
      modifiers: [],
      tooltip: "<strong>Dead</strong><br><br>Your soul leaves your body, you can't act in any way, and you can't benefit from normal or magical healing."
   },
   "dying": {
      modifiers: [],
      tooltip: "<strong>Dying</strong><br>DMG 54<br>A character or creature that has suffered any amount al mortal damage is considered to be dying. At the end of the scene, a Sta mi na-en durance check is made. The result ol the check determines if additional mortal damage accrues; Critical Failure, 2 additional points of mortal damage; Failure, l additional point ol mortal damage. On any success, the character suffers no additional mortal damage Following the end ol the scene, the dying character must continue to make Stamina-endurance checks every hour with similar effects. <br>Revovery <br> Mortal damage doesn't naturally heal; it can only be healed by the use 'll a medical slid!. Successful U&e of Knowledge hint aid or Medical Science -treatment can stabilize the dying character and reduce the need for Stamina checks to once every day. Medical Science surgery is required to actually improve the dying character's condition and heal mortal damage"
   },
   "knockedout": {
      modifiers: [],
      tooltip: "<strong>Knocked Out</strong><br>DMG 53<br>You're unconscious, and likely being robbed.<br>Stunned <br>A hero who doesn't receive medical attention remains unconscious for the remainder of the round he was rendered unconscious, and all of the next round as well. Thereafter, an unconscious hero can make □ Resolve-physical resolve check every round to recover. Success brings consciousness, and the degree of success determines a number of stuns recovered: Ordinary, 2 stun points: Good, 4 stun points; Amazing, 6 stun points. Characters can't take any actions in the same round they recover; all they do is wake up and lake stock of their surroundings. <br>Wounded <br>If a character is unconscious because all of his wound points have been lost, he can't regain consciousness until at least 1 point of wound damage is healed. "
   },
   "suppressed": {
      modifiers: [],
      tooltip: "<strong>Suppressed DMG 49</strong><br><br> Suppressive fire is intended to force the enemy to keep his head down and ruin any shots he's taking. It’s especially useful for protecting an ally who's trying to cross open ground. When a character declares that he's using suppressive fire, he makes a normal skill check, but instead of inflicting damage, the result of the check inflicts a * 1, #2, or +3 penalty to any ranged attacks that the target makes during this phase. Suppressive fire with an automatic weapon is particularly effective, since the character laying down the covering fire can alfecl the attacks ol up to three enemy characters. The effects of suppressive fire aren't cumulative. The enemy’s skill check is only allecled by the best suppressive fire result used against him, not the sum of all suppressive fire. Suppressive fire has a different effect on targets that aren’t aware of, or don't care about, the threat. Many animals won't be deter red unless they are injured, and an enemy in a superior position (such as inside a body tank) is unlikely to keep his head down because someone's shooting at him with a pistol. For targets such as these who opt to ignore suppressive fire, normal damage, is rolled for the result indicated. "
   },
   "run": {
      modifiers: [],
      tooltip: "<strong>Running</strong><br><br>You're running, -2 to second actions"
   },
   "sprint": {
      modifiers: [],
      tooltip: "<strong>Sprinting</strong><br><br>You're sprinting, -3 to actions. If you move to your maximum spring you can take no actions except take cover "
   },
   "charging": {
      modifiers: [],
      tooltip: "<strong>Charging DMG 49</strong><br><br>A common tactic for entering a hand lo-hcmd fight is a charge. A charging hero ignores the penalties associated with attacking while running and gains a -2 bonus to his skill check. On the downside, his opponents gain a -2 bonus to strike him during his heroic dash. Once a character is engaged in melee combat with the enemy, its impossible to charge again until I he hero is tree and clear of the fight "
   },
   "glide": {
      modifiers: [],
      tooltip: "<strong>Gliding</strong><br><br>You're glide, "
   },
   "flying": {
      modifiers: [],
      tooltip: "<strong>Flying</strong><br><br>You're flying, "
   },
   "eswim": {
      modifiers: [],
      tooltip: "<strong>Easy Swimm</strong><br><br>You're easy swimming, "
   },
   "swim": {
      modifiers: [],
      tooltip: "<strong>Swimming</strong><br><br>You're swimming, "
   },
   "aiming": {
      modifiers: [],
      tooltip: "<strong>Aiming / Point Blank</strong><br>DMG /49 47 <br> A character making an attack with a ranged weapon or a direct lire heavy weapon can spend an action aiming beiore the attack is made. Aiming provides a -I bonus to the next attack, provided the heio makes the attack in the next phase he is entitled to act.   It's not possible lo aim when using burst or autofire modes. Paint: Blank  You may allow characters to receive a bonus to attacks from extremely close range. Point-blank shots occur al a range o! less than 1 meter. Pistols, rifles, SMGs, and heavy weapons {direct) receive a -3 bonus for shooling in this range.<br>Coup de Grace<br>You can automatically inflict Amazing Damage against a Bound, Paralyzed or Knocked Out opponent or friend. The attack must be within personal range, requires an actio, and armour is normally effective (called shot may be required)"
   },
   "prone": {
      modifiers: [],
      tooltip: "<strong>Prone</strong><br><br>You're prone, "
   },
   "lightcover": {
      modifiers: [],
      tooltip: "<strong>Prone</strong><br><br>You have Cover, "
   }
   ,
   "mediumcover": {
      modifiers: [],
      tooltip: "<strong>Prone</strong><br><br>You have Cover "
   }
   ,
   "heavycover": {
      modifiers: [],
      tooltip: "<strong>Prone</strong><br><br>You have Cover "
   },

   "AttackDialog": {
      
         "movementTooltip" : "d100A.Items.Weapon.movementTooltip",
      
   }


};