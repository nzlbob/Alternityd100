/**
 * Alternityd100 TokenRuler customization (Foundry VTT v13).
 *
 * This is visualization only: it does not constrain movement.
 */

export class d100ATokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
  static COLORS = {
    walk: 0x00ff00,
    run: 0xffff00,
    sprint: 0xff8000,
    unreachable: 0xff0000
  };

  /**
   * Decide which movement model to use for the current token.
   * @returns {"character"|"space"|null}
   */
  _getD100AMovementModel() {
    const actor = this.token?.actor;
    if (!actor) return null;

    const actorType = actor.type;

    // Space/vehicle model.
    if (["starship", "vehicle", "ordnance"].includes(actorType)) return "space";

    // Character-ish model.
    if (["character", "npc", "npc2", "drone"].includes(actorType)) return "character";

    return null;
  }

  _getGridDistance() {
    const d = canvas?.scene?.grid?.distance;
    return Number.isFinite(Number(d)) && Number(d) > 0 ? Number(d) : 1;
  }

  _toSpaces(distanceValue) {
    const value = Number(distanceValue);
    if (!Number.isFinite(value)) return null;
    const gridDistance = this._getGridDistance();
    return value / gridDistance;
  }

  _getWaypointSpaces(waypoint) {
    const spaces = waypoint?.measurement?.spaces;
    if (Number.isFinite(Number(spaces))) return Number(spaces);

    const dist = waypoint?.measurement?.distance;
    const converted = this._toSpaces(dist);
    return Number.isFinite(Number(converted)) ? Number(converted) : 0;
  }

  _getCharacterThresholdsSpaces() {
    const actor = this.token?.actor;
    const speed = actor?.system?.attributes?.speed;

    const action = this.token?.document?.movementAction;

    const statuses = actor?.statuses;
    const hasStatus = (id) => {
      try {
        return statuses?.has?.(id) ?? false;
      } catch {
        return false;
      }
    };

    // Parity with legacy Drag Ruler behavior: swim/fly replace the standard bands.
    // Also honor movementAction selection if the user chooses swim/fly.
    if (action === "swim" || hasStatus("swim") || hasStatus("eswim")) {
      const easySwim = Number(speed?.easyswim?.value);
      const swim = Number(speed?.swim?.value);
      const walkSpaces = this._toSpaces(easySwim) ?? 0;
      const runSpaces = this._toSpaces(swim) ?? 0;
      return { walk: walkSpaces, run: runSpaces, sprint: runSpaces };
    }

    if (action === "fly" || hasStatus("flying") || hasStatus("glide")) {
      const glide = Number(speed?.glide?.value);
      const fly = Number(speed?.fly?.value);
      const walkSpaces = this._toSpaces(glide) ?? 0;
      const runSpaces = this._toSpaces(fly) ?? 0;
      return { walk: walkSpaces, run: runSpaces, sprint: runSpaces };
    }

    // Crawl and burrow are fractions of land speeds.
    let multiplier = 1;
    if (action === "crawl") multiplier = 0.25;
    else if (action === "burrow") multiplier = 0.10;

    const walk = Number(speed?.walk?.value);
    const run = Number(speed?.run?.value);
    const sprint = Number(speed?.sprint?.value);

    return {
      walk: (this._toSpaces(walk) ?? 0) * multiplier,
      run: (this._toSpaces(run) ?? 0) * multiplier,
      sprint: (this._toSpaces(sprint) ?? 0) * multiplier
    };
  }

  _getSpaceBandSpaces() {
    const actor = this.token?.actor;
    const attributes = actor?.system?.attributes;

    const current = Number(attributes?.speed?.value);
    const accel = Number(attributes?.accel?.value);

    // Vehicles define an explicit max today; starships are intentionally uncapped for gameplay.
    const maxSpeed = Number(attributes?.speed?.max);
    const hasMax = Number.isFinite(maxSpeed) && maxSpeed > 0;

    const minD = Math.max(0, (Number.isFinite(current) ? current : 0) - (Number.isFinite(accel) ? accel : 0));
    const maxD = Math.max(0, (Number.isFinite(current) ? current : 0) + (Number.isFinite(accel) ? accel : 0));

    const minClamped = hasMax ? Math.min(minD, maxSpeed) : minD;
    const maxClamped = hasMax ? Math.min(maxD, maxSpeed) : maxD;

    return {
      min: this._toSpaces(minClamped) ?? 0,
      max: this._toSpaces(maxClamped) ?? 0
    };
  }

  _getD100AStyleForWaypoint(waypoint) {
    const model = this._getD100AMovementModel();
    if (!model) return null;

    const spaces = this._getWaypointSpaces(waypoint);

    if (model === "character") {
      const { walk, run, sprint } = this._getCharacterThresholdsSpaces();

      if (spaces <= walk) return { color: this.constructor.COLORS.walk, alpha: 0.9 };
      if (spaces <= run) return { color: this.constructor.COLORS.run, alpha: 0.9 };
      if (spaces <= sprint) return { color: this.constructor.COLORS.sprint, alpha: 0.9 };
      return { color: this.constructor.COLORS.unreachable, alpha: 0.25 };
    }

    if (model === "space") {
      const { min, max } = this._getSpaceBandSpaces();

      // Green zone indicates the speed±accel band.
      if (spaces >= min && spaces <= max) return { color: this.constructor.COLORS.walk, alpha: 0.9 };
      return { color: this.constructor.COLORS.unreachable, alpha: 0.2 };
    }

    return null;
  }

  /** @override */
  _getSegmentStyle(waypoint) {
    const base = super._getSegmentStyle(waypoint);
    const style = this._getD100AStyleForWaypoint(waypoint);
    if (!style) return base;

    return {
      width: base?.width ?? 4,
      color: style.color,
      alpha: style.alpha
    };
  }

  /** @override */
  _getGridHighlightStyle(waypoint, offset) {
    const base = super._getGridHighlightStyle(waypoint, offset);
    const style = this._getD100AStyleForWaypoint(waypoint);
    if (!style) return base;

    return {
      ...base,
      color: style.color,
      alpha: style.alpha
    };
  }

  /** @override */
  _getWaypointStyle(waypoint) {
    const base = super._getWaypointStyle(waypoint);
    const style = this._getD100AStyleForWaypoint(waypoint);
    if (!style) return base;

    return {
      radius: base?.radius ?? 6,
      color: style.color,
      alpha: style.alpha
    };
  }
}
