/**
 * The client-side Scene document which extends the common BaseScene model.
 * @extends documents.BaseItem
 * @mixes ClientDocumentMixin
 *
 * @see {@link Scenes}            The world-level collection of Scene documents
 * @see {@link SceneConfig}       The Scene configuration application
 */
export class d100AScene extends Scene {

/** @inheritdoc */
prepareBaseData() {
  super.prepareBaseData()
  console.log("d100AScene",this)
  //this.sceneType = this.sceneType? this.sceneType : "" ; 


}
/*
static defineSchema() {


  let data = super.defineSchema()
  console.log(data)
  data.weather = null
  data.weather = {"atmo":"snow", "type":"space"}
  console.log(data)
  return data
  }
*/
get isStarship(){
  //console.log("xx")
  //if (this.tokens[0]?.actorId == "Mm") return true
  return this.flags.isStarship
  let zeroActor //= this.tokens[0]?.actor?.type
  let zeroToken = this.tokens[0]?._id
  // Tokens is a collection - works wierd have to use contents!!!

  console.log("isStarship",this.tokens.contents)
  if (this.tokens.contents.length){
    zeroActor = this.tokens.contents[0].actor?.type
    if (zeroActor == "starship") 
    {

      const update = {
        "flags.isStarship": true
    };
    this.update(update);

      console.log("zeroActor",zeroActor,this)
      return true

    }
    const update = {
      "flags.isStarship": false
  };
  this.update(update);
  return false
  }

  console.log("isStarship",this)
  if (zeroActor == "starship") return true
  if (this.grid.units == "Mm") return true





}

}


/**
   * An abstract class that defines the base pattern for a data field within a data schema.
   * @abstract
   *
   * @property {string} name                The name of this data field within the schema that contains it
   *
   * @property {boolean} required=false     Is this field required to be populated?
   * @property {boolean} nullable=false     Can this field have null values?
   * @property {Function|*} initial         The initial value of a field, or a function which assigns that initial value.
   * @property {Function} validate          A data validation function which accepts one argument with the current value.
   * @property {boolean} [readonly=false]   Should the prepared value of the field be read-only, preventing it from being
   *                                        changed unless a change to the _source data is applied.
   * @property {string} label               A localizable label displayed on forms which render this field.
   * @property {string} hint                Localizable help text displayed on forms which render this field.
   * @property {string} validationError     A custom validation error string. When displayed will be prepended with the
   *                                        document name, field name, and candidate value.
   */
class DataField {
  /**
   * @param {DataFieldOptions} options    Options which configure the behavior of the field
   */
  constructor(options={}) {
    /**
     * The initially provided options which configure the data field
     * @type {DataFieldOptions}
     */
    this.options = options;
    for ( let k in this.constructor._defaults ) {
      this[k] = k in this.options ? this.options[k] : this.constructor._defaults[k];
    }
  }

  /**
   * The field name of this DataField instance.
   * This is assigned by SchemaField#initialize.
   * @internal
   */
  name;

  /**
   * A reference to the parent schema to which this DataField belongs.
   * This is assigned by SchemaField#initialize.
   * @internal
   */
  parent;

  /**
   * Default parameters for this field type
   * @return {DataFieldOptions}
   * @protected
   */
  static get _defaults() {
    return {
      required: false,
      nullable: false,
      initial: undefined,
      readonly: false,
      label: "",
      hint: "",
      validationError: "is not a valid value"
    }
  }

  /**
   * A dot-separated string representation of the field path within the parent schema.
   * @type {string}
   */
  get fieldPath() {
    return [this.parent?.fieldPath, this.name].filterJoin(".");
  }

  /**
   * Apply a function to this DataField which propagates through recursively to any contained data schema.
   * @param {string|function} fn          The function to apply
   * @param {*} value                     The current value of this field
   * @param {object} [options={}]         Additional options passed to the applied function
   * @returns {object}                    The results object
   */
  apply(fn, value, options={}) {
    if ( typeof fn === "string" ) fn = this[fn];
    return fn.call(this, value, options);
  }

  /* -------------------------------------------- */
  /*  Field Cleaning                              */
  /* -------------------------------------------- */

  /**
   * Coerce source data to ensure that it conforms to the correct data type for the field.
   * Data coercion operations should be simple and synchronous as these are applied whenever a DataModel is constructed.
   * For one-off cleaning of user-provided input the sanitize method should be used.
   * @param {*} value           The initial value
   * @param {object} [options]  Additional options for how the field is cleaned
   * @param {boolean} [options.partial]   Whether to perform partial cleaning?
   * @param {object} [options.source]     The root data model being cleaned
   * @returns {*}               The cast value
   */
  clean(value, options) {

    // Permit explicitly null values for nullable fields
    if ( value === null ) {
      if ( this.nullable ) return value;
      value = undefined;
    }

    // Get an initial value for the field
    if ( value === undefined ) return this.getInitialValue(options.source);

    // Cast a provided value to the correct type
    value = this._cast(value);

    // Cleaning logic specific to the DataField.
    return this._cleanType(value, options);
  }

  /* -------------------------------------------- */

  /**
   * Apply any cleaning logic specific to this DataField type.
   * @param {*} value           The appropriately coerced value.
   * @param {object} [options]  Additional options for how the field is cleaned.
   * @returns {*}               The cleaned value.
   * @protected
   */
  _cleanType(value, options) {
    return value;
  }

  /* -------------------------------------------- */

  /**
   * Cast a non-default value to ensure it is the correct type for the field
   * @param {*} value       The provided non-default value
   * @returns {*}           The standardized value
   * @protected
   */
  _cast(value) {
    throw new Error(`Subclasses of DataField must implement the _cast method`);
  }

  /* -------------------------------------------- */

  /**
   * Attempt to retrieve a valid initial value for the DataField.
   * @param {object} data   The source data object for which an initial value is required
   * @returns {*}           A valid initial value
   * @throws                An error if there is no valid initial value defined
   */
  getInitialValue(data) {
    return this.initial instanceof Function ? this.initial(data) : this.initial;
  }

  /* -------------------------------------------- */
  /*  Field Validation                            */
  /* -------------------------------------------- */

  /**
   * Validate a candidate input for this field, ensuring it meets the field requirements.
   * A validation failure can be provided as a raised Error (with a string message) or by returning false.
   * A validator which returns true denotes that the result is certainly valid and further validations are unnecessary.
   * @param {*} value                        The initial value
   * @param {object} [options={}]            Options which affect validation behavior
   * @returns {ModelValidationError}         Returns a ModelValidationError if a validation failure occurred
   */
  validate(value, options={}) {
    const validators = [this._validateSpecial, this._validateType];
    if ( this.options.validate ) validators.push(this.options.validate);
    try {
      for ( const validator of validators ) {
        const isValid = validator.call(this, value, options);
        if ( isValid === true ) return undefined;
        if ( isValid === false ) return new ModelValidationError(this.validationError);
      }
    } catch(err) {
      if ( err instanceof ModelValidationError ) return err;
      const mve = new ModelValidationError(err.message);
      mve.stack = err.stack;
      return mve;
    }
  }

  /* -------------------------------------------- */

  /**
   * Special validation rules which supersede regular field validation.
   * This validator screens for certain values which are otherwise incompatible with this field like null or undefined.
   * @param {*} value               The candidate value
   * @returns {boolean|void}        A boolean to indicate with certainty whether the value is valid.
   *                                Otherwise, return void.
   * @throws                        May throw a specific error if the value is not valid
   * @protected
   */
  _validateSpecial(value) {

    // Allow null values for explicitly nullable fields
    if ( value === null ) {
      if ( this.nullable ) return true;
      else throw new Error("may not be null");
    }

    // Allow undefined if the field is not required
    if ( value === undefined ) {
      if ( this.required ) throw new Error("may not be undefined");
      else return true;
    }
  }

  /* -------------------------------------------- */

  /**
   * A default type-specific validator that can be overridden by child classes
   * @param {*} value               The candidate value
   * @param {object} [options={}]   Options which affect validation behavior
   * @returns {boolean|void}        A boolean to indicate with certainty whether the value is valid.
   *                                Otherwise, return void.
   * @throws                        May throw a specific error if the value is not valid
   * @protected
   */
  _validateType(value, options={}) {}

  /* -------------------------------------------- */
  /*  Initialization and Serialization            */
  /* -------------------------------------------- */

  /**
   * Initialize the original source data into a mutable copy for the DataModel instance.
   * @param {*} value                   The source value of the field
   * @param {Object} model              The DataModel instance that this field belongs to
   * @param {object} [options]          Initialization options
   * @returns {*}                       An initialized copy of the source data
   */
  initialize(value, model, options={}) {
    return value;
  }

  /**
   * Export the current value of the field into a serializable object.
   * @param {*} value                   The initialized value of the field
   * @returns {*}                       An exported representation of the field
   */
  toObject(value) {
    return value;
  }
}


class StringField extends DataField {
  /**
   * @param {StringFieldOptions} options  Options which configure the behavior of the field
   */
  constructor(options={}) {
    super(options);
    // If choices are provided, the field should not be null or blank by default
    if ( this.choices ) {
      this.nullable = options.nullable ?? false;
      this.blank = options.blank ?? false;
    }
  }

  /** @inheritdoc */
  static get _defaults() {
    return mergeObject(super._defaults, {
      initial: "",
      blank: true,
      trim: true,
      nullable: false,
      choices: undefined
    });
  }

  /** @inheritdoc */
  clean(value, options) {
    if ( (typeof value === "string") && this.trim ) value = value.trim(); // Trim input strings
    if ( value === "" ) {  // Permit empty strings for blank fields
      if ( this.blank ) return value;
      value = undefined;
    }
    return super.clean(value, options);
  }

  /** @override */
  _cast(value) {
    return String(value);
  }

  /** @inheritdoc */
  _validateSpecial(value) {
    if ( value === "" ) {
      if ( this.blank ) return true;
      else throw new Error("may not be a blank string");
    }
    return super._validateSpecial(value);
  }

  /** @override */
  _validateType(value) {
    if ( typeof value !== "string" ) throw new Error("must be a string");
    else if ( this.choices ) {
      if ( this._isValidChoice(value) ) return true;
      else throw new Error(`${value} is not a valid choice`);
    }
  }

  /**
   * Test whether a provided value is a valid choice from the allowed choice set
   * @param {string} value      The provided value
   * @returns {boolean}         Is the choice valid?
   * @protected
   */
  _isValidChoice(value) {
    let choices = this.choices;
    if ( choices instanceof Function ) choices = choices();
    if ( choices instanceof Array ) return choices.includes(value);
    return String(value) in choices;
  }
}

