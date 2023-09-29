//import { MeasuredTemplatePF } from "../measure.js";

/**
 * A helper class for building MeasuredTemplates for PF1 spells and abilities
 *
 * @augments {MeasuredTemplate}
 */
export class AbilityTemplate extends MeasuredTemplate {
  /**
   * A factory method to create an AbilityTemplate instance using provided data
   *
   * @param {string} type -             The type of template ("cone", "circle", "rect" or "ray")
   * @param {number} distance -         The distance/size of the template
   * @param options
   * @returns {AbilityTemplate|null}     The template object, or null if the data does not produce a template
   */
  static fromData(options) {
    const type = options.type;
    const distance = options.distance;
    if (!type) return null;
    if (!distance) return null;
    if (!canvas.scene) return null;
    if (!["cone", "circle", "rect", "ray"].includes(type)) return null;

    // Prepare template data
    const templateData = {
      t: type,
      user: game.user.id,
      distance: distance || 5,
      direction: 0,
      x: 0,
      y: 0,
      fillColor: options.color ? options.color : game.user.color,
      texture: options.texture ? options.texture : null,
      _id: randomID(16),
    };

    // Additional type-specific data
    switch (type) {
      case "cone":
        if (game.settings.get("Alternityd100", "useStarfinderAOETemplates") === true) templateData.angle = 90;
        else templateData.angle = 53.13;
        break;
      case "rect":
        templateData.distance = Math.sqrt(Math.pow(distance, 2) + Math.pow(distance, 2));
        templateData.direction = 45;
        break;
      case "ray":
        templateData.width = 2;
        break;
      default:
        break;
    }

    // Return the template constructed from the item data
    const cls = CONFIG.MeasuredTemplate.documentClass;
    const template = new cls(templateData, { parent: canvas.scene });
    const object = new this(template);
    return object;
  }

  /* -------------------------------------------- */

  /**
   * Creates a preview of the spell template
   *
   * @param {Event} event   The initiating click event
   */
  async drawPreview(event) {
    const initialLayer = canvas.activeLayer;
    this.draw();
    this.active = true;
    this.layer.activate();
    this.layer.preview.addChild(this);
    return this.activatePreviewListeners(initialLayer);
  }

  /* -------------------------------------------- */

  /**
   * Activate listeners for the template preview
   *
   * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
   * @returns {Promise<boolean>} Returns true if placed, or false if cancelled
   */
  activatePreviewListeners(initialLayer) {
    return new Promise((resolve) => {
      const handlers = {};
      let moveTime = 0;
      let thisx = 0
      let thisy = 0
      const pfStyle = false ///game.settings.get("Alternityd100", "useStarfinderAOETemplates") === true;

      // Update placement (mouse-move)
      handlers.mm = (event) => {
        event.stopPropagation();
        const now = Date.now(); // Apply a 20ms throttle
        if (now - moveTime <= 20) return;
        const center = event.data.getLocalPosition(this.layer);
        const pos = canvas.grid.getSnappedPosition(center.x, center.y, 2);
        this.document.x = pos.x;
        this.document.y = pos.y;
        thisx=pos.x;
        thisy=pos.y;
        this.refresh();
        canvas.app.render();
        moveTime = now;
      };

      // Cancel the workflow (right-click)
      handlers.rc = (event, canResolve = true) => {
        this.layer.preview.removeChildren();
        canvas.stage.off("mousemove", handlers.mm);
        canvas.stage.off("mousedown", handlers.lc);
        canvas.app.view.oncontextmenu = null;
        canvas.app.view.onwheel = null;
        // Clear highlight
        this.active = false;
        const hl = canvas.grid.getHighlightLayer(`MeasuredTemplate.${this.id}`);
        hl.clear();

        initialLayer.activate();
        if (canResolve) resolve(false);
      };

      // Confirm the workflow (left-click)
      handlers.lc = async (event) => {
        handlers.rc(event, false);

        const newdoc = await duplicate(this.document)
        newdoc.x = thisx;
        newdoc.y = thisy;
       // console.log("Here" , this, newdoc)
        // Confirm final snapped position
      // await this.document.update(newdoc);
        console.log(canvas.scene.templates,this.document )
        // Create the template
        const result = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [newdoc]);

        console.log(result,canvas.scene)
        resolve(result);
      };

      // Rotate the template by 3 degree increments (mouse-wheel)
      handlers.mw = (event) => {
        if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
        event.stopPropagation();
        let delta, snap;
        if (event.ctrlKey) {
          if (this.document.t === "rect") {
            delta = Math.sqrt(canvas.dimensions.distance * canvas.dimensions.distance);
          } else {
            delta = canvas.dimensions.distance;
          }
          this.document.distance += delta * -Math.sign(event.deltaY);
        } else {
          if (pfStyle && this.document.t === "cone") {
            delta = 90;
            snap = event.shiftKey ? delta : 45;
          } else {
            delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
            snap = event.shiftKey ? delta : 5;
          }
          if (this.document.t === "rect") {
            snap = Math.sqrt(Math.pow(5, 2) + Math.pow(5, 2));
            this.document.distance += snap * -Math.sign(event.deltaY);
          } else {
            this.document.direction += snap * Math.sign(event.deltaY);
          }
        }
        this.refresh();
      };

      // Activate listeners
      if (this.controlIcon) this.controlIcon.removeAllListeners();
      canvas.stage.on("mousemove", handlers.mm);
      canvas.stage.on("mousedown", handlers.lc);
      canvas.app.view.oncontextmenu = handlers.rc;
      canvas.app.view.onwheel = handlers.mw;
      this.hitArea = new PIXI.Polygon([]);
    });
  }

  refresh() {
    if (!this.template) return;
    if (!canvas.scene) return;

    super.refresh();

    if (this.active) {
      this.highlightGrid();
    }

    return this;
  }
}
