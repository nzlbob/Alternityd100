export default function (engine) {
    engine.closures.add("calculateStarshipSpeed", (fact, context) => {
        const data = fact.actor.system;

        data.attributes.accel.value = 0;

        data.attributes.maneuverability.tooltip = []
        data.attributes.accel.tooltip = []

        const ACCEL_POINTS = [5, 10, 15, 20, 30, 40, 50];
        const accelValueForPercent = (curve, percent) => {
            const p = Number(percent);
            if (!Number.isFinite(p) || p < 5) return 0;
            const clamped = Math.min(p, 50);
            const values = {
                5: Number(curve.five),
                10: Number(curve.ten),
                15: Number(curve.fifteen),
                20: Number(curve.twenty),
                30: Number(curve.thirty),
                40: Number(curve.forty),
                50: Number(curve.fifty)
            };
            for (const key of Object.keys(values)) {
                if (!Number.isFinite(values[key])) values[key] = 0;
            }
            if (clamped >= 50) return values[50];
            let lower = 5;
            let upper = 10;
            for (let i = 0; i < ACCEL_POINTS.length - 1; i++) {
                const a = ACCEL_POINTS[i];
                const b = ACCEL_POINTS[i + 1];
                if (clamped >= a && clamped < b) {
                    lower = a;
                    upper = b;
                    break;
                }
            }
            const v0 = values[lower];
            const v1 = values[upper];
            const t = (clamped - lower) / (upper - lower);
            return v0 + (v1 - v0) * t;
        };

        const curveSignature = (curve) => {
            const sig = [
                curve?.five,
                curve?.ten,
                curve?.fifteen,
                curve?.twenty,
                curve?.thirty,
                curve?.forty,
                curve?.fifty
            ].map(v => {
                const n = Number(v);
                return Number.isFinite(n) ? n : String(v ?? "");
            });
            return JSON.stringify(sig);
        };


        const engines = fact.items.filter(x => x.type === "starshipEngine");

        const eligiblePowerEngines = [];
        for (const item of engines) {
            const engineData = item.system;
            if (engineData?.isFTL) continue;
            if (!engineData?.isPowered) continue;
            const hullBase = Number(data.attributes?.hullPoints?.base);
            const bhpCost = Number(engineData?.bhpCost);
            if (!Number.isFinite(hullBase) || hullBase <= 0) continue;
            if (!Number.isFinite(bhpCost) || bhpCost <= 0) continue;
            const percent = (bhpCost / hullBase) * 100;
            if (!Number.isFinite(percent) || percent <= 0) continue;
            eligiblePowerEngines.push({ item, engineData, percent });
        }

        const pTotalInstalled = eligiblePowerEngines.reduce((sum, e) => sum + e.percent, 0);
        if (pTotalInstalled > 0) {
            const pTotalUsed = Math.min(pTotalInstalled, 50);
            const groups = new Map();
            for (const e of eligiblePowerEngines) {
                const sig = curveSignature(e.engineData?.accel ?? {});
                const existing = groups.get(sig) ?? { percent: 0, curve: e.engineData?.accel ?? {}, engines: [] };
                existing.percent += e.percent;
                existing.engines.push(e.item?.name ?? "Engine");
                groups.set(sig, existing);
            }

            // Cap total usable engine allocation to 50% by scaling each group's share proportionally.
            const scale = pTotalUsed / pTotalInstalled;

            let accelTotal = 0;
            for (const group of groups.values()) {
                const usedPercent = group.percent * scale;
                const w = usedPercent / pTotalUsed;
                accelTotal += w * accelValueForPercent(group.curve, pTotalUsed);
            }
            data.attributes.accel.value = Math.floor(accelTotal);
            if (pTotalInstalled > pTotalUsed) {
                data.attributes.accel.tooltip.push(`Total engine allocation: ${pTotalInstalled.toFixed(1)}% (usable ${pTotalUsed.toFixed(1)}%)`);
            } else {
                data.attributes.accel.tooltip.push(`Total engine allocation: ${pTotalUsed.toFixed(1)}%`);
            }
            for (const group of groups.values()) {
                const accelAtTotal = accelValueForPercent(group.curve, pTotalUsed);
                data.attributes.accel.tooltip.push(`${group.engines.join(", ")}: ${accelAtTotal.toFixed(2)} @ ${pTotalUsed.toFixed(1)}%`);
            }
        }

        for (const engine of engines) {
            const engineData = engine.system;
            let enginesize = engineData.bhpCost / data.attributes.hullPoints.base * 100;



            if (engineData.isFTL) {
                function powerbased(rate) {

                    data.attributes.ftl.value = engineData.bhpCost * engineData.pcu;
                    data.attributes.ftl.value += " ly"
                    data.attributes.ftl.tooltip.push(`${engine.name}: ${engineData.accel[rate]}`);
                    console.log(rate, data.attributes.ftl.value, engineData.bhpCost, engineData.pcu)
                }
                function defaultftl(rate) {
                    data.attributes.ftl.value = engineData.accel[rate];
                    data.attributes.ftl.tooltip.push(`${engine.name}: ${engineData.accel[rate]}`);
                    console.log(data.attributes.ftl.value)
                }
                data.attributes.ftl.text = "Speed: " + engineData.ftlRange + " / " + engineData.ftlDuration + " Cooldown: " + engineData.ftlCooldown
                data.attributes.ftl.range = engineData.ftlRange
                //data.attributes.ftl.tooltip.push(`${engine.name}: ${engineData.accel.five.toString()}`);
                // data.attributes.speed.value += engineData.speed;
                // data.attributes.speed.tooltip.push(`${engine.name}: ${engineData.speed.toString()}`);
                // data.attributes.pilotingBonus.value += engineData.pilotingModifier;
                // data.attributes.pilotingBonus.tooltip.push(`${engine.name}: ${engineData.pilotingModifier.toString()}`);
            }
			// non-FTL powered engines are handled by the grouped curve calculation above

        }
        data.attributes.speed.walk.base = data.attributes.speed.value;
        data.attributes.speed.walk.value = data.attributes.speed.walk.base + data.attributes.accel.value;

        data.attributes.maneuverability.value = data.attributes.maneuverability.base

        data.attributes.maneuverability.value += data.attributes.maneuverability.temp
        if (data.attributes.maneuverability.piloting > 0) {
            data.attributes.maneuverability.value += data.attributes.maneuverability.piloting
            data.attributes.maneuverability.tooltip.push("Piloting ".concat(data.attributes.maneuverability.piloting))
        }



        let manMod = 0 - Math.floor((data.attributes.speed.value - 1) / 4)

        if (manMod < 0) {
            data.attributes.maneuverability.value += manMod
            data.attributes.maneuverability.tooltip.push("Speed ".concat(manMod))
        }
        return fact;
    });



}