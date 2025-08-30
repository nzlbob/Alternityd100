/**
 * The Application responsible for configuring a single Scene document.
 * @extends {DocumentSheet}
 * @param {Scene} object                    The Scene Document which is being configured
 * @param {DocumentSheetOptions} [options]  Application configuration options.
 */
export class d100ASceneConfig extends SceneConfig {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "scene-config",
        classes: ["sheet", "scene-sheet"],
        template: "systems/Alternityd100/templates/scenes/sceneConfig.html",
        width: 560,
        height: "auto",
        tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "basic"}]
      });
    }

      /** @inheritdoc */
  getData(options={}) {
    const context = super.getData(options);

    // Selectable types
    
    context.sceneTypes =   {
      character: "Character based scene (any)",
      starship: "Starship Combat Scene (hex)"
    }

    console.log(context,("scenetype" in context.data))
    if (context.document.isStarship) context.data.sceneType = "starship"
    console.log(this)
    return context;

  }

/* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {

console.log(formData)

    const scene = this.document;
    //Set Starship sheet mandatory defaults
    console.log(formData)
    if ( formData.sceneType === "starship" )
    {
      console.log("starship")
      formData["grid.units"] = "Mm";
      formData["grid.type"] = 4;
      formData["grid.distance"] = 1;
      formData.globalLight = true
      formData["flags.isStarship"] = true
    }
    if ( !(formData.sceneType === "starship") )
    {
      formData["flags.isStarship"] = false
    }
   

    // Toggle global illumination threshold
    if ( formData.hasGlobalThreshold === false ) formData.globalLightThreshold = null;
    delete formData.hasGlobalThreshold;
    // SceneData.texture.src is nullable in the schema, causing an empty string to be initialised to null. We need to
    // match that logic here to ensure that comparisons to the existing scene image are accurate.
    if ( formData["background.src"] === "" ) formData["background.src"] = null;
    if ( formData.foreground === "" ) formData.foreground = null;
    if ( formData.fogOverlay === "" ) formData.fogOverlay = null;

    // The same for fog colors
    if ( formData.fogUnexploredColor === "" ) formData.fogUnexploredColor = null;
    if ( formData.fogExploredColor === "" ) formData.fogExploredColor = null;

    // Determine what type of change has occurred
    const hasDefaultDims = (scene.background.src === null) && (scene.width === 4000) && (scene.height === 3000);
    const hasImage = formData["background.src"] || scene.background.src;
    const changedBackground =
      (formData["background.src"] !== undefined) && (formData["background.src"] !== scene.background.src);
    const clearedDims = (formData.width === null) || (formData.height === null);
    const needsThumb = changedBackground || !scene.thumb;
    const needsDims = formData["background.src"] && (clearedDims || hasDefaultDims);
    const createThumbnail = hasImage && (needsThumb || needsDims);

    // Update thumbnail and image dimensions
    if ( createThumbnail && game.settings.get("core", "noCanvas") ) {
      ui.notifications.warn("SCENES.GenerateThumbNoCanvas", {localize: true});
      formData.thumb = null;
    } else if ( createThumbnail ) {
      let td = {};
      try {
        td = await scene.createThumbnail({img: formData["background.src"] ?? scene.background.src});
      } catch(err) {
        Hooks.onError("SceneConfig#_updateObject", err, {
          msg: "Thumbnail generation for Scene failed",
          notify: "error",
          log: "error",
          scene: scene.id
        });
      }
      if ( needsThumb ) formData.thumb = td.thumb || null;
      if ( needsDims ) {
        formData.width = td.width;
        formData.height = td.height;
      }
    }

    // Warn the user if Scene dimensions are changing
    const delta = foundry.utils.diffObject(scene._source, foundry.utils.expandObject(formData));
    const changes = foundry.utils.flattenObject(delta);
    const textureChange = ["offsetX", "offsetY", "scaleX", "scaleY", "rotation"].map(k => `background.${k}`);
    if ( ["width", "height", "padding", "grid.size", ...textureChange].some(k => k in changes) ) {
      const confirm = await Dialog.confirm({
        title: game.i18n.localize("SCENES.DimensionChangeTitle"),
        content: `<p>${game.i18n.localize("SCENES.DimensionChangeWarning")}</p>`
      });
      if ( !confirm ) return;
    }

    // Perform the update
    return scene.update(formData);
  }

 /* -------------------------------------------- */

  /** @inheritdoc */
  async close(options={}) {
    console.log(this)

    this._resetScenePreview();
    return super.close(options);
  }



}
