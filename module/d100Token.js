/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class d100AToken extends foundry.canvas.placeables.Token {
  /** @override */

  /* -------------------------------------------- */

  /**
   * Rotation is an alias for direction
   * @returns {number}
   */
  get rotation() {
    return this.document.rotation;
    // return (this.document.rotation + 180) % 360;
  }

  /**
   * Alternity-facing heading in degrees (0 = North).
   * This is a view over the underlying TokenDocument rotation.
   */
  get d100ARotation() {
    return this.document?.d100ARotation ?? this.rotation;
  }



  /* -------------------------------------------- */
  //  This was copied out of foundary.js as V11 made the function private.
  /**
   * Helper method to determine whether a token attribute is viewable under a certain mode
   * @param {number} mode   The mode from CONST.TOKEN_DISPLAY_MODES
   * @returns {boolean}      Is the attribute viewable?
   */
  _xxxxcanViewMode(mode) {
    if (mode === CONST.TOKEN_DISPLAY_MODES.NONE) return false;
    else if (mode === CONST.TOKEN_DISPLAY_MODES.ALWAYS) return true;
    else if (mode === CONST.TOKEN_DISPLAY_MODES.CONTROL) return this.controlled;
    else if (mode === CONST.TOKEN_DISPLAY_MODES.HOVER) return (this.hover || canvas.tokens._highlight);
    else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER) return this.isOwner && this.hover;
    else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER) return this.isOwner;
    return false;
  }


  // Copy of the Tokenlayer toggleCombat function
  /**
   * 
   * @param {*} state - The state you want the token or crew to be in
   * @param {*} combat - the combat to add the 
   * @param {*} token 
   * @returns 
   */


  /**
   * Update an emitted light source associated with this Token.
   * @param {object} [options={}]
   * @param {boolean} [options.defer]      Defer updating perception to manually update it later.
   * @param {boolean} [options.deleted]    Indicate that this light source has been deleted.
   */

  /*
    updateLightSource({defer=false, deleted=false}={}) {
  
      // Prepare data
      const origin = this.#adjustedCenter;
      const sourceId = this.sourceId;
      const d = canvas.dimensions;
      const isLightSource = this.emitsLight;
  
      // Initialize a light source
      if ( isLightSource && !deleted ) {
        const lightConfig = foundry.utils.mergeObject(this.document.light.toObject(false), {
          x: origin.x,
          y: origin.y,
          elevation: this.document.elevation,
          dim: Math.clamp(this.getLightRadius(this.document.light.dim), 0, d.maxR),
          bright: Math.clamp(this.getLightRadius(this.document.light.bright), 0, d.maxR),
          externalRadius: this.externalRadius,
          z: this.document.getFlag("core", "priority"),
          seed: this.document.getFlag("core", "animationSeed"),
          rotation: this.document.rotation,
          preview: this.isPreview
        });
        this.light.initialize(lightConfig);
        canvas.effects.lightSources.set(sourceId, this.light);
      }
  
      // Remove a light source
      else deleted = canvas.effects.lightSources.delete(sourceId);
  
      // Schedule a perception update
      if ( !defer && (isLightSource || deleted) ) {
        canvas.perception.update({
          refreshLighting: true,
          refreshVision: true
        });
      }
    }
  */


}

