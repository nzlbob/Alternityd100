export function generateUUID() {
    return ([1e7] + -1e3 + -4e3 + - 8e3 + -1e11).replace(/[018]/g, c => (
        c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export function degtorad(degrees) {
    return degrees * Math.PI / 180;
}

export function radtodeg(radians) {
    return radians * 180 / Math.PI;
}

export function raytodeg(ray) {
    //const degrees = Math.atan(ray.angle)* 180 / Math.PI;
    return Math.floor(Math.normalizeDegrees(Math.toDegrees(ray.angle)+90) )
}

/**
 * Measure distance between two points using the active Scene grid configuration.
 *
 * In Foundry VTT v13, use BaseGrid#measurePath. This returns distance in Scene distance units.
 *
 * @param {{x:number,y:number}|object} a   A Point-like object
 * @param {{x:number,y:number}|object} b   A Point-like object
 * @param {{euclidean?: boolean}} [options]
 * @returns {number} Distance in Scene distance units
 */
export function measureDistance(a, b, { euclidean = false } = {}) {
    const grid = canvas?.grid;
    if (!grid) return 0;

    // Foundry v13
    if (typeof grid.measurePath === "function") {
        const result = grid.measurePath([a, b]);
        const distance = euclidean ? result.euclidean : result.distance;
        return Number.isFinite(distance) ? distance : 0;
    }

    // Fallback for older APIs
    if (typeof grid.measureDistance === "function") {
        const distance = grid.measureDistance(a, b);
        return Number.isFinite(distance) ? distance : 0;
    }

    return 0;
}

export function roundToRoundB(round){
    const naction = Math.trunc(round / 10000)
    const nphase = Math.trunc((round - (naction * 10000)) / 1000)
    const nround = round - naction * 10000 - nphase * 1000
    //const phase = this.round
    return nround
      

}

/**
 * Determine if a ray of terms contains a DiceTerm.
 * 
 * @param {angle} angle The terms to check
 * @param {item} item The item to check
 * @param {token} token The token to use
 */

export function inArc(angle,item, token){
    const normalizeDegrees = (deg) => {
        const d = Number.isFinite(deg) ? deg : 0;
        if (typeof Math.normalizeDegrees === "function") return Math.normalizeDegrees(d);
        if (foundry?.utils?.normalizeDegrees) return foundry.utils.normalizeDegrees(d);
        return ((d % 360) + 360) % 360;
    };

    const heading = Number(token?.document?.d100ARotation ?? token?.d100ARotation ?? token?.rotation ?? 0);
    // Existing arc thresholds assume: 180° = front, 0° = aft.
    // `angle` is a compass bearing (0° = north), so apply a 180° offset.
    const arcAngle = normalizeDegrees(angle - heading + 180);
    if (item.system.mount.arc.front) {
       // console.log(arcAngle)
          if ((arcAngle>120) && (arcAngle<240))return true

    }
    if (item.system.mount.arc.aft) {
       // console.log(arcAngle)
              if ((arcAngle>300) || (arcAngle<60))return true
    }
    if (item.system.mount.arc.port) {
       // console.log(arcAngle)
        if ((arcAngle>59) && (arcAngle<121))return true
    }
    if (item.system.mount.arc.stbd) {
       // console.log(arcAngle)
         if ((arcAngle>239) && (arcAngle<301))return true
      
    }



    
    return false

}



/**
 * Determine if an array of terms contains a DiceTerm.
 * 
 * @param {RollTerm[]} terms The terms to check
 */
export function hasDiceTerms(terms) {
    for (const term of terms) {
        if (term instanceof DiceTerm) return true;
    }

    return false;
}

/**
 * Determine if an array of terms contains a DiceTerm.
 * 
 * @param {targetedToken} terms The terms to check
 * @param {item} item The item to check
 */
export function getRangeCat(targetedToken,item) {
    console.log("Range",targetedToken.distance,item.system.range.long)
    if (targetedToken.distance == 0) return "short"
    if (targetedToken.distance <= item.system.range.short) return "short" 
    if (targetedToken.distance <= item.system.range.medium) return "medium"
    if (targetedToken.distance <= item.system.range.long) return "long"
    
    ui.notifications.warn("*************OUTSIDE RANGE*********")
    return "long"
    
    
       

    return null;
}

export function rollNPC(skill,ship,options,actionId) {

   console.log ( skill,ship,options,actionId)

 //   actorData.actors[0] ? actorData.actors[0].rollSkill(skill, options) : ui.notifications.error(`No Crew in Station`);
    const action = compendium.getDocument(actionId)
    const actorData = ship.system
     // this.actor.useSpell(item, {configureDialog: !event.shiftKey});
     console.log (action)
    const psionic =  item.type == "psionic"
     options.skillflavour = "Hello"
     options.stepflavour = "+0"
    let parts = []
    let dice=null
    
    let rollData = {}
    let skillId = item.name
    
    
    
    let title = psionic? item.name + item.psionScore :  item.name + ": " + item.system.skill //was skl.name
    let ordinary = psionic? item.ordinary : actorData.skills[item.system.skill].base
    let good = psionic? item.good : actorData.skills[item.system.skill].good
    let amazing = psionic? item.amazing : actorData.skills[item.system.skill].amazing 
    let stepbonus = psionic? 0 : actorData.skills[item.system.skill].step 
    options.nosound = false
    let hasDegreeText = true
    let degreeText = item.system.degreeText
    const props = {header:"something",value:"2.jghf",extra:"fsfdg"};
    let flavor = item.isSkilled?  actorData.skills[item.system.skill].label + " using" : ""
    
    flavor += (" " + item.name + ". ")
    
     let A =  Diced100.skillRoll({
      event: options.event,
      fastForward: !(options.skipDialog === true),
      staticRoll: options.staticRoll,
      parts,
      stepbonus,
      stepflavor:options.stepflavor,
      skillflavor: options.skillflavor,
      ordinary: ordinary,
      good: good,
      amazing: amazing,
      dice: options.dice,
      data: rollData,
      subject: { skill: skillId },
      title: title,
      flavor : flavor,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      chatTemplate: "systems/Alternityd100/templates/chat/roll-ext.hbs",
      chatTemplateData: { hasProperties: props.length > 0, properties: props },
      chatMessage: "Hello" + options.chatMessage,
      noSound: options.noSound,
      compendiumEntry: null,
      hasDegreeText,
      degreeText
    });
    
    console.log("\nDiced100.skillRoll({\n", A)
    let rollresult = {}
    return A
    
    



}
