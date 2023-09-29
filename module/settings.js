import { SFRPG } from "./config.js";

export const registerSystemSettings = function () {
   
   
   
    console.log("Alternity by d100  | [READY] game.settings.register");
   
   
   
    game.settings.register("Alternityd100", "diagonalMovement", {
        name: "SFRPG.Settings.DiagonalMovementRule.Name",
        hint: "SFRPG.Settings.DiagonalMovementRule.Hint",
        scope: "world",
        config: true,
        default: "5105",
        type: String,
        choices: {
            "5105": "SFRPG.Settings.DiagonalMovementRule.Values.Core",
            "555": "SFRPG.Settings.DiagonalMovementRule.Values.Optional"
        },
        onChange: rule => {
            if (canvas.initialized) {
                canvas.grid.diagonalRule = rule;
            }
        }
    });


    game.settings.register("Alternityd100", "starshipMovement", {
        name: "d100A.Settings.starshipMovement.Name",
        hint: "SFRPG.Settings.starshipMovement.Hint",
        scope: "world",
        config: true,
        default: "HybridD100",
        type: String,
        choices: {
            "PHBGM": "SFRPG.Settings.DiagonalMovementRule.Values.Core",
            "WarshipsSimple": "SFRPG.Settings.DiagonalMovementRule.Values.Optional",
            "HybridD100":"45degree",
            "Neutonian":"Realistic Neutonian Physics"
        },
       // onChange: rule => {
       //     if (canvas.initialized) {
       //         canvas.grid.diagonalRule = rule;
       //     }
        //}
    }
    );
/*
    game.settings.register("Alternityd100", "disableExperienceTracking", {
        name: "SFRPG.Settings.ExperienceTracking.Name",
        hint: "SFRPG.Settings.ExperienceTracking.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("Alternityd100", "useAdvantageDisadvantage", {
        name: "SFRPG.Settings.Advantage.Name",
        hint: "SFRPG.Settings.Advantage.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
*/

game.settings.register("Alternityd100", "initCards", {
    name: "Initiatave Chat Cards",
    hint: "Print initiative cards in the Chat window",
    scope: "world",
    type: Boolean,
    default: false,
    config: true
  });

    game.settings.register("Alternityd100", "autoCollapseItemCards", {
        name: "SFRPG.Settings.AutoCollapseCard.Name",
        hint: "SFRPG.Settings.AutoCollapseCard.Hint",
        scope: "client",
        config: true,
        default: true,
        type: Boolean,
        onChange: s => {
            ui.chat.render();
        }
    });

    game.settings.register("Alternityd100", "worldSchemaVersion", {
        name: "SFRPG.Settings.WorldSchemaVersion.Name",
        hint: "SFRPG.Settings.WorldSchemaVersion.Hint",
        scope: "world",
        config: false,
        default: 0,
        type: Number
    });
/*
    game.settings.register("Alternityd100", "useCustomChatCards", {
        name: "SFRPG.Settings.UseCustomChatCard.Name",
        hint: "SFRPG.Settings.UseCustomChatCard.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    */
    game.settings.register("Alternityd100", "alwaysShowQuantity", {
        name: "SFRPG.Settings.AlwaysShowQuantity.Name",
        hint: "SFRPG.Settings.AlwaysShowQuantity.Hint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });
    /*
    game.settings.register("Alternityd100", "useStarfinderAOETemplates", {
        name: "SFRPG.Settings.UseStarfinderAOETemplates.Name",
        hint: "SFRPG.Settings.UseStarfinderAOETemplates.Hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
*/



    game.settings.register("Alternityd100", "useQuickRollAsDefault", {
        name: "SFRPG.Settings.UseQuickRollAsDefault.Name",
        hint: "SFRPG.Settings.UseQuickRollAsDefault.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    for (let combatType of SFRPG.combatTypes) {
        const capitalizedCombatType = combatType[0].toUpperCase() + combatType.slice(1);
        game.settings.register("Alternityd100", `${combatType}ChatCards`, {
            name: `SFRPG.Settings.CombatCards.${capitalizedCombatType}Name`,
            hint: `SFRPG.Settings.CombatCards.${capitalizedCombatType}Hint`,
            scope: "world",
            config: true,
            default: "enabled",
            type: String,
            choices: {
                "enabled": "SFRPG.Settings.CombatCards.Values.Enabled",
                "roundsPhases": "SFRPG.Settings.CombatCards.Values.RoundsPhases",
                "roundsTurns": "SFRPG.Settings.CombatCards.Values.RoundsTurns",
                "roundsOnly": "SFRPG.Settings.CombatCards.Values.OnlyRounds",
                "disabled": "SFRPG.Settings.CombatCards.Values.Disabled"
            }
        });
    }

    game.settings.register("Alternityd100", "starshipActionsSource", {
        name: "SFRPG.Settings.StarshipActionsSource.Name",
        hint: "SFRPG.Settings.StarshipActionsSource.Hint",
        scope: "world",
        config: true,
        default: "Alternityd100.starship-actions",
        type: String
    });
/*
    game.settings.register("Alternityd100", "starshipActionsCrit", {
        name: "SFRPG.Settings.StarshipActionsCrit.Name",
        hint: "SFRPG.Settings.StarshipActionsCrit.Hint",
        scope: "world",
        config: true,
        default: "critOnly",
        type: String,
        choices: {
            "never": "SFRPG.Settings.StarshipActionsCrit.Values.Never",
            "critOnly": "SFRPG.Settings.StarshipActionsCrit.Values.CritOnly",
            "always": "SFRPG.Settings.StarshipActionsCrit.Values.Always"
        }
    });
*/
    game.settings.register("Alternityd100", "enableGalacticTrade", {
        name: "SFRPG.Settings.GalacticTrade.Name",
        hint: "SFRPG.Settings.GalacticTrade.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("Alternityd100", "rollDamageWithAttack", {
        name: "SFRPG.Settings.DamageWithAttack.Name",
        hint: "SFRPG.Settings.DamageWithAttack.Hint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });
    
    game.settings.register("Alternityd100", "starshipHitLocation", {
        name: "Starship Hit Locations",
        hint: "GM Guide does not take into account facing, Warships does",
        scope: "world",
        config: true,
        default: "warships",
        type: String,
        choices: {
            "standard": "TBI - GM Guide Table G50 Compartment Hit Location",
            "warships": "Warships Table 2-4: Hit Locations"
        }
    });

    game.settings.register("Alternityd100", "starshipDurability", {
        name: "Starship Durability",
        hint: "Apply damage to the starship (Warships) or by compartment (GM Guide 162) Warships requires a second roll for each system. GM Guide 1/2 stun -1, durability check (dc = 2 x durability ) for the compartment not to lose one " ,
        scope: "world",
        config: true,
        default: "warships",
        type: String,
        choices: {
            "standard": "GM Guide Damage by compartment",
            "warships": "Warships Damage to hull"
        }
    });

    game.settings.register("Alternityd100", "starshipHitLocLen", {
        name: "Starship Hit Location Max Variance",
        hint: "Number that determines the variation from sensors to the hit location  ",
        scope: "world",
        config: true,
        default: 4,
        type: Number
    });

    game.settings.register("Alternityd100", "starshipCompartments", {
        name: "Starship Compartments",
        hint: "Use GM Guide / Starships (P39) settings for number of compartments, or Warships set. GM Guide  ",
        scope: "world",
        config: true,
        default: "warships",
        type: String,
        choices: {
            "standard": "xGM Guide Optional no. of compartments (max dur = 10 starships P 39)",
            "warships": "Warships Fixed number of Compartments"
        }
    });

   

};
export const getSkipActionPrompt = function (event) {
    return (
  
 // ( game.keyboard.isDown("Shift"))
      (game.settings.get("Alternityd100", "useQuickRollAsDefault") && !event?.shiftKey) ||
      (!game.settings.get("Alternityd100", "useQuickRollAsDefault") && event?.shiftKey)
    );
  };