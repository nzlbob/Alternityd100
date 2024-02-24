import { ChatMessagePF } from "./sidebar/chat-message.js";
import { d100stepdie } from "./modifiers/d100mod.js";
import { AbilityTemplate } from "./pixi/ability-template.js";
import { findTokenById } from "./item/item.js";
import { d100A } from "./d100Aconfig.js"
import { attackModData } from "./modifiers/d100mod.js";
import { getRangeCat } from "./utilities.js"
import { d100NPCCrewStats } from "../module/modifiers/d100mod.js";
export const formulaHasDice = function (formula) {
  return formula.match(/[0-9)][dD]/) || formula.match(/[dD][0-9(]/);
};

export class Diced100 {
  /**
   * A standardized helper function for managing game system rolls.
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
   *
   * @param {Event} event           The triggering event which initiated the roll
   * @param {Array} parts           The dice roll component parts, excluding the initial d20
   * @param {string} dice           The initial d20
   * @param {Actor} actor           The Actor making the d20 roll
   * @param {object} data           Actor or item data against which to parse the roll
   * @param {string} template       The HTML template used to render the roll dialog
   * @param {string} title          The dice roll UI window title
   * @param {object} speaker        The ChatMessage speaker to pass when creating the chat
   * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
   * @param {boolean} takeTwenty    Allow rolling with take twenty (and therefore also with take ten)
   * @param {boolean} situational   Allow for an arbitrary situational bonus field
   * @param {boolean} fastForward   Allow fast-forward advantage selection
   * @param {number} critical       The value of d20 result which represents a critical success
   * @param {number} fumble         The value of d20 result which represents a critical failure
   * @param {Function} onClose      Callback for actions to take when the dialog form is closed
   * @param {Object} dialogOptions  Modal dialog options
   * @param {Array} extraRolls      An array containing bonuses/penalties for extra rolls
   * @param {boolean} autoRender    Whether to automatically render the chat messages
   * @param {number} stepbonus  
   * @param {Object} targetData
  */
  static async attackRoll({
    rolltype,
    rollSkill,
    event,
    parts,
    dice = "1d20",
    data,
    subject,
    template,
    title,
    speaker,
    flavor,
    stepflavor,
    targetflavor,
    takeTwenty = true,
    situational = true,
    fastForward = true,
    critical = 1,
    fumble,
    onClose,
    dialogOptions = {},
    extraRolls = [],
    chatTemplate,
    chatTemplateData,
    staticRoll = null,
    chatMessage = true,
    noSound = false,
    compendiumEntry = null,
    stepbonus,
    ordinary,
    good,
    amazing,
    targets,
    actor,
    item,
    targetData,
    numberOfAttacks,
    isStarshipweapon,
    activegunner,
    skl,
    useMeasureTemplate,
    actorToken

  }) {
    /*
       console.log( 
    "  \n rolltype: \t ",    rolltype,    
    "  \n rollskill: \t ",    rollSkill, 
    "  \n event: \t ",    event,
    "  \n parts: \n ",    parts,
    "  \n stepbonus: \n", stepbonus,
    "  \n dice: \n ",    dice ,
    "  \n data: \n ",    data,
    "  \n subject: \n ",    subject,
    "  \n template: \n ",    template,
    "  \n title: \n ",    title,
    "  \n speaker: \n ",    speaker,
    "  \n flavor: \n ",    flavor,
    "  \n takeTwenty: \n ",    takeTwenty ,
    "  \n situational: \n ",    situational ,
    "  \n fastForward: \n ",    fastForward ,
    "  \n critical: \n ",    critical ,
    "  \n fumble: \n ",    fumble ,
    "  \n onClose: \n ",    onClose,
    "  \n dialogOptions: \n ",    dialogOptions ,
    "  \n extraRolls:  \n ",    extraRolls ,
    "  \n chatTemplate: \n ",    chatTemplate,
    "  \n chatTemplateData: \n ",    chatTemplateData,
    "  \n staticRoll:  \n ",    staticRoll ,
    "  \n chatMessage:  \n ",    chatMessage,
    "  \n noSound: \n ",    noSound ,
    "  \n compendiumEntry: \n ",    compendiumEntry ,
    "  \n stepbonus: \n ", stepbonus,
    "  \n ordinary: \n ", ordinary,
    "  \n good: \n ", good,
    "  \n amazing: \n ", amazing,
    "  \n targets: \n ", targets,
    "  \n actor: \n ", actor, 
    "  \n item: \n ", item, 
    "  \n targetData: \n ", targetData,
    "  \n numberOfAttacks: \n ", numberOfAttacks,
    "  \n isStarshipweapon: \n ", isStarshipweapon,
    "  \n activegunner: \n ", activegunner
    
    )
    */
    // Handle input arguments
    fumble = fumble || 20;
    flavor = flavor || title;
    let rollMode = game.settings.get("core", "rollMode");

    let rolled = false;
    let degree = 0;
    let AoEdistance = 0

    // Inner roll function
    const _roll = async (parts, setRoll, form) => {


      const originalFlavor = flavor;

      let operator = form ? form.find('[name="operator"]').val() : 0;
      let sitBonus = form ? form.find('[name="dstep"]').val() : 0;
      // Attacker based Modifiers
      let dialogMovement = form ? form.find('[name="movement"]').val() : 0;
      let dialogRange = []
      let dialogResistance = []
      let dialogCover = []
      let dialogDodge = []

      // Target based Modifiers
      for (let a = 0; a < 5; a++) {
        let thisrange = form ? form.find('[name="range' + a + '"]').val() : 0;
        thisrange ? dialogRange.push(thisrange) : a = 5
        let thisres = form ? form.find('[name="resistance' + a + '"]').val() : 0;
        thisres ? dialogResistance.push(thisres) : a = 5
        let thiscover = form ? form.find('[name="cover' + a + '"]').val() : 0;
        thiscover ? dialogCover.push(thiscover) : a = 5
        let thisdodge = form ? form.find('[name="dodge' + a + '"]').val() : 0;
        thisdodge ? dialogDodge.push(thisdodge) : a = 5

        console.log("dialogRange", dialogRange)
        console.log("dialogResistance", dialogResistance)
        console.log("dialogCover", dialogCover)
        console.log("dialogDodge", dialogDodge)
      }
      // let dialogResistance =  form ? form.find('[name="resistance"]').val() :0;
      // let dialogCover =  form ? form.find('[name="cover"]').val() :0;
      // let dialogDodge =  form ? form.find('[name="dodge"]').val() :0;

      rollMode = form ? form.find('[name="rollMode"]').val() : rollMode;


      //console.log ("*******operator******",/*operator,parts, setRoll, form,dialogRange,*/dialogResistance/*,this*/)
      //  dSteps = form ? form.find('[name="dstep"]').val() : dSteps;
      if (isStarshipweapon) {
        activegunner = validgunner[operator]


        //console.log(activegunner.name)

        flavor = "Gunner-" + activegunner.name;
        stepbonus = activegunner.system.skills.weapo.step

        ordinary = activegunner.system.skills.weapo.base
        good = activegunner.system.skills.weapo.good
        amazing = activegunner.system.skills.weapo.amazing
        //console.log("\nordinary",ordinary, "\ngood", good,"\namazing",amazing,"\nactivegunner",activegunner)


      }

      /**
       * 
       * Create a template
       * 
       * 
       *  */

      if (item ? item.isAoE : false) {
        // Determine size
        let dist = getProperty(item, "system.blastArea.long");
        //dist = 10
        //  if (typeof dist === "string") {
        //    dist = RollPF.safeRoll(getProperty(this.data, "data.measureTemplate.size"), rollData).total;
        //  }
        //console.log(dist)
        // dist = convertDistance(dist)[0];
        //console.log(dist)
        // Create data object
        const templateOptions = {
          //type: getProperty(this.data, "data.measureTemplate.type"),
          type: "circle",
          distance: dist
          //texture: PIXI.Texture.from('systems/Alternityd100/icons/conditions/asleep.png')
        };



        //  if (getProperty(this.data, "data.measureTemplate.overrideColor")) {
        //    templateOptions.color = getProperty(this.data, "data.measureTemplate.customColor");
        //  }
        //  if (getProperty(this.data, "data.measureTemplate.overrideTexture")) {
        //    templateOptions.texture = getProperty(this.data, "data.measureTemplate.customTexture");
        //  }

        /**
        * The measure template types available e.g. for spells
        */
        const measureTemplateTypes = {
          cone: "PF1.MeasureTemplateCone",
          circle: "PF1.MeasureTemplateCircle",
          ray: "PF1.MeasureTemplateRay",
          rect: "PF1.MeasureTemplateRectangle",
        };



        // Create template
        let AoETemplate = AbilityTemplate.fromData(templateOptions);
        //console.log(this,templateOptions )

        if (AoETemplate) {
          const sheetRendered = this.parent?.sheet?._element != null;
          if (sheetRendered) this.parent.sheet.minimize();
          AoETemplate = await AoETemplate.drawPreview(event);
          //console.log(event )
          if (!AoETemplate) {
            if (sheetRendered) this.parent.sheet.maximize();
            return;
          }
        }

        //console.log(AoETemplate)
        AoEdistance = Math.ceil((canvas.grid.measureDistance({ x: actorToken.x, y: actorToken.y }, { x: AoETemplate[0].x, y: AoETemplate[0].y })));
        await AoETemplate[0].update({ "x": 5250, "y": 8820 })

        targetData[0].distance = AoEdistance
        targetData[0].rangecat = getRangeCat(targetData[0], item)

        for (let token of game.scenes.current.tokens) {
          //console.log("x",AoETemplate[0].x, AoETemplate[0].y)
          //console.log("x", token.x, token.y)
          //console.log(AoETemplate[0])


          //console.log("x",Math.ceil(canvas.grid.measureDistance({x: AoETemplate[0].x, y: AoETemplate[0].y}, {x: token.x, y: token.y})))
          if (Math.ceil(canvas.grid.measureDistance({ x: AoETemplate[0].x, y: AoETemplate[0].y }, { x: token.x, y: token.y })) < 6) {
            targetData.push(token)
          }

        }

        //console.log(AoETemplate)
        /*
        //if (targetData[0]) targetData = [];
        let target = null;
        let targetName = "";     
        let targettedActor =[];
        let targettedToken= [];
        let targettedTokenData = [];
        let numberOfActiveTargets = targetData.length;
        
        console.log(targetData,numberOfActiveTargets)
        console.log(AoETemplate)
        */
        /*
        ///   This is in the Item is it needed??
        
        for (let x = 0; x < numberOfActiveTargets; x++) { 
            let targetResModData = new Object();
            let ResModData = new Object();   //console.log("Target",x+1," ", game.user.targets.ids[x]);
            target = findTokenById(game.user.targets.ids[x])
        console.log("Target",x+1," ", game.user.targets.ids[x]);
            const targetName = target.name
            targettedToken[x] = target
            targettedTokenData[x] = target.document
            targettedActor[x] = game.actors.get(target.document.actorId);
            
        //console.log("Target",x+1," ", targetName,target,actorToken);
        
            targetResModData.Name = targetName;
            targetResModData.distance = Math.ceil((canvas.grid.measureDistance({x: actorToken.x, y: actorToken.y}, {x: target.x, y: target.y})));
             
            ResModData.dex = target.actor.system.abilities.dex.mod;
            ResModData.str = target.actor.system.abilities.str.mod;
            targetResModData.resMod = ResModData;
        
            targetData[x]=targetResModData;
            targetData[x].token = targettedTokenData[x]  //console.log("targetResModData",targetData[x]);
            targetData[x].dmgtype = {ord:"" ,goo:"", ama:"" };
            
            targetData[x]._id = targettedToken[x].id
        } 
        */
        let AoeTargets = []
      }


      /****************************************
       * Update data from the Attack dialog box
       ******************************************/
      //console.log(AoETemplate[0])


      //targetData[0].distance = AoEdistance

      for (const [key, currentTarget] of targetData.entries()) {
        console.log(key)
        currentTarget.rangecat = dialogRange[key]
        currentTarget.dodgemod = dialogDodge[key]
        currentTarget.covermod = dialogCover[key]
        currentTarget.movementmod = dialogMovement




        //console.log("targetData",targetData)
        currentTarget.resPenalty = dialogResistance[key] || 0
        currentTarget.rangemod = attackModData(item.system.weaponType, rollSkill, currentTarget.rangecat);

        //console.log("Target Data",attackModData(item.system.weaponType,rollSkill,targetData[0].rangecat),targetData,dialogRange)



        currentTarget.attackbonus = 0
        currentTarget.attackbonus =
          parseInt(stepbonus)

          + parseInt(currentTarget.accur)
          + parseInt(currentTarget.AWAModeMod)
          + parseInt(dialogMovement)  //currentTarget.movementmod  THIS can be included when the target remombers its movement
          + parseInt(currentTarget.rangemod)
          + parseInt(currentTarget.resPenalty)
          + parseInt(currentTarget.covermod)
          + parseInt(currentTarget.dodgemod)

        currentTarget.flavor = "\nSkill: " + skl.label
        currentTarget.flavor += "\nSkill Step: " + stepbonus
        currentTarget.flavor += "\nSituation: " + sitBonus
        currentTarget.flavor += "\nAccuracy: " + currentTarget.accur
        currentTarget.flavor += "\nFire Mode: " + currentTarget.AWAModeMod
        currentTarget.flavor += "\nMovement: " + dialogMovement //currentTarget.movementmod
        currentTarget.flavor += "\nRange Mod: " + currentTarget.rangemod
        currentTarget.flavor += "\nRes Mod: " + currentTarget.resPenalty
        currentTarget.flavor += "\nCover Mod: " + currentTarget.covermod
        currentTarget.flavor += "\nDodging Mod: " + currentTarget.dodgemod

        //currentTarget.attackbonus = stepbonus + currentTarget.resPenalty + currentTarget.rangemod + currentTarget.accur
        console.log(
        "\n attackbonus",currentTarget.attackbonus, 
        "\n skillStep", stepbonus,  
        "\n accur", currentTarget.accur ,
        "\n AWAModeMod", currentTarget.AWAModeMod ,
        "\n rangemod", currentTarget.rangemod, 
        "\n resPenalty", currentTarget.resPenalty, 
        "\n covermod", currentTarget.covermod, 
        "\n Dodge", currentTarget.dodgemod, 
        "\n Skill Sit?", //currentTarget.sitmod, 
        "\n Movement", //currentTarget.movementmod, 
        "\n Load", //currentTarget.loadmod, 
        )
        
        //console.log("AWAModeMod", currentTarget);
      }


      for (let a = 0; a < 1 + extraRolls.length; a++) {
        if (isStarshipweapon) {

          skl.label = "System Operation - Weapons"
          targetData[a].flavor = "\nSkill: " + "System Operation - Weapons"
          targetData[a].flavor += "\nSkill Step: " + stepbonus
          targetData[a].flavor += "\nAccuracy: " + targetData[a].accur

          /**
           * 
           *    NEED TO ADD AWA MODE
           * 
           */

          targetData[a].flavor += "\nFire Mode: " + targetData[a].AWAModeMod
          targetData[a].flavor += "\nRange Mod: " + targetData[a].rangemod
          targetData[a].flavor += "\nRes Mode: " + targetData[a].resPenalty
          targetData[a].flavor += "\nCover Mod: " + targetData[a].covermod
          targetData[a].flavor += "\nDodging Mod: " + targetData[a].dodgemod
          //console.log("AWAModeMod", targetData[a]);
        }

        //flavor = originalFlavor;
        const curParts = duplicate(parts);
        let totalbonus = 0;
        // Don't include situational bonus unless it is defined
        //sitBonus = stepbonus;

        //sitBonus =0;

        if (!sitBonus && curParts.indexOf("@bonus") !== -1) curParts.pop();
        //console.log("Data Bonus", sitBonus, " stepbonus", stepbonus)
        // Extra roll specifics
        if (a >= 1) {
          const extraRoll = extraRolls[a - 1];

          curParts.push(extraRoll.bonus);
          flavor += ` <div class="extra-roll-label">${extraRoll.label}</div>`;
        }
        //console.log("flavor",flavor)
        // Do set roll
        //0    if (setRoll != null && setRoll >= 0) {
        //      curParts[0] = `${setRoll}`;
        //     flavor += ` (Take ${setRoll})`;
        //   }
        totalbonus = targetData[0].attackbonus + parseInt(sitBonus);
        //console.log( stepbonus,totalbonus, sitBonus, dice)
        let stepflavor = `Difficulty: ${sitBonus} `;


        // Execute the roll
        // const roll = await Roll.create(curParts.join(" "), d100stepdie(stepbonus)).evaluate({ async: true });
        //   const roll = await Roll.create(dice.concat(d100stepdie(totalbonus))).evaluate({ async: true });
        // determin degree of sucess or failure

        /*   if (roll.total > ordinary) {degree = "Failure"};
           if (roll.total <= ordinary) {degree = "Ordinary"};
           if (roll.total <= good) {degree = "Good"};
           if (roll.total <= amazing) {degree = "Amazing!"};
           if (roll.terms[0].results[0].result > fumble) {degree = "Critical Failure"};
           if (roll.terms[0].results[0].result == 1) {degree = "Critical Success"};
         */
        //const attroll = Array(5);


        // var bonusroll = Array(5);

        //Fill the targetData with applicable Data

        for (let a = 0; a < numberOfAttacks; a++) {

          // ---------DAMAGE ROLL------------



          if (item.hasDamage) targetData[a].dmgresult = await Diced100.d100AdamageRoll({
            data: item.system,
            actor: actor
          });


          /*** For the first roll, roll the d20 as well as the bonus dice */
          if (a == 0) {
            targetData[0].attroll = await Roll.create(dice.concat(d100stepdie(targetData[0].attackbonus + parseInt(sitBonus)))).evaluate({ async: true });
          }

          /*** For the second rolls, roll the d20 as well as the bonus dice */
          else {
            targetData[a].attroll = await Roll.create(targetData[0].attroll.terms[0].results[0].result + d100stepdie(targetData[a].attackbonus + parseInt(sitBonus))).evaluate({ async: true });

          }
          //console.log(targetData[a],targetData[a].attackbonus,targetData[a].attroll)
          /**Check what kind of success was rolled */
          if (targetData[a].attroll.total > ordinary) { targetData[a].degree = "Failure" };
          if (targetData[a].attroll.total <= ordinary) { targetData[a].degree = "Ordinary" };
          if (targetData[a].attroll.total <= good) { targetData[a].degree = "Good" };
          if (targetData[a].attroll.total <= amazing) { targetData[a].degree = "Amazing!" };
          if (targetData[a].attroll.terms[0].total > fumble) { targetData[a].degree = "Critical Failure" };
          //if (targetData[a].attroll.terms[0].total == 1) {targetData[a].degree = "Critical Success"};


          if (isStarshipweapon) {
            //console.log("----------------",)
            targetData[a].firepower = d100A.starshipFirepowerExtra.abbr[actor.system.details.toughness.firepower];
            targetData[a].firepowerN = d100A.starshipFirepowerExtra.val[actor.system.details.toughness.firepower];
            //console.log("----------------",targetData[a].firepower,targetData[a].firepowerN)

          }
          if (!isStarshipweapon) {
            targetData[a].firepower = item.system.firepower;
          }

          targetData[a].type = item.system.damage.type;
          targetData[a].flavor += "\nDice: " + targetData[a].attroll.formula
          targetData[a].flavor += "\nRoll: " + targetData[a].attroll.result
          targetData[a].dmgtype = {
            ord: item.system.damage.ord.type,
            goo: item.system.damage.goo.type,
            ama: item.system.damage.ama.type
          };

          targetData[a].tooltip = await targetData[a].attroll.getTooltip()
          targetData[a].roll = targetData[0].attroll.toJSON();
          //console.log("\nordinary",ordinary, "\ngood", good,"\namazing",amazing)
          //console.log("\nRoll",targetData[a].attroll, targetData,"\nattack", d100stepdie(targetData[0].attackbonus))

        }




        //console.log("\nAttack Roll\n" ,attroll, "\n")

        //Make the Attack  flavor Text



        // Convert the roll to a chat message
        // ---------THESE ARE THE VARIABLES READ BY THE CHAT DATA

        if (chatTemplate) {
          // Create roll template data
          const d20 = targetData[0].attroll.terms[0];
          const rollData = mergeObject(
            {
              rollSkill: rollSkill,
              user: game.user.id,
              formula: roll.formula,
              tooltip: await targetData[0].attroll.getTooltip(),
              total: roll.total,
              isCrit: targetData[0].attroll.terms[0].total <= critical,
              isFumble: targetData[0].attroll.terms[0].total >= fumble,
              isNat20: targetData[0].attroll.terms[0].total === 20,
              flavor: flavor,
              targetflavor: targetflavor,
              stepflavor: stepflavor,
              degree: degree,
              compendiumEntry: compendiumEntry,
              //targets: targets,
              actor: actor,
              item: item,
              targetData: targetData,
              useMeasureTemplate: useMeasureTemplate,
              stepbonus: stepbonus,
              atttokenid: actorToken.id

            },
            chatTemplateData || {}
          );

          // Create chat data

          const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            sound: noSound ? null : a === 0 ? CONFIG.sounds.dice : null,
            speaker: speaker,
            content: await renderTemplate(chatTemplate, rollData),
            rollMode: rollMode,
            roll: targetData[0].attroll.toJSON(),
            degree: degree,//subject.ordinary ,
            "flags.pf1.noRollRender": true,

          };
          if (subject) setProperty(chatData, "flags.pf1.subject", subject);

          // Send message
          rolled = true;
          //console.log("Message", CONST.CHAT_MESSAGE_TYPES.ROLL,"subject.ordinary ", subject.ordinary)
          if (chatMessage) return await ChatMessagePF.create(chatData);
        } else {
          rolled = true;
          if (chatMessage) {
            const msgData = {
              speaker: speaker,
              flavor: flavor,
              targetflavor: targetflavor,
              rollMode: rollMode,
              sound: a === 0 ? CONFIG.sounds.dice : null,
            };
            if (subject) setProperty(msgData, "flags.pf1.subject", subject);

            await roll.toMessage(msgData);
          }
        }
        return roll;
      }
    };

    /***********
     * 
     * // End of const _roll = async (parts, setRoll, form) => 
     * 
     */




    // Modify the roll and handle fast-forwarding
    parts = [dice].concat(parts);
    if (fastForward === true) return _roll(parts, staticRoll);
    //else parts = parts.concat(["@bonus"]);



    let formula = dice.concat(d100stepdie(stepbonus));
    ///****** DIALOG BOX *************** */

    //Create data for Valid Gunners dropdown for 
    // Cater for the WEPO skill not being known untill the dialog is closed
    let validgunner = [];

    if (isStarshipweapon) {
      // Normal Crew
      if (!actor.system.crew.useNPCCrew) {
        for (let selectactor of actor.system.crew.gunner.actors) {
          if (selectactor.isOwner) {
            validgunner.push(selectactor)
          }
        }
      }
      // NPC Crew
      if (actor.system.crew.useNPCCrew) {
        const quality = actor.system.crew.npcCrewQuality
        let data = d100NPCCrewStats(quality)

        const crewman = {
          name: "NPC Gunner/Pilot",
          effects: [],
          system: {
            attributes: {
              actchk: data.actchk
            },
            skills: data.skills
          }
        }
        validgunner.push(crewman)

      }

      title = "Systems Operation - Weapons";
      formula = dice;
      flavor = "";
      skl.label = title
    }
    //else if (selectactor.isOwner){
    //  validgunner.push(selectactor)

    //}

    for (let target of targetData) {

    if (!target.resPenalty) target.resPenalty = 0;
    target.resistance = targetData ? (target.resPenalty > -1) ? "+" + target.resPenalty.toString() : target.resPenalty.toString() : "+0"
    console.log("****Resistance*****", target.resistance)
    target.cover = targetData ? (target.covermod > -1) ? "+" + target.covermod.toString() : target.covermod.toString() : "+0"
    console.log("****covermod*****",  target.cover)
    target.dodge = targetData ? (target.dodgemod > -1) ? "+" + target.dodgemod.toString() : target.dodgemod.toString() : "+0"
    console.log("****covermod*****",  target.dodge)
    }
    // Render modal dialog
    template = template || "systems/Alternityd100/templates/chat/roll-dialog.hbs";
    const dialogData = {
      rollSkill: rollSkill,
      formula: formula,
      data: data,
      rollMode: rollMode,
      rollModes: CONFIG.Dice.rollModes,
      step: "0 steps Average",
      isStarshipweapon: isStarshipweapon,
      validgunner: validgunner,
      d100A: d100A,
      item: item,
      targetData: targetData,
      range: targetData ? targetData[0].rangecat : null,
      skl: skl,
      // targetData? targetData[0].resPenalty || 0 : 0

    };
    //console.log("dialogData",dialogData)
    const html = await renderTemplate(template, dialogData);

    let roll;
    return new Promise((resolve) => {
      if (!(dialogOptions.classes instanceof Array)) dialogOptions.classes = [];
      dialogOptions.classes.push("dialog", "pf1", "die-roll");

      new Dialog(
        {
          title: title,
          content: html,
          buttons: {

            normal: {
              label: "Roll",
              class: "form-group",
              callback: (html) => resolve((roll = _roll(parts, staticRoll != null ? staticRoll : -1, html))),
            },

          },
          default: "normal",
          close: (html) => {
            if (onClose) onClose(html, parts, data);
            resolve(rolled ? roll : false);
          },
        },
        dialogOptions
      ).render(true);
    });
  }

  /**
    * A standardized helper function for managing game system rolls.
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
    *
    * @param {Event} event           The triggering event which initiated the roll
    * @param {Array} parts           The dice roll component parts, excluding the initial d20
    * @param {string} dice           The initial d20
    * @param {Actor} actor           The Actor making the d20 roll
    * @param {object} data           Actor or item data against which to parse the roll
    * @param {string} template       The HTML template used to render the roll dialog
    * @param {string} title          The dice roll UI window title
    * @param {object} speaker        The ChatMessage speaker to pass when creating the chat
    * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
    * @param {boolean} takeTwenty    Allow rolling with take twenty (and therefore also with take ten)
    * @param {boolean} situational   Allow for an arbitrary situational bonus field
    * @param {boolean} fastForward   Allow fast-forward advantage selection
    * @param {number} critical       The value of d20 result which represents a critical success
    * @param {number} fumble         The value of d20 result which represents a critical failure
    * @param {Function} onClose      Callback for actions to take when the dialog form is closed
    * @param {Object} dialogOptions  Modal dialog options
    * @param {Array} extraRolls      An array containing bonuses/penalties for extra rolls
    * @param {boolean} autoRender    Whether to automatically render the chat messages
    * @param {number} stepbonus  
    * @param {Object} targetData
   */
  static async attackAoE({
    rolltype,
    rollSkill,
    event,
    parts,
    dice = "1d20",
    data,
    subject,
    template,
    title,
    speaker,
    flavor,
    target,
    stepflavor,
    targetflavor,
    takeTwenty = true,
    situational = true,
    fastForward = true,
    critical = 1,
    fumble,
    onClose,
    dialogOptions = {},
    extraRolls = [],
    chatTemplate,
    chatTemplateData,
    staticRoll = null,
    chatMessage = true,
    noSound = false,
    compendiumEntry = null,
    stepbonus,
    ordinary,
    good,
    amazing,
    targets,
    actor,
    item,
    targetData,
    numberOfAttacks,
    isStarshipweapon,
    activegunner,
    skl,
    useMeasureTemplate,
    actorToken

  }) {
    /*
     console.log( 
    "  \n rolltype: \t ",    rolltype,    
    "  \n rollskill: \t ",    rollSkill, 
    "  \n event: \t ",    event,
    "  \n parts: \n ",    parts,
    "  \n stepbonus: \n", stepbonus,
    "  \n dice: \n ",    dice ,
    "  \n data: \n ",    data,
    "  \n subject: \n ",    subject,
    "  \n template: \n ",    template,
    "  \n title: \n ",    title,
    "  \n speaker: \n ",    speaker,
    "  \n flavor: \n ",    flavor,
    "  \n takeTwenty: \n ",    takeTwenty ,
    "  \n situational: \n ",    situational ,
    "  \n fastForward: \n ",    fastForward ,
    "  \n critical: \n ",    critical ,
    "  \n fumble: \n ",    fumble ,
    "  \n onClose: \n ",    onClose,
    "  \n dialogOptions: \n ",    dialogOptions ,
    "  \n extraRolls:  \n ",    extraRolls ,
    "  \n chatTemplate: \n ",    chatTemplate,
    "  \n chatTemplateData: \n ",    chatTemplateData,
    "  \n staticRoll:  \n ",    staticRoll ,
    "  \n chatMessage:  \n ",    chatMessage,
    "  \n noSound: \n ",    noSound ,
    "  \n compendiumEntry: \n ",    compendiumEntry ,
    "  \n stepbonus: \n ", stepbonus,
    "  \n ordinary: \n ", ordinary,
    "  \n good: \n ", good,
    "  \n amazing: \n ", amazing,
    "  \n targets: \n ", targets,
    "  \n actor: \n ", actor, 
    "  \n item: \n ", item, 
    "  \n targetData: \n ", targetData,
    "  \n numberOfAttacks: \n ", numberOfAttacks,
    "  \n isStarshipweapon: \n ", isStarshipweapon,
    "  \n activegunner: \n ", activegunner
    
    )
    */
    // Handle input arguments
    fumble = fumble || 20;
    flavor = flavor || title;
    let rollMode = game.settings.get("core", "rollMode");

    let rolled = false;
    let degree = 0;
    let AoEdistance = 0
    var AoETemplate
    // Inner roll function
    const _roll = async (parts, setRoll, form) => {


      const originalFlavor = flavor;
      rollMode = form ? form.find('[name="rollMode"]').val() : rollMode;
      let operator = form ? form.find('[name="operator"]').val() : 0;
      let dialogRange = form ? form.find('[name="range"]').val() : 0;
      let dialogResistance = form ? form.find('[name="resistance"]').val() : 0;
      let dialogCover = form ? form.find('[name="cover"]').val() : 0;
      let dialogMovement = form ? form.find('[name="movement"]').val() : 0;

      //console.log ("*******operator******",operator,parts, setRoll, form,dialogRange,dialogResistance,this)
      //  dSteps = form ? form.find('[name="dstep"]').val() : dSteps;
      if (isStarshipweapon) {
        activegunner = validgunner[operator]


        //console.log(activegunner.name)

        flavor = "Gunner-" + activegunner.name;
        stepbonus = activegunner.system.skills.weapo.step

        ordinary = activegunner.system.skills.weapo.base
        good = activegunner.system.skills.weapo.good
        amazing = activegunner.system.skills.weapo.amazing
        //console.log("\nordinary",ordinary, "\ngood", good,"\namazing",amazing,"\nactivegunner",activegunner)


      }

      /**
      * 
      * Create a template
      * 
      * 
      *  */


      // Determine size
      let dist = getProperty(item, "system.blastArea.long");
      //dist = 10
      //  if (typeof dist === "string") {
      //    dist = RollPF.safeRoll(getProperty(this.data, "data.measureTemplate.size"), rollData).total;
      //  }
      //console.log(dist)
      // dist = convertDistance(dist)[0];
      //console.log(dist)
      // Create data object
      const templateOptions = {
        //type: getProperty(this.data, "data.measureTemplate.type"),
        type: "circle",
        distance: dist
        //texture: PIXI.Texture.from('systems/Alternityd100/icons/conditions/asleep.png')
      };



      //  if (getProperty(this.data, "data.measureTemplate.overrideColor")) {
      //    templateOptions.color = getProperty(this.data, "data.measureTemplate.customColor");
      //  }
      //  if (getProperty(this.data, "data.measureTemplate.overrideTexture")) {
      //    templateOptions.texture = getProperty(this.data, "data.measureTemplate.customTexture");
      //  }

      /**
      * The measure template types available e.g. for spells
      */
      const measureTemplateTypes = {
        cone: "PF1.MeasureTemplateCone",
        circle: "PF1.MeasureTemplateCircle",
        ray: "PF1.MeasureTemplateRay",
        rect: "PF1.MeasureTemplateRectangle",
      };



      // Create template
      AoETemplate = AbilityTemplate.fromData(templateOptions);
      console.log(this, templateOptions)

      if (AoETemplate) {
        const sheetRendered = this.parent?.sheet?._element != null;
        if (sheetRendered) this.parent.sheet.minimize();
        AoETemplate = await AoETemplate.drawPreview(event);
        //console.log(event )
        if (!AoETemplate) {
          if (sheetRendered) this.parent.sheet.maximize();
          return;
        }
      }

      //console.log(AoETemplate)
      AoEdistance = Math.ceil((canvas.grid.measureDistance({ x: actorToken.x, y: actorToken.y }, { x: AoETemplate[0].x, y: AoETemplate[0].y })));



      let tempdistx = actorToken.elevation - 0
      if (tempdistx > 0) tempdistx = tempdistx ** 0.5
      const tempdistxy = ((AoEdistance ** 2) + (tempdistx ** 2)) ** 0.5


      //console.log("Dist",tempdistx,tempdisty,tempdistx**2,tempdisty**2 )
      //console.log("Range",tempdistxy)
      let tempdist = tempdistxy.toFixed(1)

      target.distance = tempdist
      target.rangecat = getRangeCat(target, item)








      /****************************************
      * Update data from the Attack dialog box
      ******************************************/
      //console.log(AoETemplate[0])


      //console.log("targetData",targetData)
      target.resPenalty = dialogResistance || 0
      target.rangemod = attackModData(item.system.weaponType, rollSkill, target.rangecat);
      target.covermod = dialogCover || 0
      target.movementmod = dialogMovement || 0

      //console.log("Target Data",attackModData(item.system.weaponType,rollSkill,targetData[0].rangecat),targetData,dialogRange)



      target.attackbonus = 0
      target.attackbonus =
        parseInt(stepbonus)
        + parseInt(target.accur)
        + parseInt(target.movementmod)
        //+ parseInt(target.AWAModeMod )
        + parseInt(target.rangemod)
        + parseInt(target.resPenalty)
        + parseInt(target.covermod)


      target.flavor = "\nSkill: " + skl.label
      target.flavor += "\nSkill Step: " + stepbonus
      target.flavor += "\nAccuracy: " + target.accur
      target.flavor += "\nMovement Mod: " + target.movementmod
      //target.flavor += "\nFire Mode: " + target.AWAModeMod
      target.flavor += "\nRange Mod: " + target.rangemod
      target.flavor += "\nRes Mod: " + target.resPenalty
      target.flavor += "\nCover Mod: " + target.covermod








      if (isStarshipweapon) {

        skl.label = "System Operation - Weapons"
        target.flavor = "\nSkill: " + "System Operation - Weapons"
        target.flavor += "\nSkill Step: " + stepbonus
        target.flavor += "\nAccuracy: " + target.accur

        /**
        * 
        *    NEED TO ADD AWA MODE
        * 
        */

        target.flavor += "\nFire Mode: " //+ AWAModeMod[a]
        target.flavor += "\nRange Mod: " + target.rangemod
        target.flavor += "\nRes Mode: " + target.resPenalty
        //console.log("AWAModeMod", target);
      }

      //flavor = originalFlavor;
      const curParts = duplicate(parts);
      let totalbonus = 0;
      // Don't include situational bonus unless it is defined
      //sitBonus = stepbonus;
      let sitBonus = form ? form.find('[name="dstep"]').val() : 0;
      //sitBonus =0;

      if (!sitBonus && curParts.indexOf("@bonus") !== -1) curParts.pop();
      //console.log("Data Bonus", sitBonus, " stepbonus", stepbonus)

      totalbonus = target.attackbonus + parseInt(sitBonus);
      //console.log( stepbonus,totalbonus, sitBonus, dice)
      let stepflavor = `Difficulty: ${sitBonus} `;

      if (item.hasDamage) target.dmgresult = await Diced100.d100AdamageRoll({
        data: item.system,
        actor: actor
      });


      /*** For the first roll, roll the d20 as well as the bonus dice */

      target.attroll = await Roll.create(dice.concat(d100stepdie(target.attackbonus + parseInt(sitBonus)))).evaluate({ async: true });


      /*** For the second rolls, roll the d20 as well as the bonus dice */

      //console.log(target.attackbonus,target.attroll)
      /**Check what kind of success was rolled */
      if (target.attroll.total > ordinary) { target.degree = "Failure"; target.degreeShort = "failure" };
      if (target.attroll.total <= ordinary) { target.degree = "Ordinary"; target.degreeShort = "ordinary" };
      if (target.attroll.total <= good) { target.degree = "Good"; target.degreeShort = "good" };
      if (target.attroll.total <= amazing) { target.degree = "Amazing!"; target.degreeShort = "amazing" };
      if (target.attroll.terms[0].total >= fumble) { target.degree = "Critical Failure"; target.degreeShort = "critical" };
      //if (target.attroll.terms[0].total == 1) {target.degree = "Critical Success"; target.degreeShort = "amazing"};
      //console.log(target.degree,target.degreeShort,target)

      target.firepower = item.system.firepower;
      target.type = item.system.damage.type;
      target.flavor += "\nDice: " + target.attroll.formula
      target.flavor += "\nRoll: " + target.attroll.result
      target.dmgtype = {
        ord: item.system.damage.ord.type,
        goo: item.system.damage.goo.type,
        ama: item.system.damage.ama.type
      };

      target.tooltip = await target.attroll.getTooltip()
      target.roll = target.attroll.toJSON();
      //console.log("\nordinary",ordinary, "\ngood", good,"\namazing",amazing)
      //console.log("\nRoll",target.attroll, targetData,"\nattack", d100stepdie(target.attackbonus))

      //if (target.degree == "Failure")  {
      target.missroll = await Roll.create("1d62");
      await target.missroll.evaluate()
      target.mrroll = target.missroll.toJSON()
      target.missangle = target.missroll.total * 36 / 2 / Math.PI
      //console.log("target.mrroll",target.missroll,target.mrroll)
      //console.log("target.mrroll",target.missroll,target.mrroll,target.missangle)

      /*Table P2O: Accuracy by Range*
                      Distance from Target*/
      let abr = {
        "critical": { "short": 4, "medium": 8, "long": 12 },
        "failure": { "short": 2, "medium": 4, "long": 6 },
        "ordinary": { "short": 0, "medium": 2, "long": 4 },
        "good": { "short": 0, "medium": 0, "long": 2 },
        "amazing": { "short": 0, "medium": 0, "long": 0 }

      }
      //console.log("range", abr.critical.long,abr)

      let xloc = AoETemplate[0].x
      let yloc = AoETemplate[0].y

      let delta = abr[target.degreeShort][target.rangecat] * canvas.grid.size
      let xdelta = parseInt(delta * Math.sin(target.missroll.total / 10))
      let ydelta = parseInt(delta * Math.cos(target.missroll.total / 10))

      xloc += xdelta
      yloc += ydelta
      //console.log("Loc",xloc,yloc,delta,xdelta,ydelta,target.missroll.total/10,AoETemplate,target.missroll.total)

      actorToken.x,
        actorToken.y
      xloc
      yloc
      let ray = new Ray({ x: actorToken.object.center.x, y: actorToken.object.center.y }, { x: xloc, y: yloc })

      //CONST.WALL_RESTRICTION_TYPES.includes(config.type)
      //let coll = await canvas.walls.checkCollision(ray,{mode:"closest",type:"move"}) Deprecated since Version 11
      const obsMode = "move"
      let coll
      const collisions = await CONFIG.Canvas.polygonBackends[obsMode].testCollision(ray.A, ray.B, { mode: "all", type: obsMode })
      if (!!collisions.length) coll = collisions[0]
      //console.log(collisions)
      //[3].value.flags["wall-height"].top
      //console.log("\nLoc",actorToken.object.center.x,actorToken.object.center.y,xloc,yloc,ray,coll)
      if (!!coll) {
        let wallDelta = 0.1 * canvas.grid.size
        let range = Math.sqrt(Math.pow((coll.x - actorToken.object.center.x), 2) + Math.pow((coll.y - actorToken.object.center.y), 2))
        range -= wallDelta
        xloc = parseInt(range * Math.cos(ray.angle) + actorToken.object.center.x)
        yloc = parseInt(range * Math.sin(ray.angle) + actorToken.object.center.y)

        //xloc = coll.x;
        //yloc = coll.y;
        ui.notifications.info("Hit the Wall");
        //console.log("\nLoc",xloc,yloc,range,ray,coll)
      }
      //console.log("\nLoc",xloc,yloc)

      await AoETemplate[0].update({ x: xloc, y: yloc })
      /*
      Skill Check Reselt    Short     Medium    Long
      Critical Failure      4 m       8 m       12 m
      Failure               2 m       4 m       6 m
      Ordinary              hit       2 m       4 m
      Good                  on target on target 2 m
      Amazing always on target
      /** For thrown objects or indirect fire weapon
      */
      //console.log("\nAttack Roll\n" ,attroll, "\n")


      //Make the Attack  flavor Text
      // Convert the roll to a chat message
      // ---------THESE ARE THE VARIABLES READ BY THE CHAT DATA
      // Cycle thru tokens, see if we hit
      let fulltargetData = []
      for (let token of game.scenes.current.tokens) {
        if (Math.ceil(canvas.grid.measureDistance({ x: AoETemplate[0].x, y: AoETemplate[0].y }, { x: token.object.center.x, y: token.object.center.y })) <= dist) {
          const blastdist = Math.ceil(canvas.grid.measureDistance({ x: AoETemplate[0].x, y: AoETemplate[0].y }, { x: token.object.center.x, y: token.object.center.y }))
          let rangecat
          if (blastdist <= item.system.blastArea.long) rangecat = "Long";
          if (blastdist <= item.system.blastArea.medium) rangecat = "Medium";
          if (blastdist <= item.system.blastArea.short) rangecat = "Short";
          let temptargetData = {
            Name: token.name,
            distance: blastdist,
            firepower: item.system.firepower,
            rangecat: rangecat,
            token: token,
            type: item.system.damage.type,
            units: "m",
            dmgtype: {
              ord: item.system.damage.ord.type,
              goo: item.system.damage.goo.type,
              ama: item.system.damage.ama.type
            },
            dmgresult: null,
            _id: token.id,
            targetid: token.id
          }
          fulltargetData.push(temptargetData)
        }
      }
      targetData = fulltargetData.filter(function (target) {

        let ray = new Ray({ x: target.token.object.center.x, y: target.token.object.center.y }, { x: xloc, y: yloc })
        //console.log(ray)

        /***
         * Maybe add a Grenade launcher light sight move penetration factor
         * mode : any collisions returns true / false
         * All returns an array of collisions
         * // Visualize result is included in  _testCollision(ray, mode) foundary 48792
         */
        const obsMode = "move"
        let temp = CONFIG.Canvas.polygonBackends[obsMode].testCollision(ray.A, ray.B, { mode: "any", type: obsMode })
        //let temp = canvas.walls.checkCollision(ray,{mode:"any",type:"move"}); Deprecated since Version 11

        //console.log(temp, ray, target)
        return !temp
      });

      //console.log (targetData)

      for (let thisTarget of targetData) {
        thisTarget.dmgresult = target.dmgresult
        if (thisTarget.distance <= item.system.blastArea.long) { thisTarget.degree = "Ordinary" };
        if (thisTarget.distance <= item.system.blastArea.medium) { thisTarget.degree = "Good" };
        if (thisTarget.distance <= item.system.blastArea.short) { thisTarget.degree = "Amazing" };
      }
      targetData.sort(function (a, b) { return a.distance - b.distance });


      if (chatTemplate) {
        // Create roll template data
        const d20 = target.attroll.terms[0];
        const rollData = mergeObject(
          {
            target: target,
            rollSkill: rollSkill,
            user: game.user.id,
            formula: roll.formula,
            tooltip: await target.attroll.getTooltip(),
            total: roll.total,
            isCrit: target.attroll.terms[0].total <= critical,
            isFumble: target.attroll.terms[0].total >= fumble,
            isNat20: target.attroll.terms[0].total === 20,
            flavor: flavor,
            targetflavor: targetflavor,
            stepflavor: stepflavor,
            degree: degree,
            compendiumEntry: compendiumEntry,
            //targets: targets,
            actor: actor,
            item: item,
            targetData: targetData,
            useMeasureTemplate: useMeasureTemplate,
            stepbonus: stepbonus,

          },
          chatTemplateData || {}
        );

        // Create chat data

        const chatData = {
          user: game.user.id,
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          sound: noSound ? null : true ? CONFIG.sounds.dice : null,
          speaker: speaker,
          content: await renderTemplate(chatTemplate, rollData),
          rollMode: rollMode,
          roll: target.attroll.toJSON(),
          degree: degree,//subject.ordinary ,
          "flags.pf1.noRollRender": true,

        };
        if (subject) setProperty(chatData, "flags.pf1.subject", subject);

        // Send message
        rolled = true;
        //console.log("Message", CONST.CHAT_MESSAGE_TYPES.ROLL,"subject.ordinary ", subject.ordinary)
        if (chatMessage) return await ChatMessagePF.create(chatData);
      } else {
        rolled = true;
        if (chatMessage) {
          const msgData = {
            speaker: speaker,
            flavor: flavor,
            targetflavor: targetflavor,
            rollMode: rollMode,
            sound: a === 0 ? CONFIG.sounds.dice : null,
          };
          if (subject) setProperty(msgData, "flags.pf1.subject", subject);

          await roll.toMessage(msgData);
        }
      }
      return roll;

    };

    /***********
    * 
    * // End of const _roll = async (parts, setRoll, form) => 
    * 
    */




    // Modify the roll and handle fast-forwarding
    parts = [dice].concat(parts);
    if (fastForward === true) return _roll(parts, staticRoll);
    //else parts = parts.concat(["@bonus"]);



    let formula = dice.concat(d100stepdie(stepbonus));
    ///****** DIALOG BOX *************** */

    //Create data for Valid Gunners dropdown for 
    // Cater for the WEPO skill not being known untill the dialog is closed
    let validgunner = [];

    if (isStarshipweapon) {
      for (let selectactor of actor.system.crew.gunner.actors) {
        if (selectactor.isOwner) {
          validgunner.push(selectactor)
        }
      }
      title = "Systems Operation - Weapons";
      formula = dice;
      flavor = "";
      skl.label = title
    }
    //else if (selectactor.isOwner){
    //  validgunner.push(selectactor)

    //}
    // targetData[0].resPenalty = 0;
    const resistance = "+0" // targetData? (targetData[0].resPenalty>-1)? "+" + targetData[0].resPenalty.toString() : "-"+targetData[0].resPenalty.toString()  : "+0"
    console.log(resistance)
    // Render modal dialog
    template = template || "systems/Alternityd100/templates/chat/roll-dialog.hbs";
    const dialogData = {
      rollSkill: rollSkill,
      formula: formula,
      data: data,
      rollMode: rollMode,
      rollModes: CONFIG.Dice.rollModes,
      step: "0 steps Average",
      isStarshipweapon: isStarshipweapon,
      validgunner: validgunner,
      d100A: d100A,
      item: item,
      targetData: targetData,
      range: target.rangecat,
      skl: skl,
      //cover : 
      resistance: resistance // targetData? targetData[0].resPenalty || 0 : 0

    };
    //console.log("dialogData",dialogData)
    const html = await renderTemplate(template, dialogData);

    let roll;
    return new Promise((resolve) => {
      if (!(dialogOptions.classes instanceof Array)) dialogOptions.classes = [];
      dialogOptions.classes.push("dialog", "pf1", "die-roll");

      new Dialog(
        {
          title: title,
          content: html,
          buttons: {

            normal: {
              label: "Roll",
              class: "form-group",
              callback: (html) => resolve((roll = _roll(parts, staticRoll != null ? staticRoll : -1, html))),
            },

          },
          default: "normal",
          close: (html) => {
            if (onClose) onClose(html, parts, data);
            resolve(rolled ? roll : false);
          },
        },
        dialogOptions
      ).render(true);
    });
  }



  static async skillRoll({
    event,
    parts,
    dice = "1d20",
    data,
    subject,
    template,
    title,
    speaker,
    flavor,
    skillflavor,
    stepflavor,
    takeTwenty = true,
    situational = true,
    fastForward = true,
    critical = 1,
    fumble = 20,
    onClose,
    dialogOptions = {},
    extraRolls = [],
    chatTemplate,
    chatTemplateData,
    staticRoll = null,
    chatMessage = true,
    noSound = false,
    compendiumEntry = null,
    stepbonus,
    ordinary,
    good,
    amazing,
    hasDegreeText,
    degreeText
  }) {
    /*
       console.log( 
          "Actor -- ", data,
    "\n    event,",    event,
    "\n    parts,",    parts,
    "\nstepbonus", stepbonus,
    "\nordinary", ordinary,
    "\ngood", good,
    "\namazing", amazing,
    "\n    dice = 1d20 ",    dice ,
    "\n    data,",    data,
    "\n    subject,",    subject,
    "\n    template,",    template,
    "\n    title,",    title,
    "\n    speaker,",    speaker,
    "\n    flavor,",    flavor,
    "\n    takeTwenty = true,",    takeTwenty ,
    "\n    situational = true,",    situational ,
    "\n    fastForward = true,",    fastForward ,
    "\n    critical = 1,",    critical ,
    "\n    fumble = 20,",    fumble ,
    "\n    onClose,",    onClose,
    "\n    dialogOptions = {},",    dialogOptions ,
    "\n    extraRolls = [],",    extraRolls ,
    "\n    chatTemplate,",    chatTemplate,
    "\n    chatTemplateData,",    chatTemplateData,
    "\n    staticRoll = null,",    staticRoll ,
    "\n    chatMessage = true,",    chatMessage,
    "\n    noSound = false,",    noSound ,
    "\n    compendiumEntry = null,",    compendiumEntry ,
    
    )
    */
    // Handle input arguments
    flavor = flavor || title;

    //console.log(flavor)
    let rollMode = game.settings.get("core", "rollMode");

    let rolled = false;
    let degree = 0;

    // Inner roll function
    const _roll = async (parts, setRoll, form) => {
      const originalFlavor = flavor;
      rollMode = form ? form.find('[name="rollMode"]').val() : rollMode;
      //  dSteps = form ? form.find('[name="dstep"]').val() : dSteps;
      for (let a = 0; a < 1 + extraRolls.length; a++) {
        flavor = originalFlavor;
        const curParts = duplicate(parts);
        let totalbonus = 0;
        // Don't include situational bonus unless it is defined
        data.bonus = form ? form.find('[name="dstep"]').val() : 0;
        if (!data.bonus && curParts.indexOf("@bonus") !== -1) curParts.pop();
        //console.log("Data Bonus", data.bonus, " stepbonus", stepbonus)
        // Extra roll specifics
        if (a >= 1) {
          const extraRoll = extraRolls[a - 1];

          curParts.push(extraRoll.bonus);
          flavor += ` <div class="extra-roll-label">${extraRoll.label}</div>`;
        }
        // Do set roll
        if (setRoll != null && setRoll >= 0) {
          curParts[0] = `${setRoll}`;
          flavor += ` (Take ${setRoll})`;
        }
        totalbonus = stepbonus + parseInt(data.bonus);
        //console.log( stepbonus,totalbonus, data.bonus, dice.concat(d100stepdie(totalbonus)))
        flavor += `Base: ${stepbonus} , DS: ${data.bonus} `;


        // Execute the roll
        // const roll = await Roll.create(curParts.join(" "), d100stepdie(stepbonus)).evaluate({ async: true });
        const roll = await Roll.create(dice.concat(d100stepdie(totalbonus))).evaluate({ async: true });
        // determin degree of sucess or failure

        if (roll.total > ordinary) { degree = "Failure" };
        if (roll.total <= ordinary) { degree = "Ordinary" };
        if (roll.total <= good) { degree = "Good" };
        if (roll.total <= amazing) { degree = "Amazing!" };
        if (roll.terms[0].results[0].result > fumble) { degree = "Critical Failure" };
        //if (roll.terms[0].results[0].result == 1) {degree = "Critical Success"};

        //console.log( roll,roll.terms[0].results[0].result, " OGA"   ,    ordinary,  good, amazing)



        // Convert the roll to a chat message
        if (chatTemplate) {
          // Create roll template data
          const d20 = roll.terms[0];
          const rollData = mergeObject(
            {
              user: game.user.id,
              formula: roll.formula,
              tooltip: await roll.getTooltip(),
              total: roll.total,
              isCrit: d20.results[0].result <= critical,
              isFumble: d20.results[0].result >= fumble,
              isNat20: d20.results[0].result === 20,
              flavor: flavor,
              skillflavor: skillflavor,
              degree: degree,
              stepflavor: stepflavor,
              compendiumEntry: compendiumEntry,

              hasDegreeText,
              degreeText
            },
            chatTemplateData || {}
          );

          // Create chat data
          const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            sound: noSound ? null : a === 0 ? CONFIG.sounds.dice : null,
            speaker: speaker,
            content: await renderTemplate(chatTemplate, rollData),
            rollMode: rollMode,
            stepflavor: stepflavor,
            roll: roll.toJSON(),

            degree: degree,//subject.ordinary ,
            "flags.pf1.noRollRender": true,

          };
          if (subject) setProperty(chatData, "flags.pf1.subject", subject);

          // Send message
          rolled = true;
          //console.log("Message", CONST.CHAT_MESSAGE_TYPES.ROLL,"subject.ordinary ", subject.ordinary)
          if (chatMessage) return await ChatMessagePF.create(chatData);
        } else {
          rolled = true;
          if (chatMessage) {
            const msgData = {
              speaker: speaker,
              flavor: flavor,
              stepflavor: stepflavor,
              rollMode: rollMode,
              sound: a === 0 ? CONFIG.sounds.dice : null,

            };
            if (subject) setProperty(msgData, "flags.pf1.subject", subject);

            await roll.toMessage(msgData);
          }
        }
        return roll;
      }
    };

    // Modify the roll and handle fast-forwarding
    parts = [dice].concat(parts);
    if (fastForward === true) return _roll(parts, staticRoll);
    //else parts = parts.concat(["@bonus"]);


    ///****** DIALOG BOX *************** */



    // Render modal dialog
    template = template || "systems/Alternityd100/templates/chat/roll-dialog.hbs";
    const dialogData = {
      formula: dice.concat(d100stepdie(stepbonus)),
      data: data,
      stepflavor: stepflavor,
      rollMode: rollMode,
      rollModes: CONFIG.Dice.rollModes,
      step: "0 steps Average",
      /*steps: [
      "-5 steps No Sweat",
      "-4 steps Cakewalk", 
      "-3 steps Extremely Easy", 
      "-2 steps Very Easy", 
      "-1 steps Easy", 
      "0 steps Average", 
      "+1 steps Tough", 
      "+2 steps Hard", 
      "+3 steps Challenging", 
      "+4 steps Formidable", 
      "+5 steps Grueling", 
      "+6 steps Gargantuan", 
      "+7 steps Leroy Jenkins"],
*/

    };
    const html = await renderTemplate(template, dialogData);

    let roll;
    return new Promise((resolve) => {
      if (!(dialogOptions.classes instanceof Array)) dialogOptions.classes = [];
      dialogOptions.classes.push("dialog", "pf1", "die-roll");

      new Dialog(
        {
          title: title,
          content: html,
          buttons: {

            normal: {
              label: "Roll",
              class: "form-group",
              callback: (html) => resolve((roll = _roll(parts, staticRoll != null ? staticRoll : -1, html))),
            },

          },
          default: "normal",
          close: (html) => {
            if (onClose) onClose(html, parts, data);
            resolve(rolled ? roll : false);
          },
        },
        dialogOptions
      ).render(true);
    });
  }



  /* -------------------------------------------- */

  /** ---------- D100 Alternity DAMAGE ROLL
   * 
   * A standardized helper function for managing damage rolls.
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
   *
   * @param {Event} event           The triggering event which initiated the roll
   * @param {Array} parts           The dice roll component parts, excluding the initial d20
   * @param {Actor} actor           The Actor making the damage roll
   * @param {object} data           Actor or item data against which to parse the roll
   * @param {string} template       The HTML template used to render the roll dialog
   * @param {string} title          The dice roll UI window title
   * @param {object} speaker        The ChatMessage speaker to pass when creating the chat
   * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
   * @param {boolean} critical      Allow critical hits to be chosen
   * @param {Function} onClose      Callback for actions to take when the dialog form is closed
   * @param {object} dialogOptions  Modal dialog options
   */
  static async d100AdamageRoll({
    //event = {},
    //parts,
    actor,
    data,
    //template,
    //title,
    //speaker,
    //flavor,
    //critical = true,
    //onClose,
    //dialogOptions = {},
    //chatTemplate,
    //chatTemplateData,
    //chatMessage = true,
    noSound = true,
    //rollContext
  }) {
    //const rollOrd = Roll.create(rolldice, item.data);
    //parseInt(data.damagebonus)
    const damageResults = { ord: { damage: "" }, goo: { damage: "" }, ama: { damage: "" } };

    const actorData = actor.system
    //console.log(data,damageResults )
    //console.log(data.damage.ord.dice )
    damageResults.ord.damage = await Roll.create(data.damage.ord.dice, actorData).evaluate({ async: false });
    damageResults.goo.damage = await Roll.create(data.damage.goo.dice, actorData).evaluate({ async: false });
    damageResults.ama.damage = await Roll.create(data.damage.ama.dice, actorData).evaluate({ async: false });

    console.log("*****************************************", damageResults, data)
    return damageResults;
  }

  /* -------------------------------------------- */

  /** ---------- D100 Alternity DAMAGE ROLL
   * 
   * A standardized helper function for managing damage rolls.
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
   *

Stun Damage
Stun damage is ihe lightest type of damage a hero can sustain. It repre- sents bumps and bruises and mild abrasions I ha l can rattle a character but don't result in lasting injuries.
For every point of stun damage your hero receives, mark off one box on the stun rating line of your hero sheet.
Knockout
If all q! your hero's sSun boxes are marked off, he is immediately knocked out, Your hero is uncon- scious and can r t perform any actions until he regains consciousness.
Heavy Stun
After all ol a hero's stun boxes have been marked off, additional stun damage becomes wound damage. For every 2 additional points of stun damage a knocked -out hero suffers in a single attack, he or she suffers 1 point of wound damage (disregard the leftover point of stun damage, if applicable).
Wound HamaEjje
Wound damage is more serious than stun damage. It represents injuries that cause lasting harm to the body, such as severe lacerations and bro- ken bones. (Note, however, that the system doesn't take into account the effects ai different types of wound damage.) For every point of wound damage your hero receives, mark off one box on the wound rating line of your hero sheet.
Seconiiary Damage
Damage that inflicts wounds also re suits in secondary stun damage. For every 2 points of wound damage a hero suffers in a single attack, he also suffers 1 point of stun damage (disregard the leftover point of wound damage, if applicable).
Knockout:
11 all of your hero's wound boxes are marked off, he is knocked out. Your hero is unconscious and can't per- form any actions until he regains consciousness.
Heavy Wound
Alter all of a hero's wound boxes have been marked off. additional wounds are applied as mortal dam- age. Far every 2 additional paints of wound damage suffered in a single attack by a hero with no remaining wound boxes, he or she suffers I point of mortal damage (disregard Ihe leftover point of wound damage, if applica ble).
Mortal Damage
Mortal damage is the most severe lorm of trauma a body can endure. It represents such injuries as a severed artery or the rupture ol a major organ (although the game system does not distinguish between the elfects ol different types of mortal damage}.
For every point of mortal damage your hero receives, mark off one box on the mortal rating line of your hero sheet.
Secondary Damage
For every 2 points ol mortal damage
a hero suiters in a single attack, he □Iso takes 1 point of wound damage and 1 point ot stun damage (disre- gard the leftover point of mortal damage, if applicable). This wound damage does not also cause sec- ondary stun damage, as described in the "Wound Damage" section.
Dazed
Mortal damage takes a loll on a hero immediately. For every point of mor- tal damage your hero suffers, he re- ceives a + 1 step penalty to all subse- quent actions he attempts. (This penalty is cumulative — a penally of +2 steps for 2 points of mortal dam- age, and so forth.)
Dying and Death
A character who suffers any amount si mortal damage is considered to be dying. At the end of any scene in which a character has suffered mor- tal damage, the mortally wounded character must make a Stamina-en- durance check. The result ol this check determines i| the victim's con dition worsens: On a Critical Failure result, he suffers 2 additional points
01 mortal damage: on a Failure, he sutlers 3 additional poinl of mortal damage: on any success result, his condition remains unchanged.
Until the victim receives medical treatment, lie must make a new Sta- mina -endurance check every hour,

degraded Damage
 If a character using a weapon of Ordinary fire- rer gets a successful hit against someone wearing armor with a Good Highness rating* the severity of the primary damage is degraded by one 3 — mortal damage becomes wound damage, wound damage turns and stun damage is negated. Secondary damage is calculated original damage is degraded*

   * @param {object} data           Actor or item data against which to parse the roll

   */
  static async d100AdefenceRoll({
    //event = {},
    //parts,
    actor,
    data,
    //template,
    //title,
    speaker,
    //flavor,
    //critical = true,
    //onClose,
    //dialogOptions = {},
    //chatTemplate,
    //chatTemplateData,
    //chatMessage = true,
    noSound = false,
    //rollContext
  }) {
    //const rollOrd = Roll.create(rolldice, item.data);
    //parseInt(data.damagebonus)
    const damageResults = {};
    var defend = [];
    var defence = []

    var bestdefence = 0;

    var bestarmor


    //const 
    //console.log(data,damageResults )
    //FINISH DAMAGE DEGRADATION--------------
    //if (data.defenceData.armor[0].system.firepower ) ;

    for (let [key, armor] of Object.entries(data.defenceData.armor)) {
      defence[key] = {}
      defence[key].roll = await Roll.create(armor.system.armor[data.type]).evaluate({ async: true });
      //if (bestdefence < defend[key].total) 
      defence[key].damage = calculateDamage(data, key, armor, defence[key].roll);
      defence[key].armor = armor
      //{bestdefence = defend[key].total;
      //bestarmor = key
      //}

    }

    const attack = data.defenceData.value + " " + data.defenceData.dmgtype + " (" + data.defenceData.type + ")(" + data.defenceData.firepower + ")";
    //armorroll = bestdefence + " ([" + ""//defend[bestarmor].formula + "] " ;


    const rollData = { data: data, defence: defence };



    if (data.defenceData.armor.length) {
      data.defenceData.armor[0]._postDefendMessage(rollData);
    }
    else {
      throw new Error("You have no armor!!");
    }
    return defence;




  }

  /* -------------------------------------------- */

  /**
   * A standardized helper function for managing damage rolls.
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
   *
   * @param {Event} event           The triggering event which initiated the roll
   * @param {Array} parts           The dice roll component parts, excluding the initial d20
   * @param {Actor} actor           The Actor making the damage roll
   * @param {object} data           Actor or item data against which to parse the roll
   * @param {string} template       The HTML template used to render the roll dialog
   * @param {string} title          The dice roll UI window title
   * @param {object} speaker        The ChatMessage speaker to pass when creating the chat
   * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
   * @param {boolean} critical      Allow critical hits to be chosen
   * @param {Function} onClose      Callback for actions to take when the dialog form is closed
   * @param {object} dialogOptions  Modal dialog options
   */
  static async damageRoll({
    event = {},
    parts,
    actor,
    data,
    template,
    title,
    speaker,
    flavor,
    critical = true,
    onClose,
    dialogOptions = {},
    chatTemplate,
    chatTemplateData,
    chatMessage = true,
    noSound = false,
    rollContext,
  }) {
    flavor = flavor || title;
    const rollMode = game.settings.get("core", "rollMode");
    let rolled = false;
    //console.log(" Data" ,  data)
    // Inner roll function
    const _roll = async (crit, form) => {
      // Don't include situational bonus unless it is defined
      //sitBonus = form ? form.find('[name="bonus"]').val() : 0;

      // Detemrine critical multiplier
      // data["critMult"] = crit ? data.item.ability.critMult : 1;
      // Determine damage ability
      //data["ablMult"] = 0;
      //if (data.item.ability.damageMult != null) {
      //  data["ablMult"] = data.item.ability.damageMult;
      //}
      chatTemplate = chatTemplate || "systems/Alternityd100/templates/chat/simple-damage.hbs";
      var rolldice = data.damage.ord.dice; //+ "+" + parts.join("+")
      const rollOrd = Roll.create(rolldice, data);
      //console.log(data)+
      aetyertyety
      //console.log("Roll Data" ,  rollContext,"\nParts\n",parts,"\nRoll\n",rollOrd.terms,parts.join("+"),"\nChat\n",chatTemplate,"\nrolldice\n" ,rolldice)
      /* if (crit === true) {
         const mult = data.item.ability.critMult || 2;
 
         // Update first damage part
         roll.alter(0, mult);
         flavor = `${flavor} (Critical)`;
       }
 */
      await rollOrd.evaluate({ async: true });

      // Convert the roll to a chat message
      if (chatTemplate) {
        // Create roll template data
        const rollData = mergeObject(
          {
            user: game.user._id,
            formula: rollOrd.formula,
            tooltip: await rollOrd.getTooltip(),
            total: rollOrd.total,
          },
          chatTemplateData || {}
        );

        // Create chat data
        const chatData = {
          user: game.user._id,
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          sound: noSound ? null : CONFIG.sounds.dice,
          speaker: speaker,
          flavor: flavor,
          rollMode: rollMode,
          roll: rollOrd,
          content: await renderTemplate(chatTemplate, rollData),
          useCustomContent: true,
        };
        setProperty(chatData, "flags.pf1.subject.core", "damage");

        // Handle different roll modes
        ChatMessage.applyRollMode(chatData, chatData.rollMode);

        // Send message
        rolled = true;
        if (chatMessage) ChatMessagePF.create(chatData);
      } else {
        rolled = true;
        if (chatMessage) {
          rollOrd.toMessage({
            speaker: speaker,
            flavor: flavor,
            rollMode: rollMode,
          });
        }
      }

      // Return the Roll object
      return rollOrd;
    };

    // Modify the roll and handle fast-forwarding
    if (!event.shiftKey) return _roll(event.ctrlKey);
    else parts = parts.concat(["@bonus"]);

    // Construct dialog data
    /**
     * 
     * Attack roll dialog Box 
     * 
     */


    template = template || "systems/Alternityd100/templates/chat/roll-dialog.hbs";
    const dialogData = {
      formula: parts.join(" + "),
      data: data,
      rollMode: rollMode,
      rollModes: CONFIG.Dice.rollModes,
    };
    const html = await renderTemplate(template, dialogData);

    // Render modal dialog
    let roll;
    return new Promise((resolve) => {
      if (!(dialogOptions.classes instanceof Array)) dialogOptions.classes = [];
      dialogOptions.classes.push("dialog", "pf1", "damage-roll");

      new Dialog(
        {
          title: title,
          content: html,
          buttons: {
            normal: {
              label: critical ? "Normal" : "Roll",
              callback: (html) => (roll = _roll(false, html)),
            },
            critical: {
              condition: critical,
              label: "Critical Hit",
              callback: (html) => (roll = _roll(true, html)),
            },
          },
          default: "normal",
          close: (html) => {
            if (onClose) onClose(html, parts, data);
            resolve(rolled ? roll : false);
          },
        },
        dialogOptions
      ).render(true);
    });
  }

  static messageRoll({ data, msgStr }) {
    const re = /\[\[(.+)\]\]/g;
    return msgStr.replace(re, (_, p1) => {
      const roll = RollPF.safeRoll(p1, data);
      return roll.total.toString();
    });
  }








}
function setSelectedIndex(s, i) {
  s.options[i - 1].selected = true;
  return;
}

function calculateDamage(data, key, armor, defendroll) {
  var dmgtype = data.dmgtype
  var damage = { stu: 0, wou: 0, mor: 0 };
  let alteredDamage = data.damage
  console.log("\nData\n", data, "\key\n", key, "\narmor\n", armor, "\ndefendroll\n", defendroll)

  // There is no improving damage for Good amazing weapons
  if (data.firepower == "G" && armor.system.firepower == "O");
  if (data.firepower == "A" && armor.system.firepower == "O");

  // Derated Damage 
  //If a character using a weapon of Ordinary firepower gets a successful hit against someone wearing armor with a Good Highness rating* the severity of the primary damage is degraded by one 3 — mortal damage becomes wound damage, wound damage turns and stun damage is negated. Secondary damage is calculated original damage is degraded*
  https://archive.org/details/MyRpgCollection/Alternity_Players_Handbook/page/n190/mode/1up

  // For PC's
  if (!data.contrActor.isSpaceActor) {
    if (data.firepower == "O" && ["G"].includes(armor.system.firepower)) {
      if (data.dmgtype === "stu") dmgtype = null;
      if (data.dmgtype === "wou") dmgtype = "stu";
      if (data.dmgtype === "mor") dmgtype = "wou";
      //console.log("\nData\n" ,data,dmgtype);
    };

    if (data.firepower == "O" && ["A"].includes(armor.system.firepower)) {
      if (data.dmgtype === "stu") dmgtype = null;
      if (data.dmgtype === "wou") dmgtype = null;
      if (data.dmgtype === "mor") dmgtype = "stu";
    };

    if (data.firepower == "G" && armor.system.firepower == "A") {
      if (data.dmgtype === "stu") dmgtype = null;
      if (data.dmgtype === "wou") dmgtype = "stu";
      if (data.dmgtype === "mor") dmgtype = "wou";
    };

  }

  //Damage Grading 
  //https://archive.org/details/MyRpgCollection/Alternity_Warships/page/n14/mode/1up

  let shipToughness = d100A.starshipFirepowerExtra.abbr[data.contrActor.system.frame?.system?.toughness] || "G"
  if (data.contrActor.isSpaceActor) {
    //console.log(d100A.firepowerRating,data.firepower,armor, shipToughness,dmgtype)
    dmgtype = d100A.firepowerRating[data.firepower][shipToughness][dmgtype]
    if (!dmgtype) alteredDamage = 0;
    if (dmgtype) alteredDamage = data.damage * d100A.firepowerMultiplier[data.firepower][shipToughness][data.dmgtype];


  } console.log(dmgtype, alteredDamage, defendroll.total)

  let damageReduced = Math.max(0, defendroll.total)

  //https://archive.org/details/MyRpgCollection/Alternity_Players_Handbook/page/n53/mode/1up

  if (dmgtype === "stu") damage.stu = Math.max(0, alteredDamage - damageReduced);
  if (dmgtype === "wou") {
    damage.stu = Math.floor(Math.max(0, (alteredDamage) / 2))
    damage.wou = Math.max(0, alteredDamage - damageReduced);
  };
  if (dmgtype === "mor") {
    damage.stu = Math.floor(Math.max(0, (alteredDamage) / 2));
    damage.wou = Math.floor(Math.max(0, (alteredDamage) / 2));
    damage.mor = Math.max(0, alteredDamage - damageReduced);
  };
  if (dmgtype === "cri") {
    damage.stu = Math.floor(Math.max(0, (alteredDamage) / 2));
    damage.wou = Math.floor(Math.max(0, (alteredDamage) / 2));
    damage.mor = Math.floor(Math.max(0, (alteredDamage) / 2));
    damage.cri = Math.max(0, alteredDamage - damageReduced);
  };



  //console.log( "\ndamage\n" ,damage  );

  //const attack = data.defenceData.value + " " + data.defenceData.dmgtype + " ("+ data.defenceData.type + ")(" + data.defenceData.firepower+")" ;
  //armorroll = bestdefence + " ([" + ""//defend[bestarmor].formula + "] " ;

  //const rollData = {damage:damage,adjdmgtype:adjdmgtype,attack:attack,armorroll:armorroll,bestdefence:bestdefence,bestroll:defend[bestarmor] };


  return damage;
}



