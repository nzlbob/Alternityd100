import { getBar, getVisibleBars, isBarVisible } from "./api.js";


/**
 * Object containing current bar rendering promises per token.
 */
var renderingTokens = {};

/**
 * Object containing settings for the different bar styles.
 */
const barPresets = {
    minimal: {
        heightOffset: -2,
        borderWidth: 0,
        borderRadius: 0
    },
    default: {
        borderWidth: 1,
        borderRadius: 2
    },
    large: {
        heightOffset: 2,
        borderWidth: 1,
        borderRadius: 2
    },
    legacy: {
        borderWidth: 2,
        borderRadius: 3
    }
}

/**
 * Extends the original Token.drawBars() with custom bar rendering. 
 *  The original function is not called. If available, the libWrapper module is
 *  used for better compatibility.
 */
export const extendBarRenderer = function () {
   /* if (game.modules.get("lib-wrapper")?.active) {
        // Override using libWrapper: https://github.com/ruipin/fvtt-lib-wrapper
        libWrapper.register("barbrawl", "Token.prototype.drawBars", drawBrawlBars, "OVERRIDE");
        libWrapper.register("barbrawl", "TokenDocument.prototype.getBarAttribute",
            function (wrapped, barId, { alternative } = {}) {
                const attribute = alternative ?? getBar(this, barId)?.attribute;
                if (typeof attribute !== "string") return null;
                return wrapped(null, { alternative: attribute });
            }, "MIXED");
    } else {
        */
        // Manual override
        Token.prototype.drawBars = drawBrawlBars;

        const originalGetBarAttribute = TokenDocument.prototype.getBarAttribute;
        TokenDocument.prototype.getBarAttribute = function (barId, { alternative } = {}) {
            const attribute = alternative ?? getBar(this, barId)?.attribute;
            if (typeof attribute !== "string") return null;
            return originalGetBarAttribute.call(this, null, { alternative: attribute });
        };
   // }
}

/**
 * Creates rendering objects for each of the token's resource bars.
 * @constant {Token} this The token that this function is called on.
 */
function drawBrawlBars() {
    let visibleBars = getVisibleBars(this.document);
    if (visibleBars.length === 0) return;

    const reservedSpace = {
        "top-inner": 0,
        "top-outer": 0,
        "bottom-inner": 0,
        "bottom-outer": 0,
        "left-inner": 0,
        "left-outer": 0,
        "right-inner": 0,
        "right-outer": 0
    };

    this.displayBars = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
    const asyncRender = async () => {
    //   console.log(this);
        this.bars.removeChildren();
        for (let barData of visibleBars) await createResourceBar(this, barData, reservedSpace);
        this.bars.visible = this.bars.children.length > 0;
    };

    // Make sure that we are only rendering bars for each token once.
    if (renderingTokens[this.id]) {
    //    console.log("barbrawl | Bars are already rendering, deferring second call.");
        renderingTokens[this.id] = renderingTokens[this.id]
            .then(asyncRender).finally(() => delete renderingTokens[this.id]);
    }
    else {
        renderingTokens[this.id] = asyncRender().finally(() => delete renderingTokens[this.id]);
    }
}

/**
 * Creates a rendering object for a single resource bar.
 * @param {Token} token The token on which to create the bar.
 * @param {Object} data The object containing the bar's data.
 * @param {Object} reservedSpace The amount of already used space per position.
 */
async function createResourceBar(token, data, reservedSpace) {
    if (!data?.max) return;

    // Create the rendering object
    let bar = new PIXI.Container();
    bar.name = data.id;
    if (!data.fgImage) {
        // When there is no foreground image, we'll need a drawing object.
        const gfx = bar.addChild(new PIXI.Graphics);
        gfx.name = "gfx";
    }

    bar.contentWidth = calculateWidth(data, token, reservedSpace);
    const renderedHeight = drawResourceBar(token, bar, data, await loadBarTextures(data));
    const position = calculatePosition(data, renderedHeight, token, reservedSpace);
    reservedSpace[data.position] += renderedHeight;
    bar.position.set(position[0], position[1]);
    token.bars.addChild(bar);
}

/**
 * Redraws a single resource bar without changing its position.
 * @param {Token} token The token to redraw the bar on.
 * @param {Object} barData The data of the bar to refresh.
 */
export const redrawBar = async function (token, barData) {
    const bar = token.hud.bars.getChildByName(barData.id);
    if (bar) {
        const gfx = bar.getChildByName("gfx");
        bar.removeChildren();
        if (gfx) {
            // Clear graphics object instead of removing it.
            gfx.clear();
            bar.addChild(gfx);
        }

        const textures = await loadBarTextures(barData);
        drawResourceBar(token, bar, barData, textures);
    }
}

/**
 * Loads textures required for rendering the bar.
 * @param {Object} data The data of the bar.
 * @returns {Promise.<PIXI.Texture[]>} An array containing the background and foreground texture.
 */
async function loadBarTextures(data) {
    const bgTexture = data.bgImage ? await loadTexture(data.bgImage) : null;
    const fgTexture = data.fgImage ? await loadTexture(data.fgImage) : null;
    return [bgTexture, fgTexture];
}

/**
 * Renders all components of the bar onto the given PIXI object.
 * @param {Token} token The token to draw the bar on.
 * @param {PIXI.Graphics | PIXI.Sprite} bar The graphics object to draw onto.
 * @param {Object} data The data of the bar to draw.
 * @param {PIXI.Texture[]} textures The loaded textures of bar images.
 * @returns {number} The final height of the bar.
 */
function drawResourceBar(token, bar, data, textures) {
    let labelValue = data.value;
    let labelMax = data.max;

    // Apply approximation.
    if (data.subdivisions && (data.subdivisionsOwner || !token.isOwner)) {
        labelValue = Math.ceil(labelValue / data.max * data.subdivisions);
        labelMax = data.subdivisions;
    }

    // Update visibility.
    bar.visible = isBarVisible(token, data);

    // Defer rendering to HP Bar module for compatibility.
    if (data.attribute === "attributes.hp" && game.modules.get("arbron-hp-bar")?.active) {
        drawExternalBar(token, bar, data);
        drawBarLabel(bar, token, data, labelValue, labelMax);
        return bar.contentHeight;
    }

    bar.contentHeight ||= getBarHeight(token, bar.contentWidth, textures);
    if (bar.contentWidth <= 0 || bar.contentHeight <= 0) return;

    drawBarBackground(bar, data, textures[0]);

    const barValue = data.invert ? labelMax - labelValue : labelValue;
    const barPercentage = Math.clamped(barValue, 0, labelMax) / labelMax;

    drawBarForeground(bar, data, textures[1], barValue, barPercentage);
    drawBarLabel(bar, token, data, labelValue, labelMax);

    // Rotate left & right bars.
    if (data.position.startsWith("left")) bar.angle = -90;
    else if (data.position.startsWith("right")) bar.angle = 90;

    return bar.contentHeight;
}

/**
 * Calculates the target height of the bar from its textures (if available) or
 *  from the canvas dimensions and its style.
 * @param {Token} token The token that the bar belongs to.
 * @param {number} width The width of the bar.
 * @param {PIXI.Texture[]=} textures The loaded textures of bar images. Defaults to two null elements.
 * @returns {number} The target height of the bar.
 */
function getBarHeight(token, width, textures = [null, null]) {
    if (textures[0]) return textures[0].height * width / textures[0].width;
    else if (textures[1]) return textures[1].height * width / textures[1].width;


/****
 * 
 * THIS CHANGES THE BAR HEIGHT
 */

    let height = Math.max((canvas.dimensions.size / 50), 3);
    //height = 4
    if (token.height >= 2) height *= 1.6; // Enlarge the bar for large tokens.
   // height += barPresets[game.settings.get("barbrawl", "barStyle")].heightOffset ?? 0;
    
   // console.log("Bar Height", height, game.settings)
    return height;
}

/**
 * Draws the bar's background, which can be a texture or a style. Note that no
 *  regular styles will be drawn when the bar has a foreground image.
 * @param {PIXI.Graphics | PIXI.Sprite} bar The graphics object to draw onto.
 * @param {Object} data The data of the bar.
 * @param {PIXI.Texture?} texture The optional background texture to draw.
 */
function drawBarBackground(bar, data, texture) {
    if (texture) {
        // Draw background texture.
        const bgSprite = new PIXI.Sprite(texture);
        bgSprite.width = bar.contentWidth;
        bgSprite.height = bar.contentHeight;
        bar.addChildAt(bgSprite, 0); // Insert at 0 to render first.
    } else if (!data.fgImage) { // Don't draw background behind foreground image.
        // Draw background color.
        const gfx = bar.getChildByName("gfx");
        const preset = barPresets[game.settings.get("barbrawl", "barStyle")];
        gfx.beginFill(0x000000, 0.5);
        if (preset.borderWidth) gfx.lineStyle(preset.borderWidth, 0x000000, 0.9);
        gfx.drawRoundedRect(0, 0, bar.contentWidth, bar.contentHeight, preset.borderRadius);
    }
}

/**
 * Draws the bar's foreground, which can be a texture or a style.
 * @param {PIXI.Graphics | PIXI.Sprite} bar The graphics object to draw onto.
 * @param {Object} data The data of the bar.
 * @param {PIXI.Texture?} texture The optional foreground texture to draw.
 * @param {number} value The displayed value of the bar.
 * @param {number} percentage The displayed percentage of the bar.
 */
function drawBarForeground(bar, data, texture, value, percentage) {
    if (percentage <= 0.01) return;
    if (texture) {
        // Draw foreground texture.
        const croppedTex = new PIXI.Texture(texture,
            new PIXI.Rectangle(0, 0, texture.width * percentage, texture.height));
        const fgSprite = new PIXI.Sprite(croppedTex);
        fgSprite.width = bar.contentWidth * percentage;
        fgSprite.height = texture.height * bar.contentWidth / texture.width;

        // Center foreground on top of background image.
        if (data.bgImage) {
            const heightDiff = bar.contentHeight - fgSprite.height;
            if (Math.abs(heightDiff) > 0.01) fgSprite.y = heightDiff / 2;
        }

        bar.addChild(fgSprite);
    } else {
        // Draw foreground color.
        const gfx = bar.getChildByName("gfx");
        const preset = barPresets[game.settings.get("barbrawl", "barStyle")];
        const color = interpolateColor(data.mincolor, data.maxcolor, percentage);
        const segments = value === data.value ? 1 : value;

        gfx.beginFill(color, 0.8);
        if (preset.borderWidth) gfx.lineStyle(preset.borderWidth, 0x000000, 0.9);
        const segmentWidth = percentage * bar.contentWidth / segments;
        const radius = Math.max(0, preset.borderRadius - 1);

        if (preset.borderWidth > 0) {
            // With borders, draw all segments sequentially.
            for (let i = 0; i < segments; i++) {
                gfx.drawRoundedRect(segmentWidth * i, 0, segmentWidth, bar.contentHeight, radius);
            }
        } else {
            // Without borders, additional space between segments is needed as a divider.
            gfx.drawRoundedRect(0, 0, segmentWidth, bar.contentHeight, radius);
            for (let i = 1; i < segments; i++) {
                gfx.drawRoundedRect(segmentWidth * i + 1, 0, segmentWidth - 1, bar.contentHeight, radius);
            }
        }
    }
}

/**
 * Draws the bar's label, including the bar text and the configured label style.
 * @param {PIXI.Graphics | PIXI.Sprite} bar The graphics object to draw onto.
 * @param {Token} token The token that the bar belongs to.
 * @param {Object} data The data of the bar.
 * @param {number} value The value for the label.
 * @param {number} max The maximum value for the label.
 */
function drawBarLabel(bar, token, data, value, max) {
    let textStyle = data.style;
    if (!textStyle || textStyle === "user") textStyle = game.settings.get("barbrawl", "textStyle");
    switch (textStyle) {
        case "none":
            if (data.label) createBarLabel(bar, token, data, data.label);
            break;
        case "fraction":
            createBarLabel(bar, token, data, `${data.label ? data.label + "  " : ""}${value} / ${max}`);
            break;
        case "percent":
            // Label does not match bar percentage because of possible inversion.
            const percentage = Math.round((Math.clamped(value, 0, max) / max) * 100);
            createBarLabel(bar, token, data, `${data.label ? data.label + "  " : ""}${percentage}%`);
            break;
        default:
            console.error(`barbrawl | Unknown label style ${game.settings.get("barbrawl", "textStyle")}.`);
    }
}

/**
 * Adds a PIXI.Text object on top of the given graphics object.
 * @param {PIXI.Graphics | PIXI.Sprite} bar The PIXI object to add the text to.
 * @param {Token} token The token that the bar belongs to.
 * @param {Object} data The data of the bar.
 * @param {string} text The text to display.
 */
function createBarLabel(bar, token, data, text) {
    let font = CONFIG.canvasTextStyle.clone();
    font.fontSize = data.fgImage || data.bgImage ? getBarHeight(token, bar.contentWidth) : bar.contentHeight;
 //   console.log(font)

/****
 * 
 * THIS CHANGES THE BAR FONTHEIGHT
 */

    font.fontSize = 4
    const barText = new PIXI.Text(text, font);
    barText.name = bar.name + "-text";
    barText.x = bar.contentWidth / 2;
    barText.y = bar.contentHeight / 2;
    barText.anchor.set(0.5);
    barText.resolution = 1.5;
    bar.addChild(barText);
}

/**
 * Interpolates two RGB hex colors to get a midway point at the given
 *  percentage. The colors are converted into the HSV space to produce more
 *  intuitive results.
 * @param {string} minColor The lowest color as RGB hex string.
 * @param {string} maxColor The highest color as RGB hex string.
 * @param {number} percentage The interpolation interval.
 * @returns {string} The interpolated color as RBG hex string.
 */
function interpolateColor(minColor, maxColor, percentage) {
    /*import { Color } from 'pixi.js';
    new Color('white').toRgb(); // returns { r: 1, g: 1, b: 1 }*/


   // import { Color } from 'pixi.js';
    //let a = new PIXI.Color(minColor).toHex(); // returns "#ffffff"
    //let b = new PIXI.Color(maxColor).toHex(); // returns "#ffffff"
    let minRgb = new PIXI.Color(minColor).toRgbArray();
    let maxRgb = new PIXI.Color(maxColor).toRgbArray();

    //let minRgb = PIXI.utils.hex2rgb(a);
    //let maxRgb = PIXI.utils.hex2rgb(b);
   // let minRgb = Color.toRgbArray(Color.toNumber(minColor));  //error
   // let maxRgb = Color.toRgbArray(Color.toNumber(maxColor));  // error

    let minHsv = rgb2hsv(minRgb[0], minRgb[1], minRgb[2]);
    let maxHsv = rgb2hsv(maxRgb[0], maxRgb[1], maxRgb[2]);

    let deltaHue = maxHsv[0] - minHsv[0];
    let deltaAngle = deltaHue + ((Math.abs(deltaHue) > 180) ? ((deltaHue < 0) ? 360 : -360) : 0);

    let targetHue = minHsv[0] + deltaAngle * percentage;
    let targetSaturation = (1 - percentage) * minHsv[1] + percentage * maxHsv[1];
    let targetValue = (1 - percentage) * minHsv[2] + percentage * maxHsv[2];

   // let c = hsv2rgb(targetHue, targetSaturation, targetValue)
    return new PIXI.Color(hsv2rgb(targetHue, targetSaturation, targetValue)).toHex()
    //return PIXI.utils.rgb2hex(hsv2rgb(targetHue, targetSaturation, targetValue));
}

/**
 * Converts a color from RGB to HSV space.
 * Source: https://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript/54070620#54070620
 * @param {number} r The red value of the color as float (0 to 1).
 * @param {number} g The green value of the color as float (0 to 1).
 * @param {number} b The blue value of the color as float (0 to 1).
 * @returns {number[]} The HSV color with hue in degrese (0 to 360), saturation and value as float (0 to 1).
 */
function rgb2hsv(r, g, b) {
    let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

/**
 * Converts a color from HSV to RGB space.
 * Source: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately/54024653#54024653
 * @param {number} h The hue of the color in degrees (0 to 360).
 * @param {number} s The saturation of the color as float (0 to 1).
 * @param {number} v The value of the color as float (0 to 1).
 * @returns {number[]} The RGB color with each component as float (0 to 1).
 */
function hsv2rgb(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}

/**
 * Calculates the width of the bar with the given position relative to the
 *  token's dimensions, respecting already reserved space.
 * @param {Object} barData The data of the bar.
 * @param {Token} token The token to read dimensions from.
 * @param {Object} reservedSpace The amount of already used space per position.
 * @returns {number} The target width of the bar.
 */
function calculateWidth(barData, token, reservedSpace) {
    const indent = ((barData.indentLeft ?? 0) + (barData.indentRight ?? 0)) / 100;
    switch (barData.position) {
        case "top-inner":
        case "bottom-inner":
            return token.w - reservedSpace["left-inner"] - reservedSpace["right-inner"] - indent * token.w;
        case "top-outer":
        case "bottom-outer":
            return token.w - indent * token.w;
        case "left-inner":
        case "right-inner":
            return token.h - reservedSpace["top-inner"] - reservedSpace["bottom-inner"] - indent * token.h;
        case "left-outer":
        case "right-outer":
            return token.h - indent * token.h;
    }
}

/**
 * Calculates the vertical coordinate of the bar with the given position
 *  relative to the token's dimension, respecting already reserved space.
 * @param {Object} barData The data of the bar.
 * @param {number} barHeight The height of the rendered bar.
 * @param {number} leftIndent The amount of bar indentation to apply.
 * @param {Token} token The token to read dimensions from.
 * @param {Object} reservedSpace The amount of already used space per position.
 * @returns {number[]} The target X- and Y-coordinate of the bar.
 */
function calculatePosition(barData, barHeight, token, reservedSpace) {
    const leftIndent = (barData.indentLeft ?? 0) / 100;
    switch (barData.position) {
        case "top-inner": return [reservedSpace["left-inner"] + leftIndent * token.w, reservedSpace["top-inner"]];
        case "top-outer": return [leftIndent * token.w, (reservedSpace["top-outer"] + barHeight) * -1];
        case "bottom-inner": return [reservedSpace["left-inner"] + leftIndent * token.w, token.h - reservedSpace["bottom-inner"] - barHeight];
        case "bottom-outer": return [leftIndent * token.w, token.h + reservedSpace["bottom-outer"]];
        case "left-inner": return [reservedSpace["left-inner"], token.h - reservedSpace["bottom-inner"] - leftIndent * token.h];
        case "left-outer": return [(reservedSpace["left-outer"] + barHeight) * -1, token.h - leftIndent * token.h];
        case "right-inner": return [token.w - reservedSpace["right-inner"], reservedSpace["top-inner"] + leftIndent * token.h];
        case "right-outer": return [reservedSpace["right-outer"] + barHeight + token.w, leftIndent * token.h];
    }
}

/**
 * Renders a bar using the Foundry function instead of the Bar Brawl renderer.
 * After the bar is drawn, its position and angle will be overriden.
 * @param {Token} token The token to draw the bar on.
 * @param {PIXI.Graphics} bar The graphics object to draw onto.
 * @param {Object} data The data of the bar to draw.
 * @returns {number} The final height of the bar.
 */
function drawExternalBar(token, bar, data) {
    let gfx = bar.getChildByName("gfx");
    if (!gfx) {
        gfx = bar.addChild(new PIXI.Graphics());
        gfx.name = "gfx";
    }

    token._drawBar(0, gfx, data);
    gfx.position.set(0, 0); // Do not allow external code to set the bar's position.
    bar.contentHeight = gfx.height - (gfx.line?.width ?? 0);

    // Rotate left & right bars.
    if (data.position.startsWith("left")) bar.angle = -90;
    else if (data.position.startsWith("right")) bar.angle = 90;

    return bar.contentHeight;
}