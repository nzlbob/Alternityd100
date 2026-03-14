/**
 * A simple form to set actor movement speeds
 * @extends {DocumentSheet}
 */
export class ActorMovementConfig extends DocumentSheet {

  /** @override */
	static get defaultOptions() {
	  return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sfrpg"],
      template: "systems/Alternityd100/templates/apps/movement-config.html",
      width: 300,
      height: "auto"
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.format("SFRPG.ActorSheet.Attributes.Speed.MovementSpeedNamedTitle", {name: this.document.name});
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const context = super.getData(options);

    context.flightManeuverabilities = {
      "-1": "SFRPG.ActorSheet.Attributes.Speed.Flight.Clumsy",
      "0": "SFRPG.ActorSheet.Attributes.Speed.Flight.Average",
      "1": "SFRPG.ActorSheet.Attributes.Speed.Flight.Perfect"
    };

    context.mainMovementTypes = {
      land: "SFRPG.ActorSheet.Attributes.Speed.Types.Land",
      burrowing: "SFRPG.ActorSheet.Attributes.Speed.Types.Burrowing",
      climbing: "SFRPG.ActorSheet.Attributes.Speed.Types.Climbing",
      flying: "SFRPG.ActorSheet.Attributes.Speed.Types.Flying",
      swimming: "SFRPG.ActorSheet.Attributes.Speed.Types.Swimming",
      special: "SFRPG.ActorSheet.Attributes.Speed.Types.Special"
    };

    return context;
  }
}
