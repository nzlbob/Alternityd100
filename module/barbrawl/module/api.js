/**
 * Valid bar visibility settings. See Foundry's CONST.TOKEN_DISPLAY_MODES for details.
 */
const BAR_VISIBILITY = {
    NONE: 0,
    ALWAYS: 50,
    HOVER: 30,
    CONTROL: 10
}

/**
 * Retreives all resource bars of the given token document.
 * @param {TokenDocument} tokenDoc The token document to fetch the bars from.
 * @returns {Object[]} An array of bar data.
 */
export const getBars = function (tokenDoc) {
    ////console.log("--------------tokenDoc------------\n",tokenDoc)
    const resourceBars = foundry.utils.getProperty(tokenDoc, "flags.barbrawl.resourceBars") ?? {};
    const barArray = Object.values(resourceBars);

    if (tokenDoc.bar1?.attribute && !resourceBars.bar1)
        barArray.push(getDefaultBar("bar1", tokenDoc.bar1.attribute));
    if (tokenDoc.bar2?.attribute && !resourceBars.bar2)
        barArray.push(getDefaultBar("bar2", tokenDoc.bar2.attribute));
        ////console.log("--------------barArray------------\n",barArray)
    return barArray.sort((b1, b2) => (b1.order ?? 0) - (b2.order ?? 0));
}

/**
 * Retreives the data of a single resource bar of the given token document.
 * @param {TokenDocument} tokenDoc The token document to fetch the bar from.
 * @param {string} barId The ID of the bar to fetch.
 * @returns {Object} A bar data object.
 */
export const getBar = function (tokenDoc, barId) {
    const resourceBars = foundry.utils.getProperty(tokenDoc._source, "flags.barbrawl.resourceBars") ?? {};
    if (barId === "bar1" && !resourceBars.bar1) return getDefaultBar(barId, tokenDoc.bar1.attribute);
    if (barId === "bar2" && !resourceBars.bar2) return getDefaultBar(barId, tokenDoc.bar2.attribute);
    return resourceBars[barId];
}

/**
 * Converts Foundry's token visibility mode to separate visibilities for the
 *  owner and everyone else. Existing values are preserved.
 * @param {Object} bar The data of the bar to convert.
 */
export const convertBarVisibility = function (bar) {
    if (!bar.hasOwnProperty("visibility")) return; // Already converted.

    const modes = CONST.TOKEN_DISPLAY_MODES;
    if (!bar.hasOwnProperty("ownerVisibility")) {
        // Determine visibility for owner.
        switch (bar.visibility) {
            case modes.NONE:
                bar.ownerVisibility = BAR_VISIBILITY.NONE;
                break;
            case modes.ALWAYS:
            case modes.OWNER:
                bar.ownerVisibility = BAR_VISIBILITY.ALWAYS;
                break;
            case modes.HOVER:
            case modes.OWNER_HOVER:
                bar.ownerVisibility = BAR_VISIBILITY.HOVER;
                break;
            case modes.CONTROL:
                bar.ownerVisibility = BAR_VISIBILITY.CONTROL;
                break;
        }
    }

    if (!bar.hasOwnProperty("otherVisibility")) {
        // Determine visibility for everyone else.
        switch (bar.visibility) {
            case modes.ALWAYS:
                bar.otherVisibility = BAR_VISIBILITY.ALWAYS;
                break;
            case modes.HOVER:
                bar.otherVisibility = BAR_VISIBILITY.HOVER;
                break;
            default:
                bar.otherVisibility = BAR_VISIBILITY.NONE;
        }
    }

    // Remove original visibility.
    delete bar.visibility;
}

/**
 * Retreives all resource bars of the given token that are currently visible.
 * @param {TokenDocument} tokenDoc The token document to fetch the bars from.
 * @param {Boolean} barsOnly Flag indicating whether single values should be excluded. Defaults to true.
 * @returns {Object[]} An array of visible bar data.
 */
export const getVisibleBars = function (tokenDoc, barsOnly = true) {
    let visibleBars = [];
    //console.log("barData  ",tokenDoc)
    for (let bar of getBars(tokenDoc)) {
        // Skip invisible bars if we don't need all resources
        //console.log("barData  ",getBarVisibility(tokenDoc, bar))
        if (barsOnly && getBarVisibility(tokenDoc, bar) === BAR_VISIBILITY.NONE) continue;

        // Add custom bars (can only be set on token)
        if (bar.attribute === "custom") {
            bar.editable = true;
            visibleBars.push(bar);
            continue;
        }
       // //console.log("barData  ",bar)
        // Update resource values
        let resource = tokenDoc.getBarAttribute(null, { alternative: bar.attribute });
        if (!resource || (barsOnly && resource.type !== "bar" && !bar.max)) continue;

        bar.value = resource.value;
        bar.max = resource.max ?? bar.max;
        bar.editable = resource.editable;

        // Check visibility
        visibleBars.push(bar);
    }

    return visibleBars;
}

/**
 * Creates an ID for a new bar, which is either 'bar1' for the first, 'bar2'
 *  for the second or a random ID for any subsequent bar.
 * @param {Object[]} existingBars The array of existing bar data.
 */
export const getNewBarId = function (existingBars) {
    const existingIds = existingBars.map((_i, el) => el.lastElementChild.id).get();
    if (!existingIds.includes("bar1")) return "bar1";
    if (!existingIds.includes("bar2")) return "bar2";
    return "bar" + randomID();
}

/**
 * Creates a new bar data object with default settings depending on the given ID.
 * @param {String} id The ID of the bar.
 * @param {String} attribute The attribute of the bar.
 */
export const getDefaultBar = function (id, attribute) {
    let defaultBar = {
        id: id,
        order: 0,
        attribute: attribute,
        ownerVisibility: BAR_VISIBILITY.ALWAYS,
        otherVisibility: BAR_VISIBILITY.NONE,
        mincolor: "#FF0000",
        maxcolor: "#80FF00",
        position: "bottom-inner"
    }

    if (attribute === "custom") {
        defaultBar.value = 10;
        defaultBar.max = 10;
    }

    if (id === "bar1") {
        defaultBar.mincolor = "#FF0000";
        defaultBar.maxcolor = "#80FF00";
    } else if (id === "bar2") {
        defaultBar.order = 1;
        defaultBar.position = "bottom-inner";
        defaultBar.mincolor = "#FF0000";
        defaultBar.maxcolor = "#80FF00";
    }

    return defaultBar;
}

/**
 * Resolves the actual visibility of the given bar, depending on whether the
 *  current player owns the given token.
 * @param {Token | TokenDocument} token The token (or its document) of the bar.
 * @param {Object} bar The data of the bar.
 * @returns {BAR_VISIBILITY} The visibility of the bar.
 */
function getBarVisibility(token, bar) {
    if (token.isOwner) {
        if (!bar.hasOwnProperty("ownerVisibility")) convertBarVisibility(bar);
        return bar.ownerVisibility;
    }

    if (!bar.hasOwnProperty("otherVisibility")) convertBarVisibility(bar);
    return bar.otherVisibility;
}

/**
 * Checks if the given bar should be visible on the given token.
 * @param {Token} token The token of the bar.
 * @param {Object} bar The data of the bar.
 * @returns {boolean} True if the bar is currently visible, false otherwise.
 */
export const isBarVisible = function (token, bar) {
    //console.log("token._canViewMode",token._canViewMode,getBarVisibility(token, bar))
    return token._canViewMode(getBarVisibility(token, bar));
}




/**
 * This runs when the cursor is hovered over the Token
 * /** Hook to update bar visibility. 
 // From Alternity
/// Hooks.on("hoverToken", refreshBarVisibility);
 * 
 * Updates temporary visibility states for every bar of the given token.
 * @param {Token} token The token to refresh.
 */
export const refreshBarVisibility = function (token) {
    //console.log("Token--  ",  token.name)
    //const resourceBars = token.document.getFlag("barbrawl", "resourceBars") ?? {};
    const resourceBars = getProperty(token.actor.flags, "resourceBars") ?? {};
    //console.log("resourceBars--  ",resourceBars)
    //console.log("flags--  ",token.actor.flags)
    const barContainer = token.bars.children;
    //console.log("barContainer--  ",barContainer,token.bars)
    for (let pixiBar of barContainer) {
        const bar = resourceBars[pixiBar.name];
        if (!bar) continue;

        const visibility = getBarVisibility(token, bar);
        //console.log("visibility--  ",visibility)
        if (visibility !== BAR_VISIBILITY.ALWAYS) pixiBar.visible = token._canViewMode(visibility);
    }
}