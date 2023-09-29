import { getVisibleBars } from "./api.js";
import { d100ATokenHUD } from "../../d100hud.js"; 

/**
 * Modifies the given HTML to render additional resource input fields.
 * @param {TokenHUD} tokenHud The HUD object.
 * @param {jQuery} html The jQuery element of the token HUD.
 * @param {Object} data The data of the token HUD.
 */
export const extendTokenHud = async function (d100ATokenHud, html, data) {
    const visibleBars = getVisibleBars(d100ATokenHud.object.document, false);
console.log("used?",d100ATokenHud, html, data,visibleBars)

    // Group bars by side.
    data.bars = {
        "top-inner": [],
        "top-outer": [],
        "bottom-inner": [],
        "bottom-outer": [],
        "left-inner": [],
        "left-outer": [],
        "right-inner": [],
        "right-outer": []
    };
    visibleBars.forEach(bar => data.bars[bar.position].push(bar));

    const middleColumn = html.find(".col.middle");
    middleColumn.find("div.attribute").remove();

    const topBars = data.bars["top-outer"].reverse().concat(data.bars["top-inner"]);
    if (topBars.length) middleColumn.prepend(await renderBarInputs(topBars, "bar2"));

    const bottomBars = data.bars["bottom-inner"].reverse().concat(data.bars["bottom-outer"]);
    if (bottomBars.length) middleColumn.append(await renderBarInputs(bottomBars, "bar1"));

    const leftBars = data.bars["left-outer"].reverse().concat(data.bars["left-inner"]);
    if (leftBars.length) html.find(".col.left").prepend(await renderBarInputs(leftBars, "left-bars"));

    const rightBars = data.bars["right-inner"].reverse().concat(data.bars["right-outer"]);
    if (rightBars.length) html.find(".col.right").append(await renderBarInputs(rightBars, "right-bars"));

 //   html.find(".attribute input")
  //      .click(tokenHud._onAttributeClick)
  //      .keydown(tokenHud._onAttributeKeydown.bind(tokenHud))
   //     .focusout(tokenHud._onAttributeUpdate.bind(tokenHud));
   //     console.log(tokenHud, html, data)

   
}

/**
 * Renders the input template for the given bars.
 * @param {Object[]} bars The bars to render inputs for.
 * @param {string} css The CSS classes of the input container.
 * @returns {Promise.<string>} A promise representing the rendered inputs as HTML string.
 */
function renderBarInputs(bars, css) {
    console.log("Bars", bars)
    return renderTemplate("systems/Alternityd100/module/barbrawl/templates/resource-hud.hbs", { bars: bars, css: css });
}