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
 * Determine if a ray of terms contains a DiceTerm.
 * 
 * @param {angle} angle The terms to check
 * @param {item} item The item to check
 * @param {token} token The token to use
 */

export function inArc(angle,item, token){
    console.log(Math.normalizeDegrees(365),angle,item,token)
    const arcAngle = Math.normalizeDegrees(angle-token.rotation)
     console.log(arcAngle,token.rotation)
    if (item.system.mount.arc.front) {
       // console.log(arcAngle)
        if ((arcAngle>300) || (arcAngle<60))return true
    }
    if (item.system.mount.arc.aft) {
       // console.log(arcAngle)
        if ((arcAngle>120) && (arcAngle<240))return true
    }
    if (item.system.mount.arc.port) {
       // console.log(arcAngle)
        if ((arcAngle>239) && (arcAngle<301))return true
    }
    if (item.system.mount.arc.stbd) {
       // console.log(arcAngle)
        if ((arcAngle>59) && (arcAngle<121))return true
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
