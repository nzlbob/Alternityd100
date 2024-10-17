

/**
 * A data object that hold information about a specific modifier.
 * 
 * @param {Object}        data               The data for the modifier.
 * @param {String}        data.name          The name for the modifier. Only useful for identifiying the modifier.
 * @param {Number|String} data.modifier      The value to modify with. This can be either a constant number or a Roll formula.
 * @param {String}        data.type          The modifier type. This is used to determine if a modifier stacks or not.
 * @param {String}        data.modifierType  Determines if this modifer is a constant value (+2) or a roll formula (1d4).
 * @param {String}        data.effectType    The category of things that might be modified by this value.
 * @param {String}        data.valueAffected The specific statistic being affected.
 * @param {Boolean}       data.enabled       Is this modifier enabled or not.
 * @param {String}        data.source        Where does this modifier come from? An item, or an ability?
 * @param {String}        data.notes         Any notes that are useful for this modifer.
 * @param {String}        data.subtab        What subtab should this appear on in the character sheet?
 * @param {String}        data.condition     The condition, if any, that this modifier is associated with.
 * @param {String|null}   data.id            Override a random id with a specific one.
 */


export const d100AStatusEffects = [];

d100AStatusEffects.push(
    {
        id: "dead",
        name: "d100A.EFFECT.StatusDead",
        label: "d100A.EFFECT.StatusDead",
        icon: "systems/Alternityd100/icons/conditions/dead3.png",
        img: "systems/Alternityd100/icons/conditions/dead3.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: { str: 0, dex: 0 },
            },
            tooltip: "<strong>Dead</strong><br><br>This is the End"
        }

    },
    {
        id: "dying",
        name: "d100A.EFFECT.StatusDying",
        label: "d100A.EFFECT.StatusDying",
        img: "systems/Alternityd100/icons/conditions/dying3.png",
        icon: "systems/Alternityd100/icons/conditions/dying3.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: { str: 0, dex: 0 },
            },
            tooltip: "<strong>Dead</strong><br><br>This is the End"
        }
    },

    {
        id: "knockedout",
        name: "d100A.EFFECT.StatusKnockedOut",
        label: "d100A.EFFECT.StatusKnockedOut",
        img: "systems/Alternityd100/icons/conditions/ko.png",
        icon: "systems/Alternityd100/icons/conditions/ko.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: { str: -5, dex: -5 },
            },
            tooltip: "<strong>Dead</strong><br><br>This is the End"
        }

    },
    {
        id: "suppressed",
        name: "d100A.EFFECT.StatusSuppressed",
        label: "d100A.EFFECT.StatusSuppressed",
        img: "systems/Alternityd100/icons/conditions/suppressed.png",
        icon: "systems/Alternityd100/icons/conditions/suppressed.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 0, renged: 1
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Dead</strong><br><br>This is the End"
        }
    },
    {
        id: "run",
        name: "d100A.EFFECT.StatusRunning",
        label: "d100A.EFFECT.StatusRunning",
        img: "systems/Alternityd100/icons/conditions/run2.png",
        icon: "systems/Alternityd100/icons/conditions/run2.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 2, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Running</strong><br><br>+2 Step Penalty"
        }
    },
    {
        id: "sprint",
        name: "d100A.EFFECT.StatusSprinting",
        label: "d100A.EFFECT.StatusSprinting",
        img: "systems/Alternityd100/icons/conditions/sprint.png",
        icon: "systems/Alternityd100/icons/conditions/sprint.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 3, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "charging",
        name: "d100A.EFFECT.StatusCharging",
        label: "d100A.EFFECT.StatusCharging",
        img: "systems/Alternityd100/icons/conditions/charge.png",
        icon: "systems/Alternityd100/icons/conditions/charge.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "glide",
        name: "d100A.EFFECT.StatusGliding",
        label: "d100A.EFFECT.StatusGliding",
        img: "systems/Alternityd100/icons/conditions/glide.png",
        icon: "systems/Alternityd100/icons/conditions/glide.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 1, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "flying",
        name: "d100A.EFFECT.StatusFlying",
        label: "d100A.EFFECT.StatusFlying",
        img: "systems/Alternityd100/icons/conditions/flying2.png",
        icon: "systems/Alternityd100/icons/conditions/flying2.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 2, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "eswim",
        name: "d100A.EFFECT.StatusEasySwim",
        label: "d100A.EFFECT.StatusEasySwim",
        img: "systems/Alternityd100/icons/conditions/eswim2.png",
        icon: "systems/Alternityd100/icons/conditions/eswim2.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 2, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "swim",
        name: "d100A.EFFECT.StatusSwim",
        label: "d100A.EFFECT.StatusSwim",
        img: "systems/Alternityd100/icons/conditions/swim3.png",
        icon: "systems/Alternityd100/icons/conditions/swim3.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "aiming",
        name: "d100A.EFFECT.Aiming",
        label: "d100A.EFFECT.Aiming",
        img: "systems/Alternityd100/icons/conditions/aiming.png",
        icon: "systems/Alternityd100/icons/conditions/aiming.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>aiming</strong><br><br>"
        }
    },
    {
        id: "prone",
        name: "d100A.EFFECT.StatusProne",
        label: "d100A.EFFECT.StatusProne",
        img: "systems/Alternityd100/icons/conditions/falling.png",
        icon: "systems/Alternityd100/icons/conditions/falling.png",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 0, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>prone</strong><br><br>"
        }
    }, {
    id: "coverlight",
    name: "d100A.EFFECT.StatusCoverLight",
    label: "d100A.EFFECT.StatusCoverLight",
    img: "systems/Alternityd100/icons/conditions/coverlight.png",
    icon: "systems/Alternityd100/icons/conditions/coverlight.png",
    modifiers: [],
    hud: { actorTypes: ["character", "npc"] },
    system: {
        bonus: {
            dodge: 0, cover: 1, actions: 0, ranged: 0
        },
        resistanceModifier: {
            str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
            resistanceBase: {},
        },
        tooltip: "<strong>Sprinting</strong><br><br>"
    }
}, {
    id: "covermedium",
    name: "d100A.EFFECT.StatusCoverMedium",
    label: "d100A.EFFECT.StatusCoverMedium",
    img: "systems/Alternityd100/icons/conditions/covermedium.png",
    icon: "systems/Alternityd100/icons/conditions/covermedium.png",
    modifiers: [],
    hud: { actorTypes: ["character", "npc"] },
    system: {
        bonus: {
            dodge: 0, cover: 2, actions: 0, ranged: 0
        },
        resistanceModifier: {
            str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
            resistanceBase: {},
        },
        tooltip: "<strong>Sprinting (+3 to actions)</strong><br><br>"
    }
}, {
    id: "coverheavy",
    name: "d100A.EFFECT.StatusCoverHeavy",
    label: "d100A.EFFECT.StatusCoverHeavy",
    img: "systems/Alternityd100/icons/conditions/coverheavy.png",
    icon: "systems/Alternityd100/icons/conditions/coverheavy.png",
    modifiers: [],
    hud: { actorTypes: ["character", "npc"] },
    system: {
        bonus: {
            dodge: 0, cover: 3, actions: 0, ranged: 0
        },
        resistanceModifier: {
            str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
            resistanceBase: {},
        },
        tooltip: "<strong>Sprinting</strong><br><br>"
    }
},
    {
        id: "dodgecri",
        name: "d100A.EFFECT.StatusDodgeCri",
        label: "d100A.EFFECT.StatusDodgeCri",
        img: "systems/Alternityd100/icons/conditions/dodge_04.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_04.webp",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: -1, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "dodgeord",
        name: "d100A.EFFECT.StatusDodgeOrd",
        label: "d100A.EFFECT.StatusDodgeOrd",
        img: "systems/Alternityd100/icons/conditions/dodge_02.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_02.webp",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: {
                dodge: 1, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "dodgegoo",
        name: "d100A.EFFECT.StatusDodgeGoo",
        label: "d100A.EFFECT.StatusDodgeGoo",
        img: "systems/Alternityd100/icons/conditions/dodge_01.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_01.webp",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            actortype: ["actor", "npc"],
            bonus: { dodge: 2, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "dodgeama",
        name: "d100A.EFFECT.StatusDodgeAma",
        label: "d100A.EFFECT.StatusDodgeAma",
        img: "systems/Alternityd100/icons/conditions/dodge_03.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_03.webp",
        modifiers: [],
        hud: { actorTypes: ["character", "npc"] },
        system: {
            bonus: { dodge: 3, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "jinkord",
        name: "d100A.EFFECT.StatusJinking1",
        label: "d100A.EFFECT.StatusJinking1",
        img: "systems/Alternityd100/icons/conditions/dodge_02.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_02.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 1, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    }
    ,
    {
        id: "jinkgoo",
        name: "d100A.EFFECT.StatusJinking2",
        label: "d100A.EFFECT.StatusJinking2",
        img: "systems/Alternityd100/icons/conditions/dodge_01.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_01.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 2, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "jinkama",
        name: "d100A.EFFECT.StatusJinking3",
        label: "d100A.EFFECT.StatusJinking3",
        img: "systems/Alternityd100/icons/conditions/dodge_03.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_03.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 3, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "jinkcri",
        name: "d100A.EFFECT.StatusJinking-1",
        label: "d100A.EFFECT.StatusJinking-1",
        img: "systems/Alternityd100/icons/conditions/dodge_04.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_04.webp",
        modifiers: [],
        hud: { actorTypes:  ["starship", "vehicle"]  },
        system: {
            bonus: {
                dodge: -1, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "sensorjamord",
        name: "d100A.EFFECT.sensorjamord",
        label: "d100A.EFFECT.sensorjamord",
        img: "systems/Alternityd100/icons/conditions/jam_01.webp",
        icon: "systems/Alternityd100/icons/conditions/jam_01.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0, sensors : 1 },

            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    }
    ,
    {
        id: "sensorjamgoo",
        name: "d100A.EFFECT.sensorjamgoo",
        label: "d100A.EFFECT.sensorjamgoo",
        img: "systems/Alternityd100/icons/conditions/jam_02.webp",
        icon: "systems/Alternityd100/icons/conditions/jam_02.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0, sensors : 2  },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "sensorjamama",
        name: "d100A.EFFECT.sensorjamama",
        label: "d100A.EFFECT.sensorjamama",
        img: "systems/Alternityd100/icons/conditions/jam_03.webp",
        icon: "systems/Alternityd100/icons/conditions/jam_03.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0, sensors : 3  },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "sensorjamcri",
        name: "d100A.EFFECT.sensorjamcri",
        label: "d100A.EFFECT.sensorjamcri",
        img: "systems/Alternityd100/icons/conditions/jam_bonus.webp",
        icon: "systems/Alternityd100/icons/conditions/jam_bonus.webp",
        modifiers: [],
        hud: { actorTypes:  ["starship", "vehicle"]  },
        system: {
            bonus: {
                dodge: -1, cover: 0, actions: 0, ranged: 0, sensors : -2 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "weaponjamord",
        name: "d100A.EFFECT.weaponjamord",
        label: "d100A.EFFECT.weaponjamord",
        img: "systems/Alternityd100/icons/conditions/weaponjam_01.webp",
        icon: "systems/Alternityd100/icons/conditions/weaponjam_01.webp",
        modifiers: [],
        hud: { actorTypes: ["ordnance"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    }
    ,
    {
        id: "weaponjamgoo",
        name: "d100A.EFFECT.weaponjamgoo",
        label: "d100A.EFFECT.weaponjamgoo",
        img: "systems/Alternityd100/icons/conditions/weaponjam_02.webp",
        icon: "systems/Alternityd100/icons/conditions/weaponjam_02.webp",
        modifiers: [],
        hud: { actorTypes: ["ordnance"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "weaponjamama",
        name: "d100A.EFFECT.weaponjamama",
        label: "d100A.EFFECT.weaponjamama",
        img: "systems/Alternityd100/icons/conditions/weaponjam_03.webp",
        icon: "systems/Alternityd100/icons/conditions/weaponjam_03.webp",
        modifiers: [],
        hud: { actorTypes: ["ordnance"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "weaponjamcri",
        name: "d100A.EFFECT.weaponjamcri",
        label: "d100A.EFFECT.weaponjamcri",
        img: "systems/Alternityd100/icons/conditions/weaponjam_fail.webp",
        icon: "systems/Alternityd100/icons/conditions/weaponjam_fail.webp",
        modifiers: [],
        hud: { actorTypes:  ["ordnance"]  },
        system: {
            bonus: {
                dodge: -1, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "eccmjamord",
        name: "d100A.EFFECT.eccmjamord",
        label: "d100A.EFFECT.eccmjamord",
        img: "systems/Alternityd100/icons/conditions/jam_bonus.webp",
        icon: "systems/Alternityd100/icons/conditions/jam_bonus.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    }
    ,
    {
        id: "eccmjamgoo",
        name: "d100A.EFFECT.eccmjamgoo",
        label: "d100A.EFFECT.eccmjamgoo",
        img: "systems/Alternityd100/icons/conditions/dodge_01.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_01.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "eccmjamama",
        name: "d100A.EFFECT.eccmjamama",
        label: "d100A.EFFECT.eccmjamama",
        img: "systems/Alternityd100/icons/conditions/dodge_03.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_03.webp",
        modifiers: [],
        hud: { actorTypes: ["starship", "vehicle"] },
        system: {
       
            bonus: { dodge: 0, cover: 0, actions: 0, ranged: 0 },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    },
    {
        id: "eccmjamcri",
        name: "d100A.EFFECT.eccmjamcri",
        label: "d100A.EFFECT.eccmjamcri",
        img: "systems/Alternityd100/icons/conditions/dodge_04.webp",
        icon: "systems/Alternityd100/icons/conditions/dodge_04.webp",
        modifiers: [],
        hud: { actorTypes:  ["starship", "vehicle"]  },
        system: {
            bonus: {
                dodge: -1, cover: 0, actions: 0, ranged: 0
            },
            resistanceModifier: {
                str: 0, dex: 0, con: 0, int: 0, wil: 0, per: 0,
                resistanceBase: {},
            },
            tooltip: "<strong>Sprinting</strong><br><br>"
        }
    }


    

)
