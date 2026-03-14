/**
 * Space physics helpers for starships, vehicles, and ordnance.
 *
 * Keep this module pure and side-effect free (no Actor/Token updates).
 */

/**
 * Compute the new speed and movement budget for the current turn using the
 * Alternityd100 kinematic model.
 *
 * Rule (current implementation):
 * - Max movement (in grid spaces) = floor(currentSpeed + accel)
 * - After movement, persist actor speed as (currentSpeed + accel)
 *
 * @param {number} currentSpeed
 * @param {number} accel
 * @returns {{ newSpeed: number, maxMove: number }}
 */
export function computeKinematicMoveBudget(currentSpeed, accel) {
  const speed = Number.isFinite(Number(currentSpeed)) ? Number(currentSpeed) : 0;
  const a = Number.isFinite(Number(accel)) ? Number(accel) : 0;
  const newSpeed = speed + a;
  const maxMove = Math.max(0, Math.floor(newSpeed));
  return { newSpeed, maxMove };
}

/**
 * Convert an Alternity compass heading to a 2D unit vector.
 * Heading convention: 0° = North, 90° = East.
 *
 * @param {number} headingDegrees
 * @returns {{x:number,y:number}}
 */
export function headingToUnitVector(headingDegrees) {
  const h = Number.isFinite(Number(headingDegrees)) ? Number(headingDegrees) : 0;
  const rad = (h * Math.PI) / 180;
  return { x: Math.sin(rad), y: -Math.cos(rad) };
}

/**
 * Integrate a simple Newtonian 2D step.
 *
 * This is intentionally minimal scaffolding. A full implementation will likely
 * need unit handling (scene units vs grid spaces), turn duration, and optional
 * clamping based on game rules.
 *
 * @param {{x:number,y:number}} position   Current position
 * @param {{x:number,y:number}} velocity   Current velocity (units per dt)
 * @param {{x:number,y:number}} acceleration Acceleration (units per dt^2)
 * @param {number} dt                      Time step
 * @returns {{ position:{x:number,y:number}, velocity:{x:number,y:number} }}
 */
export function integrateNewtonian2D(position, velocity, acceleration, dt = 1) {
  const px = Number(position?.x) || 0;
  const py = Number(position?.y) || 0;
  const vx = Number(velocity?.x) || 0;
  const vy = Number(velocity?.y) || 0;
  const ax = Number(acceleration?.x) || 0;
  const ay = Number(acceleration?.y) || 0;
  const t = Number.isFinite(Number(dt)) ? Number(dt) : 1;

  const nvx = vx + ax * t;
  const nvy = vy + ay * t;
  const npx = px + nvx * t;
  const npy = py + nvy * t;

  return {
    position: { x: npx, y: npy },
    velocity: { x: nvx, y: nvy }
  };
}
