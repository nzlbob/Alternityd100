// Common actions
import error from './engine/common/action/error.js';
import identity from './engine/common/action/identity.js';
import setResult from './engine/common/action/set-result.js';
import undefined from './engine/common/action/undefined.js';

// Common conditions
import always from './engine/common/condition/always.js';
import defaultCondition from './engine/common/condition/default.js';
import equal from './engine/common/condition/equal.js';
import never from './engine/common/condition/never.js';
import random from './engine/common/condition/random.js';

// Common Transformers
import fixedValue from './engine/common/transformer/fixed-value.js';
import get from './engine/common/transformer/get.js';

// Custom rules
import isModifierType                   from './rules/conditions/is-modifier-type.js';
import isActorType                      from './rules/conditions/is-actor-type.js';
import stackModifiers                   from './rules/actions/modifiers/stack-modifiers.js';
import logToConsole                     from './rules/actions/log.js';
import clearTooltips                    from './rules/actions/actor/clear-tooltips.js';
import calculateAbilityCheckModifiers   from './rules/actions/actor/calculate-ability-check-modifiers.js';
import calculateActorResources          from './rules/actions/actor/calculate-actor-resources.js';
import calculateArmorModifiers          from './rules/actions/actor/calculate-armor-modifiers.js';
import calculateBaseAttackBonusModifier from './rules/actions/actor/calculate-bab-modifier.js';
import calculateBaseAbilityModifier     from './rules/actions/actor/calculate-base-ability-modifier.js';
import calculateBaseAbilityScore        from './rules/actions/actor/calculate-base-ability-score.js';
import calculateCmd                     from './rules/actions/actor/calculate-cmd.js';
import calculateCmdModifiers            from './rules/actions/actor/calculate-cmd-modifiers.js';
import calculateClasses                 from './rules/actions/actor/calculate-classes.js';
import calculateEncumbrance             from './rules/actions/actor/calculate-encumbrance.js';
import calculateMovementSpeeds          from './rules/actions/actor/calculate-movement-speeds.js';
import calculateResistanceModifiers     from './rules/actions/actor/calculate-resistance-modifiers.js';//Alternity was save modifiers
import calculateSkillModifiers          from './rules/actions/actor/calculate-skill-modifiers.js';
// Character rules
import calculateBaseArmorClass          from './rules/actions/actor/character/calculate-base-armor-class.js';
import calculateBaseAttackBonus         from './rules/actions/actor/character/calculate-bab.js';
import calculateBaseSaves               from './rules/actions/actor/character/calculate-base-saves.js';
import calculateBaseSkills              from './rules/actions/actor/character/calculate-base-skills.js';
import calculateCharacterLevel          from './rules/actions/actor/character/calculate-character-level.js';
import calculateHitpoints               from './rules/actions/actor/character/calculate-hitpoints.js';
import calculateInitiative              from './rules/actions/actor/character/calculate-initiative.js';
import calculateInitiativeModifiers     from './rules/actions/actor/character/calculate-initiative-modifiers.js';
import calculatePlayerXp                from './rules/actions/actor/character/calculate-xp.js';
import calculateResolve                 from './rules/actions/actor/character/calculate-resolve.js';
import calculateSkillArmorCheckPenalty  from './rules/actions/actor/character/calculate-skill-armor-check-penalty.js';
import calculateSkillpoints             from './rules/actions/actor/character/calculate-skillpoints.js';
import calculateSpellsPerDay            from './rules/actions/actor/character/calculate-spellsPerDay.js';
import calculateStamina                 from './rules/actions/actor/character/calculate-stamina.js';
import calculateTraits                  from './rules/actions/actor/character/calculate-traits.js';
// Drone rules
import calculateDroneChassis            from './rules/actions/actor/drone/calculate-drone-chassis.js';
import calculateDronedefence            from './rules/actions/actor/drone/calculate-drone-defence.js';
import calculateDroneEquipment          from './rules/actions/actor/drone/calculate-drone-equipment.js';
import calculateDroneHitpoints          from './rules/actions/actor/drone/calculate-drone-hitpoints.js';
import calculateDroneMods               from './rules/actions/actor/drone/calculate-drone-mods.js';
import calculateDroneResolve            from './rules/actions/actor/drone/calculate-drone-resolve.js';
import calculateDroneSaves              from './rules/actions/actor/drone/calculate-drone-saves.js';
import calculateDroneSkills             from './rules/actions/actor/drone/calculate-drone-skills.js';
// NPC rules
import calculateNpcSkillsItems         from './rules/actions/actor/npc/calculate-npc-skills-items.js';
import calculateNpcAbilities                   from './rules/actions/actor/npc/calculate-npc-abilities.js';
// Starship rules
import calculateStarshipFrame           from './rules/actions/actor/starship/calculate-starship-frame.js'
import calculateStarshipComputer        from './rules/actions/actor/starship/calculate-starship-computer.js'
import calculateStarshipArmorClass      from './rules/actions/actor/starship/calculate-starship-ac.js';

import calculateStarshipCompartments    from './rules/actions/actor/starship/calculate-starship-compartments.js';
import calculateStarshipCrew            from './rules/actions/actor/starship/calculate-starship-crew.js';
import calculateStarshipCriticalStatus  from './rules/actions/actor/starship/calculate-starship-critical-status.js';
import calculateStarshipCritThreshold   from './rules/actions/actor/starship/calculate-starship-ct.js';
import calculateStarshipDrift           from './rules/actions/actor/starship/calculate-starship-drift.js';
import calculateStarshipAblative        from './rules/actions/actor/starship/calculate-starship-ablative.js';
import calculateStarshipPower           from './rules/actions/actor/starship/calculate-starship-power.js';
import calculateStarshipSensors         from './rules/actions/actor/starship/calculate-starship-sensors.js';
import calculateStarshipShields         from './rules/actions/actor/starship/calculate-starship-shields.js';
import calculateStarshipSpeed           from './rules/actions/actor/starship/calculate-starship-speed.js';
import calculateVehicleSpeed           from './rules/actions/actor/vehicle/calculate-vehicle-speed.js';
import calculateStarshipTargetLock      from './rules/actions/actor/starship/calculate-starship-targetlock.js';
// Vehicle rules
import calculateVehicleControlSkill from './rules/actions/actor/vehicle/calculate-vehicle-control-skill.js';
import calculateVehicleHangar       from './rules/actions/actor/vehicle/calculate-vehicle-hangar.js';
import calculateVehiclePassengers   from './rules/actions/actor/vehicle/calculate-vehicle-passengers.js';
// Item rules
import calculateItemData from './rules/actions/item/calculate-item-data.js';

export default function (engine) {
    console.log("Starfinder | [SETUP] Registering rules");

    // Actions
    error(engine);
    identity(engine);
    setResult(engine);
    undefined(engine);

    // Actor actions
    clearTooltips(engine);
    calculateBaseAbilityScore(engine);
    calculateActorResources(engine);
    calculateBaseAbilityModifier(engine);
    calculateBaseArmorClass(engine);
    calculateArmorModifiers(engine);
    calculateBaseAttackBonusModifier(engine);
    calculateBaseSaves(engine);
    calculateResistanceModifiers(engine);
    calculateInitiative(engine);
    calculateInitiativeModifiers(engine);
    calculateCmd(engine);
    calculateCmdModifiers(engine);
    calculateBaseSkills(engine);
    calculateClasses(engine);
    calculateSkillModifiers(engine);
    calculateSkillArmorCheckPenalty(engine);
    calculateAbilityCheckModifiers(engine);

    calculateEncumbrance(engine);

    calculateMovementSpeeds(engine);
    // Character actions
    calculateBaseAttackBonus(engine);
    calculateCharacterLevel(engine);
    calculateHitpoints(engine);
    calculateResolve(engine);
    calculateSkillpoints(engine);
    calculateSpellsPerDay(engine);
    calculateStamina(engine);
    calculateTraits(engine);
    calculatePlayerXp(engine);
    // Drone actions
    calculateDroneChassis(engine);
    calculateDronedefence(engine);
    calculateDroneEquipment(engine);
    calculateDroneHitpoints(engine);
    calculateDroneMods(engine);
    calculateDroneResolve(engine);
    calculateDroneSaves(engine);
    calculateDroneSkills(engine);
    // NPC actions
    calculateNpcSkillsItems(engine);
    //calculateNpcXp(engine);
    calculateNpcAbilities(engine);
    // Starship actions
    calculateStarshipFrame(engine);
    calculateStarshipCompartments(engine);
    calculateStarshipArmorClass(engine);
    
    calculateStarshipCrew(engine);
    calculateStarshipCriticalStatus(engine);
    calculateStarshipCritThreshold(engine);
    calculateStarshipDrift(engine);
    calculateStarshipAblative(engine);
    calculateStarshipPower(engine);
    calculateStarshipSensors(engine);
    calculateStarshipShields(engine);
    calculateStarshipSpeed(engine);
    calculateStarshipTargetLock(engine);
    
    calculateStarshipComputer(engine);
  
    // Vehicle actions
    calculateVehicleControlSkill(engine);
    calculateVehicleHangar(engine);
    calculateVehiclePassengers(engine);
    calculateVehicleSpeed(engine);
    // Item actions
    calculateItemData(engine);

    // Conditions
    always(engine);
    defaultCondition(engine);
    equal(engine);
    never(engine);
    random(engine);
    console.log("Alternityd100 | [SETUP] Done registering rules");
    // Transformations
    fixedValue(engine);
    get(engine);

    // Custom rules
    logToConsole(engine);
    isActorType(engine);
    isModifierType(engine);
    stackModifiers(engine);
    console.log("Alternityd100 | [SETUP] Done registering rules");
    engine.add({
        name: "process-actors",
        description: "Take all of the actor data and process it by actor type.",
        rules: [
            {
                when: { closure: "isActorType", type: "character" },
                then: [

                    //"calculateStarshipCrew",

                    "clearTooltips",
                   "calculateCharacterLevel",
                    "calculateClasses",
                    "calculateTraits",
                    
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                   { closure: "calculateBaseAbilityScore", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityModifier", stackModifiers: "stackModifiers" },
                    "calculateBaseArmorClass",
                    { closure: "calculateArmorModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAttackBonus", stackModifiers: "stackModifiers" },
                   { closure: "calculateBaseAttackBonusModifier", stackModifiers: "stackModifiers" },
                   "calculateBaseSaves",
                    { closure: "calculateResistanceModifiers", stackModifiers: "stackModifiers"},
                    "calculateInitiative",
                    {closure: "calculateInitiativeModifiers", stackModifiers: "stackModifiers" },
                    "calculateCMD",
                    { closure: "calculateCMDModifiers", stackModifiers: "stackModifiers" },
                    "calculateXP",
                    { closure: "calculateSkillpoints", stackModifiers: "stackModifiers" },
                    "calculateBaseSkills",
                    { closure: "calculateSkillArmorCheckPenalty", stackModifiers: "stackModifiers" },
                    { closure: "calculateSkillModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateHitpoints", stackModifiers: "stackModifiers" },
                    { closure: "calculateStamina", stackModifiers: "stackModifiers" },
                    { closure: "calculateResolve", stackModifiers: "stackModifiers" },
                    { closure: "calculateAbilityCheckModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateEncumbrance", stackModifiers: "stackModifiers" },
                   { closure: "calculateMovementSpeeds", stackModifiers: "stackModifiers" },
                   "calculateSpellsPerDay"
                ]
            },
            {
                when: { closure: "isActorType", type: "drone" },
                then: [
                    "clearTooltips",
                    "calculateDroneChassis",
                    "calculateDroneMods",
                    "calculateDroneEquipment",
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityScore", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityModifier", stackModifiers: "stackModifiers" },
                    "calculateDroneSkills",
                    { closure: "calculateSkillModifiers", stackModifiers: "stackModifiers" },
                    "calculateDroneSaves",
                    { closure: "calculateResistanceModifiers", stackModifiers: "stackModifiers"}, //Alternity was saves
                    "calculateDronedefence",
                    { closure: "calculateArmorModifiers", stackModifiers: "stackModifiers" },
                    "calculateCMD",
                    { closure: "calculateCMDModifiers", stackModifiers: "stackModifiers" },
                    { closure: "calculateDroneHitpoints", stackModifiers: "stackModifiers" },
                    { closure: "calculateDroneResolve", stackModifiers: "stackModifiers" },
                    { closure: "calculateAbilityCheckModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateBaseAttackBonusModifier", stackModifiers: "stackModifiers" },
                    { closure: "calculateEncumbrance", stackModifiers: "stackModifiers" },
                    { closure: "calculateMovementSpeeds", stackModifiers: "stackModifiers" },
                    { closure: "calculateHitpoints", stackModifiers: "stackModifiers" }
                ]
            },
            {
                when: { closure: "isActorType", type: "hazard" },
                then: []
                //then: ["calculateNpcXp"]
            },
            {
                when: { closure: "isActorType", type: "npc" },
                then: [
                    "clearTooltips",
                    "calculateNpcAbilities",
                    
                    "calculateClasses",
                    
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityScore", stackModifiers: "stackModifiers" },
                    { closure: "calculateBaseAbilityModifier", stackModifiers: "stackModifiers" },
                    
                    { closure: "calculateAbilityCheckModifiers", stackModifiers: "stackModifiers"},
                    { closure: "calculateMovementSpeeds", stackModifiers: "stackModifiers" },
                    { closure: "calculateHitpoints", stackModifiers: "stackModifiers" },
                    "calculateNpcSkillsItems",
                    "calculateBaseSkills",
                    
                ]
            },
            {
                when: { closure: "isActorType", type: "starship" },
                then: [
                    "calculateStarshipFrame",
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    "calculateStarshipCompartments",
                    "calculateStarshipCrew",
                    
                    "calculateStarshipCritThreshold",
                    "calculateStarshipDrift",
                    "calculateStarshipShields",
                    "calculateStarshipAblative",
                    "calculateStarshipPower",
                    "calculateStarshipSensors",
                    "calculateStarshipSpeed",
                    "calculateStarshipArmorClass",
                    "calculateStarshipTargetLock",
                    "calculateStarshipComputer",
                    
                    { closure: "calculateHitpoints", stackModifiers: "stackModifiers" },
                    "calculateStarshipCriticalStatus"
                    
                ]
            },
            {
                when: { closure: "isActorType", type: "vehicle" },
                then: [
                    { closure: "calculateActorResources", stackModifiers: "stackModifiers" },
                    { closure: "calculateHitpoints", stackModifiers: "stackModifiers" },
                    "calculateVehicleControlSkill",
                    "calculateVehicleHangar",
                    "calculateVehiclePassengers",
                    "identity",
                    "calculateVehicleSpeed"
                ]
            }
        ]
    });

    engine.add({
        name: "process-items",
        description: "Take all of the item data and process it.",
        rules: [
            "calculateItemData"
        ]
    });

    Hooks.callAll('Alternityd100.registerRules', engine);

    console.log("Alternityd100 | [SETUP] Done registering rules");
}