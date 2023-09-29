export class d100ABaseScene extends Document {

  /* -------------------------------------------- */
  /*  Model Configuration                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static metadata = Object.freeze(mergeObject(super.metadata, {
    name: "Scene",
    collection: "scenes",
    indexed: true,
    compendiumIndexFields: ["_id", "name", "thumb", "sort"],
    embedded: {
      AmbientLight: "lights",
      AmbientSound: "sounds",
      Drawing: "drawings",
      MeasuredTemplate: "templates",
      Note: "notes",
      Tile: "tiles",
      Token: "tokens",
      Wall: "walls"
    },
    label: "DOCUMENT.Scene",
    labelPlural: "DOCUMENT.Scenes",
    //preserveOnImport: [...super.metadata.preserveOnImport, "active"]
  }, {inplace: false}));

  /** @inheritdoc */
  static defineSchema() {
    return {
      _id: new DocumentIdField(),
      name: new StringField({required: true, blank: false}),
      sceneType: new StringField({required: true, blank: false}),
      // Navigation
      active: new BooleanField(),
      navigation: new BooleanField({initial: true}),
      navOrder: new NumberField({required: true, nullable: false, integer: true, initial: 0}),
      navName: new HTMLField(),

      // Canvas Dimensions
      background: new TextureData(),
      foreground: new FilePathField({categories: ["IMAGE", "VIDEO"]}),
      foregroundElevation: new NumberField({required: false, positive: true, integer: true}),
      thumb: new FilePathField({categories: ["IMAGE"]}),
      width: new NumberField({integer: true, positive: true, initial: 4000}),
      height: new NumberField({integer: true, positive: true, initial: 3000}),
      padding: new NumberField({required: true, nullable: false, min: 0, max: 0.5, step: 0.05, initial: 0.25}),
      initial: new SchemaField({
        x: new NumberField({integer: true, nullable: true, initial: undefined}),
        y: new NumberField({integer: true, nullable: true, initial: undefined}),
        scale: new NumberField({nullable: true, min: 0.25, max: 3, initial: undefined})
      }),
      backgroundColor: new ColorField({initial: "#999999"}),

      // Grid Configuration
      grid: new SchemaField({
        type: new NumberField({required: true, choices: Object.values(GRID_TYPES),
          initial: GRID_TYPES.SQUARE, validationError: "must be a value in CONST.GRID_TYPES"}),
        size: new NumberField({required: true, nullable: false, integer: true, min: GRID_MIN_SIZE,
          initial: 100, validationError: `must be an integer number of pixels, ${GRID_MIN_SIZE} or greater`}),
        color: new ColorField({required: true, nullable: false, initial: "#000000"}),
        alpha: new AlphaField({initial: 0.2}),
        distance: new NumberField({required: true, nullable: false, positive: true,
          initial: () => game.system.gridDistance || 1}),
        units: new StringField({initial: () => game.system.gridUnits ?? ""})
      }),

      // Vision and Lighting Configuration
      tokenVision: new BooleanField({initial: true}),
      fogExploration: new BooleanField({initial: true}),
      fogReset: new NumberField({nullable: false, initial: Date.now}),
      globalLight: new BooleanField(),
      globalLightThreshold: new AlphaField({nullable: true, initial: null}),
      darkness: new AlphaField({initial: 0}),
      fogOverlay: new FilePathField({categories: ["IMAGE", "VIDEO"]}),
      fogExploredColor: new ColorField({label: "SCENES.FogExploredColor"}),
      fogUnexploredColor: new ColorField({label: "SCENES.FogUnexploredColor"}),

      // Embedded Collections
      drawings: new EmbeddedCollectionField(BaseDrawing),
      tokens: new EmbeddedCollectionField(BaseToken$1),
      lights: new EmbeddedCollectionField(BaseAmbientLight),
      notes: new EmbeddedCollectionField(BaseNote),
      sounds: new EmbeddedCollectionField(BaseAmbientSound),
      templates: new EmbeddedCollectionField(BaseMeasuredTemplate),
      tiles: new EmbeddedCollectionField(BaseTile$1),
      walls: new EmbeddedCollectionField(BaseWall$1),

      // Linked Documents
      playlist: new ForeignDocumentField(BasePlaylist$1),
      playlistSound: new ForeignDocumentField(BasePlaylistSound$1, {idOnly: true}),
      journal: new ForeignDocumentField(BaseJournalEntry$1),
      journalEntryPage: new ForeignDocumentField(BaseJournalEntryPage$1, {idOnly: true}),
      weather: new StringField(),

      // Permissions
      folder: new ForeignDocumentField(BaseFolder$1),
      sort: new IntegerSortField(),
      ownership: new DocumentOwnershipField(),
      flags: new ObjectField(),
      _stats: new DocumentStatsField()
    }
  }

  /* -------------------------------------------- */
  /*  Deprecations and Compatibility              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(data) {
    /**
     * Rename permission to ownership
     * @deprecated since v10
     */
    this._addDataFieldMigration(data, "permission", "ownership");

    /**
     * Migration to inner grid schema and TextureData. Can be safely removed in V13+
     * @deprecated since v10
     */
    if ( ("grid" in data) && (typeof data.grid !== "object") ) data.grid = {size: data.grid};
    for ( const [oldKey, newKey] of Object.entries({
      "gridType": "grid.type",
      "gridColor": "grid.color",
      "gridAlpha": "grid.alpha",
      "gridDistance": "grid.distance",
      "gridUnits": "grid.units",
      "img": "background.src",
      "shiftX": "background.offsetX",
      "shiftY": "background.offsetY"
    }) ) this._addDataFieldMigration(data, oldKey, newKey);
    return super.migrateData(data);
  }

  /* ---------------------------------------- */

  /** @inheritdoc */
  static shimData(data, options) {
    const shims = {};
    /**
     * Migration to inner grid schema.
     * @deprecated since v10
     */
    mergeObject(shims, {
      gridType: "grid.type",
      gridColor: "grid.color",
      gridAlpha: "grid.alpha",
      gridDistance: "grid.distance",
      gridUnits: "grid.units"
    });
    /**
     * Migration to TextureData.
     * @deprecated since v10
     */
    mergeObject(shims, {
      img: "background.src",
      shiftX: "background.offsetX",
      shiftY: "background.offsetY"
    });
    /**
     * Rename permission to owners.
     * @deprecated since v10
     */
    shims.permission = "ownership";
    this._addDataFieldShims(data, shims, {since: 10, until: 12});
    return super.shimData(data, options);
  }
}
