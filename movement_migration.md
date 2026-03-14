# Movement + Ruler Migration Plan (Foundry VTT v13)

This document describes how Alternityd100 supports **two movement + ruler visualization models** using **Foundry VTT v13 core APIs** (no Drag Ruler dependency):

1) **Characters/NPCs**: walk / run / sprint
2) **Starships/Vehicles**: acceleration + current speed (+ optional max speed)

Constraint: **visualization only**. The ruler colors/highlights segments but does not prevent a token from being moved.

---

## What Foundry v13 Provides (relevant)

- Each Token has a v13 `TokenRuler` which renders the planned path while dragging.
- `TokenRuler` provides protected methods to customize visuals:
  - `_getSegmentStyle(waypoint)`
  - `_getGridHighlightStyle(waypoint, offset)`
  - `_getWaypointStyle(waypoint)`
- Waypoints include cumulative measurement data (e.g. `waypoint.measurement.spaces` / `distance`).

---

## What Alternityd100 Implements (v13)

### Core-only ruler visualization (implemented)

Alternityd100 defines a custom ruler class:

- [module/d100TokenRuler.js](module/d100TokenRuler.js)

It is enabled during system init by setting:

- `CONFIG.Token.rulerClass = d100ATokenRuler` in [module/d100alternity.js](module/d100alternity.js)

This approach is compatible with Foundry v13 and does not depend on Drag Ruler.

### Standard movement actions retained
We keep Foundry's standard movement actions (walk, fly, swim, crawl, burrow, climb, jump, teleport) and apply Alternity-specific definitions:
- `crawl`: 25% of land speeds
- `burrow`: 10% of land speeds

Actor-type availability:
- Vehicles: only Drive (walk), Fly, Swim
- Starships/Ordnance: no movement action selection (HUD palette hidden)

### Movement model selection

The ruler chooses a visualization model by actor type:

- **Character-ish**: `character`, `npc`, `npc2`, `drone`
- **Space/vehicle-ish**: `starship`, `vehicle`, `ordnance`

---

## Model 1: Characters/NPCs (Walk / Run / Sprint)

Data source:
- `actor.system.attributes.speed.walk.value`
- `actor.system.attributes.speed.run.value`
- `actor.system.attributes.speed.sprint.value`

Visualization:
- The planned ruler path is color-banded by cumulative distance.

Action-based scaling:
- If movement action is `crawl`, walk/run/sprint thresholds are scaled to 25%.
- If movement action is `burrow`, thresholds are scaled to 10%.

Parity behavior retained:
- If the actor has `swim`/`eswim` statuses, the ruler uses `easyswim` and `swim` bands.
- If the actor has `flying`/`glide` statuses, the ruler uses `glide` and `fly` bands.

---

## Model 2: Starships/Vehicles (Acceleration / Current / Max)

Data source:
- `actor.system.attributes.speed.value` (current)
- `actor.system.attributes.accel.value` (acceleration)
- `actor.system.attributes.speed.max` (vehicles; if present)

Visualization rule (green zone):

$$\text{min} = \max(0, \text{currentSpeed} - \text{accel})$$
$$\text{max} = \max(0, \text{currentSpeed} + \text{accel})$$

- If `speed.max` exists (vehicles), the band is clamped to that max.
- Starships are intentionally treated as uncapped for gameplay.

Notes:
- Acceleration applies **before** movement (visualized as a pre-move band).
- Space scenes are expected to be **horizontal hex**; we rely on core measurement.
- This is visualization only; no enforcement.

---

## Remaining Work (separate from visualization)

- Decide and implement when/how starship/vehicle `current speed` is updated after movement.
- (Optional) map walk/run/sprint and thrust/brake into `CONFIG.Token.movement.actions` if action-specific cost/terrain interaction becomes important.

- Climb/jump: optionally integrate skill-check results to visualize caps (still visualization-only).

## Combat movement (implemented)
Only when the token is **in combat** and movement action is `walk` (land), after a move completes:
- Distance > walk speed: apply `run` status
- Distance > run speed: apply `sprint` status
- Otherwise: remove `run` and `sprint`
