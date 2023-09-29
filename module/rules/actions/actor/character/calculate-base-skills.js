import { skillStepdieData,d100stepdie } from "../../../../modifiers/d100mod.js";
import { d100A } from "../../../../d100Aconfig.js"
export default function (engine) {
    engine.closures.add('calculateBaseSkills', (fact, context) => {
        const data = fact.actor.system;
        const skills = data.skills;
        const perk = fact.perk;
        const classes = fact.classes;
        let curbroadskill = 0;
        let curbroadskillpoints = 0
       // console.log(fact.actor.name);
        let achievements = {}
        // This sets the Race as the Race item sets the base number of 
        let race = null
        if (fact.actor.items.size){
        const temprace = fact.actor.items.contents.filter(item => item.type === "race");
        achievements = fact.actor.items.contents.filter(item => item.type === "achievement");
      //  console.log(fact.actor.name,(temprace == []),(temprace == ""),(temprace == null),temprace)
        
        if (!(temprace == "")) {
            race = temprace[0];
           // console.log(fact.actor.items,temprace, race)
            data.details.species = race.name
            curbroadskillpoints = race.system.broadskillpoints
            


        }

    }
  //  console.log(achievements)
/*
        const classSkills = classes.reduce((prev, cls) => {
            const classData = cls.system;

            Object.entries(classData.csk).filter(s => s[1]).forEach((skill) => {
                prev[skill[0]] = 3;
            });

            return prev;
        }, {});

        let perkMod = {};

        const perkData = perk?.data?.data;
        if (perkData)
        {
            if (perkData.skill !== "" && !Object.keys(classSkills).includes(perkData.skill)) {
                classSkills[perkData.skill] = 3;
                perkMod[perkData.skill] = 0;
            } else if (perkData.skill !== "") {
                perkMod[perkData.skill] = 1;
            }
        }
        let flawMod = {};

        const flawData = flaw?.data?.data;
        if (flawData)
        {
            if (flawData.skill !== "" && !Object.keys(classSkills).includes(flawData.skill)) {
                classSkills[flawData.skill] = 3;
                flawMod[flawData.skill] = 0;
            } else if (flawData.skill !== "") {
                flawMod[flawData.skill] = 1;
            }
        }

                const achievementData = achievement?.data?.data;
        if (achievementData)
        {
            if (achievementData.skill !== "" && !Object.keys(classSkills).includes(achievementData.skill)) {
                classSkills[achievementData.skill] = 3;
                achievementMod[achievementData.skill] = 0;
            } else if (achievementData.skill !== "") {
                achievementMod[achievementData.skill] = 1;
            }
        }

        // Skills
        for (let [skl, skill] of Object.entries(skills)) {
            skill.value = parseFloat(skill.value || 0);
            if (skill.value !== 3) skill.value = classSkills[skl] ?? 0;
            const classSkill = skill.value;
            const hasRanks = skill.ranks > 0;
            const abilityMod = data.abilities[skill.ability].mod;
            const modFromPerk = perkMod[skl] ?? 0;
            const modFromFlaw = flawMod[skl] ?? 0;
            const modFromAchievement = achievementMod[skl] ?? 0;
            skill.mod = abilityMod + skill.ranks + (hasRanks ? classSkill : 0) + skill.misc + modFromPerk + modFromFlaw + modFromAchievement;

            if (hasRanks) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipSkillRanks", {ranks: (skill.ranks - skill.min).signedString()}));
                
                if (classSkill === 3) {
                    skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipTrainedClassSkill", {mod: classSkill.signedString()}));
                }
            }

            if (modFromPerk !== 0) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipPerkMod", {mod: modFromPerk.signedString()}));
            }

            if (modFromFlaw !== 0) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipFlawMod", {mod: modFromFlaw.signedString()}));
            }
                        if (modFromAchievement !== 0) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipAchievementMod", {mod: modFromAchievement.signedString()}));
            }

            skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipAbilityMod", {abilityMod: abilityMod.signedString(), abilityAbbr: skill.ability.capitalize()}));

            if (skill.misc !== 0) {
                skill.tooltip.push(game.i18n.format("SFRPG.SkillTooltipMiscMod", {mod: skill.misc.signedString()}));
            }
        }
*/


    // Loop through skills, and add their ranks to the base stat. Also halve broadskills. look through race and see if it is a free broadskill.


const br_sk_id = [] ;

let freeflag = false

//for (let[key3,stat] of Object.entries(data.abilities)){
  // iterate through each skill
    for (let [key, skill] of Object.entries(data.skills)) { 
        // set ranks to 0 if its a broad skill
        if (skill.id == skill.broadid){skill.ranks = null};

        if(data.type == "npc"){
            const profession = data.details.profession.primary
            const npcQuality = data.details.profession.npcQuality
        
           // d100A.npc.skills[profession]  && 
            //is the skill a broad skill and is 
            if( data.skills.admin.isBroad ){
        
                for (let [qualname,basequal] of Object.entries(d100A.npc.skills[profession])) {
                   if (d100A.npc.skills[profession][qualname][key]){
                   // console.log("dfsgf",qualname,basequal)
                    freeflag = true // raise the flag
                    curbroadskill += 1;  
                   }
                    
                    if (qualname == npcQuality ) break;
                        
                }
        
            }
        
        
        // / npc stuff        
        }



        if (race){
            
                if(race.system.broadSkills[key] ){
                freeflag = true
                curbroadskill += 1;        
                } // raise the flag

        }
        
        for (let [key4,achievement] of Object.entries(achievements)){
           // console.log(achievement,curbroadskillpoints,curbroadskill,key)
            if(achievement.system.broadSkills[key] ){
            freeflag = true
            curbroadskill += 1;    
            curbroadskillpoints  += achievement.system.broadskillpoints  
            //console.log("---------------------\n",achievement,curbroadskillpoints,curbroadskill,key)
            } // raise the flag
        }

    


        br_sk_id[skill.id]=2; // set the broad skill id [skill no] to 2
        if (skill.id == skill.broadid && !freeflag) {  //if this is a broad skill and  not a free broad 
            br_sk_id[skill.id]=2  //  set the broad skill id [skill no] to 2
        } 
                
        else {
            if (skill.ranks>0 || freeflag ){  //if this is a broad skill or a free broad 
                br_sk_id[skill.broadid]=1;  //  set the broad skill id [skill no] to 2
                freeflag=false  // lower the flad
            }
        }

        skill.step = skillStepdieData(skill)
        skill.stepdie = d100stepdie(skill.step);
   
    } 
    //console.log ("br_sk_id ", br_sk_id) 


    for (let [key, skill] of Object.entries(data.skills)) { 
        //console.log("Here", skill, data)
        skill.base = Math.floor((data.abilities[skill.ability]?.value + skill.ranks) / br_sk_id[skill.broadid]) ; 
        skill.good =  Math.floor(skill.base/2) ; 
        skill.amazing =  Math.max(1,Math.floor(skill.base/4)) 
    };
    
   //}

        data.details.usedbroadskillpoints = curbroadskill
        data.details.broadskillpoints = curbroadskillpoints
        return fact;
    });
}
