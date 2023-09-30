/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [
    // Attribute list partial.
    "systems/Alternityd100/templates/parts/sheet-attributes.html",
    "systems/Alternityd100/templates/parts/sheet-groups.html",

// Actor Sheet Partials
"systems/Alternityd100/templates/actors/parts/actor-biography.html",
"systems/Alternityd100/templates/actors/parts/actor-features-item.html",
"systems/Alternityd100/templates/actors/parts/actor-features.html",
"systems/Alternityd100/templates/actors/parts/actor-inventory-item.html",
"systems/Alternityd100/templates/actors/parts/actor-inventory.html",
"systems/Alternityd100/templates/actors/parts/actor-modifiers.html",
"systems/Alternityd100/templates/actors/parts/actor-movement-element.html",
"systems/Alternityd100/templates/actors/parts/actor-spellbook.html",
"systems/Alternityd100/templates/actors/parts/actor-traits.html",
"systems/Alternityd100/templates/actors/parts/actor-vehicle-system-item.html",
"systems/Alternityd100/templates/actors/parts/actor-vehicle-systems.html",
"systems/Alternityd100/templates/actors/parts/actor-skills.html",
"systems/Alternityd100/templates/actors/parts/actor-starship-crew.html",
"systems/Alternityd100/templates/actors/parts/actor-starship-status.html",
"systems/Alternityd100/templates/actors/parts/actor-starship-config.html",

    // Item Sheet Partials
    "systems/Alternityd100/templates/items/parts/item-action.html",
    "systems/Alternityd100/templates/items/parts/item-activation.html",
    "systems/Alternityd100/templates/items/parts/item-description.html",
    "systems/Alternityd100/templates/items/parts/item-capacity.html",
    "systems/Alternityd100/templates/items/parts/item-modifiers.html",
    "systems/Alternityd100/templates/items/parts/item-header.html",
    "systems/Alternityd100/templates/items/parts/item-status.html",
    "systems/Alternityd100/templates/items/parts/physical-item-details.html",
    "systems/Alternityd100/templates/items/parts/starship-component.html",
    "systems/Alternityd100/templates/items/parts/container-details.html",
    "systems/Alternityd100/templates/items/parts/item-armordetails.html",
    "systems/Alternityd100/templates/items/parts/item-ordnance-item.html",
    "systems/Alternityd100/templates/items/parts/item-ordnance.html",

    // Item Chat Partials
    "systems/Alternityd100/templates/chat/parts/attack-roll-footer.hbs",
    "systems/Alternityd100/templates/chat/parts/attack-roll-header.hbs",
    "systems/Alternityd100/templates/chat/parts/attack-roll-targets.hbs",

// Actor Sheet Partials
"systems/Alternityd100/templates/hud/token-hud.html",

    //Barbrawl
    "/systems/Alternityd100/module/barbrawl/templates/bar-config-minimal.hbs", 
    "/systems/Alternityd100/module/barbrawl/templates/bar-config.hbs"


  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};