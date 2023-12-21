// import { PathManager } from "/modules/lib-find-the-path/scripts/pathManager.js";
// import { MinkowskiParameter,PointFactory,Segment } from "/modules/lib-find-the-path/scripts/point.js";
// import {FTPUtility} from "/modules/lib-find-the-path/scripts/utility.js";
let showDragDistance = true;
let handleDragCancel;
let rangeFinder = true;
let ctrlPressed = false;
let altPressed = false;
let dragShift = false;

const TokenSpeedAttributes = {base:"",value:""};
export class DragRuler extends Ruler{
	constructor(user, {color=null}={}) {
		
	    super()
	    this.user = user;
	    this.dragRuler = this.addChild(new PIXI.Graphics());
	    this.ruler = null;
	    this.tokenSpeed = null;
	    this.name = `DragRuler.${user._id}`;

	    this.color = color || this.user.color || 0x42F4E2; 
	    this.tokenSpeed = {walk:null,sprint:null,run:null}
	    canvas.grid.addHighlightLayer(this.name);
		this.totalDistance = 0
  	}
   	clear() {
	    this._state = Ruler.STATES.INACTIVE;
	    this.waypoints = [];
	    this.dragRuler.clear();
	    this.labels.removeChildren().forEach(c => c.destroy());
	    canvas.grid.clearHighlightLayer(this.name);
		//super.clear()
  	}
  	_onDragStart(event) {
		//jhgkjhgjh
	    this.clear();
	    this._state = Ruler.STATES.STARTING;
		console.log(event,this)
	    this._addWaypoint(event.interactionData.origin);
	    this.tokenSpeed = this.getTokenSpeed(this.getToken)
		this.shipHeading = this.getToken.document.rotation
		ui.notifications.info("P: Add Waypoint, X: Remove Waypoint, CTRL: Quick Measure")
	//	console.log("_onDragStart(event) \n",this,this.tokenSpeed,this.getToken)
  	}
  	getTokenSpeed(token){
		
		const walkSpeed = parseFloat(getProperty(token,"actor.system.attributes.speed.walk.value"));
		const runSpeed = parseFloat(getProperty(token,"actor.system.attributes.speed.run.value"));
		const sprintSpeed = parseFloat(getProperty(token,"actor.system.attributes.speed.sprint.value"));
		//console.log(walkSpeed)
		//const bonusSpeed = (TokenSpeedAttributes.bonus != "" && getProperty(token,TokenSpeedAttributes.bonus) !="") ? parseFloat(getProperty(token,TokenSpeedAttributes.bonus)):0;
		//const flagBonusSpeed = 0;//(typeof token.document.getFlag('ShowDragDistance','speed') !='undefined') ? token.document.getFlag('ShowDragDistance','speed').normal:0;
		//const normalSpeed = baseSpeed + flagBonusSpeed;
		//const flagDashSpeed = 1;//(typeof token.document.getFlag('ShowDragDistance','speed') !='undefined') ? token.document.getFlag('ShowDragDistance','speed').dash:0;
		//const dashSpeed = (normalSpeed + flagDashSpeed) * game.settings.get('ShowDragDistance','dashX');
			
		return {walk:walkSpeed,run:runSpeed,sprint:sprintSpeed }
	}
  	_onMouseUp(event) {
		/*
		
		if (ctrlPressed == true && event.){
		ctrlPressed = false;
		if(rangeFinder && canvas.tokens.controlled.length>0){
			rangeFinder = false;
			canvas.controls.ruler._endMeasurement();
			canvas.mouseInteractionManager._deactivateDragEvents()
			canvas.mouseInteractionManager.state = canvas.mouseInteractionManager.states.HOVER
		}
	}
//*/
	//this was in but seems redundant . took it out seemed to make no differance
    	this._endMeasurement();
  	}
  	_onMouseMove(event) {
  		
		//check control key
		//console.log(event)

	    if ( this._state === Ruler.STATES.MOVING ) return;
	   

	   // Extract event data
	    const mt = event.interactionData._measureTime || 0;
	    const ld = event._lastDest || event.interactionData.origin;
	    const {origin, destination} = event.interactionData;
		const originalEvent = event.originalEvent
	//	console.log(event)
	    // Check measurement distance
	    let dx = destination.x - origin.x,
	        dy = destination.y - origin.y;

	  	let [lastX,lastY] = canvas.grid.grid.getGridPositionFromPixels(ld.x,ld.y);
	  	let [x,y] = canvas.grid.grid.getGridPositionFromPixels(destination.x,destination.y);
	   // console.log(ld.x,ld.y)
		//console.log(lastX,lastY)
		//console.log(canvas.grid.grid.getPixelsFromGridPosition(lastX,lastY))
	    // Hide any existing Token HUD
	    canvas.hud.token.clear();
	    delete event.data.hudState;

	    // Draw measurement updates
	    if(lastX != x || lastY !=y  || dragShift){
	    
		    if ( Date.now() - mt > 50) {

		     //if(Math.abs(dx) > canvas.dimensions.size/2 || Math.abs(dy) > canvas.dimensions.size/2){
	        	this.measure(destination, {gridSpaces: !originalEvent.shiftKey});
		        event.interactionData._measureTime = Date.now();
		        event._lastDest = destination
		        this._state = Ruler.STATES.MEASURING;
		    }
	  	}
  	}
  	async measure(destination, {gridSpaces=true}={}) {
		//console.log("dragShift = ",dragShift)
		let movecolor = 0xFFFFFF
  		if(!dragShift)
	    	destination = new PIXI.Point(...canvas.grid.getCenter(destination.x, destination.y));
	    //else
	  
	    const waypoints = this.waypoints.concat([destination]);
	    const r = this.dragRuler;
	    this.destination = destination;
	 
	    // Iterate over waypoints and construct segment rays
	    //console.log("destination \n ", this, destination)
		const segments = [];
	    for ( let [i, dest] of waypoints.slice(1).entries() ) {
			const origin = waypoints[i];
			const label = this.labels.children[i];
			const ray = new Ray(origin, dest);
			
			if ( ray.distance < (0.2 * canvas.grid.size) ) {
				if ( label ) label.visible = false;
				continue;
			}
			segments.push({ray, label});
		}
		// Clear the grid highlight layer
	    const hlt = canvas.grid.highlightLayers[this.name];
	    hlt.clear();

	    // Draw measured path
	    r.clear();
		let nDiagonals = 0;
		let totalDistance = 0;
 		const rule = canvas.grid.diagonalRule;
	  
		 //console.log("segments",segments,canvas.grid.type)
	  	for (let i = 0; i <segments.length;i++){

	  		let s = segments[i];
		    let {ray, label, last} = s;

		  	let line;
		 	let ignoreTerrain = (typeof this.getToken.ignoreTerrain != 'undefined') ? this.getToken.ignoreTerrain:false;
			 //console.log("segments",s)
			if(canvas.grid.type > 1){
				//console.log("Hex Grid")
	      		let grid0 = canvas.grid.grid.getGridPositionFromPixels(s.ray.A.x,s.ray.A.y);
	      		let grid1 = canvas.grid.grid.getGridPositionFromPixels(s.ray.B.x,s.ray.B.y);

	      		//let hex0 = canvas.grid.grid.offsetToCube({row:grid0[0],col:grid0[1]});
		      	//let hex1 = canvas.grid.grid.offsetToCube({row:grid1[0],col:grid1[1]});

	      		let hex0 = Coord.offsetToCube({row:grid0[0],col:grid0[1]});
		      	let hex1 = Coord.offsetToCube({row:grid1[0],col:grid1[1]});


		      	//console.log("HEX",grid0,grid1,hex0,hex1)
		      	hex0 =  await new Hex(hex0.q,hex0.r,hex0.s);
		      	//console.log("HEX",grid0,grid1,hex0,hex1)
				//console.log("segments",hex0.q,hex0.r,hex0.s)
		      	line = hex0.linedraw(hex1,totalDistance,ignoreTerrain)

				  
		      	
			}else if(canvas.grid.type == 1){
				let p0 = canvas.grid.grid.getGridPositionFromPixels(s.ray.A.x,s.ray.A.y)
				let p1 = canvas.grid.grid.getGridPositionFromPixels(s.ray.B.x,s.ray.B.y)
				
				line = grid_line({row:p0[0],col:p0[1]},{row:p1[0],col:p1[1]},totalDistance,nDiagonals,ignoreTerrain)
			}
			else {
				//console.log("No Grid")
				let p0 = getGridPositionFromPixelsNogrid(s.ray.A.x,s.ray.A.y)
				let p1 = getGridPositionFromPixelsNogrid(s.ray.B.x,s.ray.B.y)
				
				line = grid_line({row:p0[0],col:p0[1]},{row:p1[0],col:p1[1]},totalDistance,nDiagonals,ignoreTerrain,true)
				//console.log("\n\n Measure",segments,line,totalDistance,"\n\n p0,p1 ",p0,p1)
			}
			
		    nDiagonals = line[line.length-1].nDiagonals;
		    s.distance = line.reduce((sum,val)=>{return sum + val.distance},0)
		    totalDistance += s.distance;
		    s.last = i === (segments.length - 1);
		    s.text = this._getSegmentLabel(s, totalDistance);
		    // Draw line segment
	    	r.lineStyle(6, 0x000000, 0.5).moveTo(s.ray.A.x, s.ray.A.y).lineTo(s.ray.B.x, s.ray.B.y)
	        .lineStyle(4, this.color, 0.25).moveTo(s.ray.A.x, s.ray.A.y).lineTo(s.ray.B.x, s.ray.B.y);
	        // Draw the distance label just after the endpoint of the segment
			
			const token = await this._getMovementToken();
			let tokenSpeed = token.actor.system.attributes.speed
			let tokenAccel = token.actor.system.attributes.accel?.value

			//console.log("Label ",label,this.color,token)
			movecolor = 0x00FF00
	    	if ( label ) {
				label.text = s.text;
				if (token.actor.system.type ==="character") {
					if (totalDistance > tokenSpeed.sprint.value) movecolor = 0xff0000;
					else if (totalDistance > tokenSpeed.run.value) movecolor = 0xff8000,label.text += "\n Sprint (+3)";
					else if (totalDistance > tokenSpeed.walk.value) movecolor = 0xBBFF00,label.text += "\n Run (+2)";
					
					
				}
				if (token.actor.system.type ==="starship") 
				{
					if (totalDistance < tokenSpeed.value - tokenAccel ) movecolor = 0xff8000,label.text += "\n Underspeed";
					else if (totalDistance > tokenSpeed.value + tokenAccel) movecolor = 0xff0000,label.text += "\n Overspeed";
					else movecolor = 0xBBFF00;
				}
				label.tint = movecolor
	    		
	        	label.alpha = s.last ? 1.0 : 0.5;
	        	label.visible = true;
	        	let labelPosition = ray.project((ray.distance + 50) / ray.distance);
	        	label.position.set(labelPosition.x, labelPosition.y);
	    	}

		   	this._highlightMeasurement(line);

			   if (token.actor.system.type ==="starship") aligntoken(token,line);
			async function aligntoken(token,line){
			let lastpoint =line.length-1	
			//let hex0 = canvas.grid.grid.offsetToCube({row:line[0].row,col:line[0].col});
			//let hex1 = canvas.grid.grid.offsetToCube({row:line[lastpoint].row,col:line[lastpoint].col});
			let hex0 = Coord.offsetToCube({row:line[0].row,col:line[0].col});
			let hex1 = Coord.offsetToCube({row:line[lastpoint].row,col:line[lastpoint].col});


			//console.log(line,token,hex0,hex1)
			//document.data.rotation

			//const updated = await token.document.update({rotation:ray.angle*180/Math.PI+90})  //ghost
			//console.log(token)
			if (token.actor.isSpaceActor){
			token._preview.document.rotation = ray.angle*180/Math.PI+90

			}
		}


			
		}
		for ( let p of waypoints ) {
	    	r.lineStyle(2, 0x000000, 0.5).beginFill(this.color, 0.25).drawCircle(p.x, p.y, 8);
	  	}
		//console.log("segments",segments)
	//	console.log(this,totalDistance)
		this.totalDistance = totalDistance
	    return segments;
	   
  	}
//tokenSpeed

  	_getMovementToken() {
  		
	    let [x0, y0] = Object.values(this.waypoints[0]);
	    const tokens = new Set(canvas.tokens.controlled);
	    
	    if ( !tokens.size && game.user.character ) {
	      const charTokens = game.user.character.getActiveTokens();
	      if ( charTokens.length ) tokens.add(...charTokens);
	    }
	    if ( !tokens.size ) return null;
	   
	    let x = Array.from(tokens).find(t => {
	      let pos = new PIXI.Rectangle(t.x - 1, t.y - 1, t.w + 2, t.h + 2);
	      return pos.contains(x0, y0);
	    })
	    
	    return x
  	}
  	_highlightMeasurement(line){
		let color = 0x00ff00; //this.color;
  		//let remainingSpeed = (this.tokenSpeed.walk != null) ? this.tokenSpeed.walk:null;
	    //let dashSpeed = (this.tokenSpeed.run !== null) ? this.tokenSpeed.run: null;
	 	//let maxSpeed = remainingSpeed;

	 	if(canvas.grid.type > 1){
			//console.log("LINE \n",line)
			for(let i=0;i<line.length;i++){
				//let tempA = 1
				//let ygh = Math.floor(line[i].row * -0.5) +  line[i].col  ///line.AStarPath.path[i].center.x
				//let xgh = 0 - Math.floor(line[i].row * 0.75) - Math.floor(line[i].col * 0.5) ///line.AStarPath.path[i].center.y
				//let a = canvas.grid.grid.getPixelsFromGridPosition(xgh,ygh)
				let a = canvas.grid.grid.getPixelsFromGridPosition(line[i].row,line[i].col)
				//console.log(xgh,ygh,a)
				canvas.grid.highlightPosition(this.name, {x: a[0], y: a[1], color: color});
				//canvas.grid.highlightPosition(this.name, {x: line[i].col, y: line[i].row, color: color});
			}
		}
		else{
		
	 	
	 	 for(let i=0;i<line.length;i++){

			/*if(line[i].travelled > remainingSpeed) {
				if(game.settings.get('ShowDragDistance','dash') && line[i].travelled < remainingSpeed + maxSpeed){		
					color = Color.from(game.settings.get('ShowDragDistance','dashSpeedColor'))
				}else if(game.settings.get('ShowDragDistance','dash') == false ||  line[i].travelled > remainingSpeed + maxSpeed){
					color = (game.settings.get('ShowDragDistance','maxSpeedColor'))
				}
			}
      			*/

				if(line[i].travelled > this.tokenSpeed.walk) {
					//console.log("yellow")
					color = 0xBBFF00;
				}
				if(line[i].travelled > this.tokenSpeed.run) {
					//console.log("orange")
					color = 0xff8000;
				}
				if(line[i].travelled > this.tokenSpeed.sprint) {
					//console.log("red")
					color = 0xff0000;
				}
			
      			
	    	let [xgh, ygh] = canvas.grid.grid.getPixelsFromGridPosition(line[i].row, line[i].col);
	        let a = canvas.grid.highlightPosition(this.name, {x: xgh, y: ygh, color: color});
			canvas.grid.highlightPosition(this.name, {x: -10, y: 10, color: 0xff0000})
			canvas.grid.highlightPosition(this.name, {x: 1100, y: 300, color: 0x00ff00})
			canvas.grid.highlightPosition(this.name, {x: 500, y: -500, color: 0xff0000})
			//console.log(xgh," \n ",ygh,"\n",line,"\n",color,"\nThis: ",this,"\n",a,"\n",this.name)
			//console.log(xgh," /n ",ygh," \n",token.x," \n ",token.y," \n ",this,"\n",a,"\n",this.name)
			}
		}
  	}
 
  
  	_addWaypoint(point) {
	    //const center = canvas.grid.getCenter(point.x, point.y);
	    this.waypoints.push(new PIXI.Point(point.x, point.y));
	    //this.labels.addChild(new PIXI.Text("", CONFIG.canvasTextStyle));
		this.labels.addChild(new PreciseText("", CONFIG.canvasTextStyle));
		
	}
  	async moveToken(dragShift=false) {
  		
	    let wasPaused = game.paused;
	    if ( wasPaused && !game.user.isGM ) {
	      ui.notifications.warn(game.i18n.localize("GAME.PausedWarning"));
	      return false;
	    }
	    if ( !this.visible || !this.destination ) return false;

	    const token = this._getMovementToken();
	 
	    if ( !token ) return;

	    // Determine offset relative to the Token top-left.
	    // This is important so we can position the token relative to the ruler origin for non-1x1 tokens.
	    let origin;
	    /*if(!dragShift && canvas.scene.data.gridType !== 0)
	    	origin = canvas.grid.getTopLeft(this.waypoints[0].x, this.waypoints[0].y);
	    else*/
	    	
    	origin = [this.waypoints[0].x , this.waypoints[0].y]
	    let s2 = canvas.dimensions.size / 2;
		
	    
	    let dx = Math.round((token.document.x - origin[0]) / s2) * s2;
	    let dy = Math.round((token.document.y - origin[1]) / s2) * s2;
	   
	    if(dragShift == false && canvas.scene.grid.type !== 0){
	    	dx = (dx > -70) ? 0:dx - (dx%canvas.dimensions.size);
	    	dy = (dy > -70) ? 0:dy - (dy%canvas.dimensions.size);
	    }
	   
	    // Get the movement rays and check collision along each Ray
	    // These rays are center-to-center for the purposes of collision checking
		const rays = this.dragRulerGetRaysFromWaypoints(this.waypoints, this.destination);
	   // let hasCollision = rays.some(r => CONFIG.Canvas.losBackend.testCollision(r.A, r.B, {origin: r.A, type: "move", mode: "any"}));
		let hasCollision = rays.some(r => CONFIG.Canvas.polygonBackends.move.testCollision(r.A,r.B, {origin: r.A, type: "move", mode: "any"}));

		//Canvas.polygonBackends.move.getRayCollisions

		/* from Foundary.js
		checkCollision(ray, options={}) {
			const msg = "WallsLayer#checkCollision is obsolete."
			  + "Prefer calls to testCollision from CONFIG.Canvas.polygonBackends[type]";
			foundry.utils.logCompatibilityWarning(msg, {since: 11, until: 13});
			return CONFIG.Canvas.losBackend.testCollision(ray.A, ray.B, options);
		  }
		*/  

		if ( hasCollision && game.user.isGM) ui.notifications.info("GM Collision")
	    if ( hasCollision && !game.user.isGM ) {
	   	  this._endMeasurement();
	      ui.notifications.error(game.i18n.localize("ERROR.TokenCollide"));
	      return;
	    }

	    // Execute the movement path.
	    // Transform each center-to-center ray into a top-left to top-left ray using the prior token offsets.
	    this._state = Ruler.STATES.MOVING;
	    token._noAnimate = true;
	   
	    for ( let r of rays ) {
					//angle sets the hex grid angle to 0,60,120 etc
					
					if (token.actor.isSpaceActor){
					let angle = Math.round((r.angle*180/Math.PI+90)/60)*60
					const updated = await token.document.update({rotation:angle})
					console.log(token,updated,angle)
					//mnbvnbv
					}
					//token._preview.document.rotation = ray.angle*180/Math.PI+90	
	      if ( !wasPaused && game.paused ) break;
	      let dest;
	      if(!dragShift && canvas.scene.grid.type !== 0)
	      	dest = canvas.grid.getTopLeft(r.B.x , r.B.y );
	      else
	      	dest = [r.B.x,r.B.y]
	      
	    	
	      const path = new Ray({x: token.x, y: token.y}, {x: dest[0]+dx , y: dest[1]+dy});
	      
	      await token.document.update(path.B);
		  //await token.animate(path);
		  //await this._animateMovement(token);
	      //await token.animateMovement(path);
	      
	    }
		console.log(rays,this.waypoints)
	    Hooks.call('DragRuler.moveToken', token, this)
	    token._noAnimate = false;
	    
	    // Once all animations are complete we can clear the ruler
	    this._endMeasurement();
		canvas.grid.borders.removeChildren(canvas.grid.borders.children.length-1)  //ghost
		
		// AAAHHH this is needed otherwise the dragged token leaves behind a "preview token" //ghost
		token._preview.destroy();
	//	console.log(this)
		token.actor.update({["system.attributes.speed.value"]: this.totalDistance});
		//console.log(token.isPreview,canvas.tokens.ownedTokens[0],"\n",canvas.tokens.ownedTokens[0]._preview)
		
  	}
	toJSON() {
	    return {
	      class: "DragRuler",
	      name: `DragRuler.${game.user._id}`,
	      waypoints: this.waypoints,
	      destination: this.destination,
	      _state: this._state,
	      speed:this.tokenSpeed
	    }
 	}
 	_endMeasurement() {
 		
	    this.clear();
	    game.user.broadcastActivity({dragruler: null});
	    canvas.mouseInteractionManager.state = MouseInteractionManager.INTERACTION_STATES.HOVER;
  	}

  	/* -------------------------------------------- */
  	get getToken(){
  		return canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled[0]:null;
  	}
  	/**
	   * Update a Ruler instance using data provided through the cursor activity socket
	   * @param {Object} data   Ruler data with which to update the display
   	*/
  	update(data) {
  		
	    if ( data.class !== "DragRuler" ) throw new Error("Unable to recreate Ruler instance from provided data");

	    // Populate data
	    this.waypoints = data.waypoints;
	    this.destination = data.destination;
	    this._state = data._state;
	    this.tokenSpeed = data.speed;
	    // Ensure labels are created
	    for ( let i=0; i<this.waypoints.length - this.labels.children.length; i++) {
	      this.labels.addChild(new PIXI.Text("", CONFIG.canvasTextStyle));
	    }

	    // Measure current distance
	    if ( data.destination ) this.measure(data.destination,{});
		//super.update(data);

  	}
  	static patchFunction(func, line_number, line, new_line) {
		let funcStr = func.toString()
		let lines = funcStr.split("\n")
		if (lines[line_number].trim() == line.trim()) {
			let fixed = funcStr.replace(line, new_line)
			return Function('"use strict";return (function ' + fixed + ')')();
		}
		return func;
	}

	/**
 * Modifies the given HTML to render additional resource input fields.
 * @param {waypoints} Array ?.
 * @param {destination} html The jQuery element of the token HUD.
 * @returns {ray} 
 */
	 dragRulerGetRaysFromWaypoints(waypoints, destination) {
		if (destination) waypoints = waypoints.concat([destination]);
		return waypoints.slice(1).map((wp, i) => {
			const ray = new Ray(waypoints[i], wp);
			ray.isPrevious = Boolean(waypoints[i].isPrevious);
			
			return ray;
		});
	}

	static init() {
		// CONFIG.debug.hooks = true;
		// CONFIG.debug.mouseInteraction = true;
		console.log("INIT")
	/* 	game.settings.register("Alternityd100", 'enabled', {
			name: "ShowDragDistance.enable-s",
			hint: "ShowDragDistance.enable-l",
			scope: "client",
			config: true,
			default: true,
			type: Boolean
	      //onChange: x => window.location.reload()
	    });  */
	  /*  game.settings.register("Alternityd100", 'rangeFinder', {
	      name: "ShowDragDistance.rangeFinder-s",
	      hint: "ShowDragDistance.rangeFinder-l",
	      scope: "client",
	      config: true,
	      default: true,
	      type: Boolean
	     // onChange: x => window.location.reload()
	    });*/
	  /*  game.settings.register("Alternityd100", 'baseSpeedAttr', {
	      name: "ShowDragDistance.baseSpeedAttr-s",
	      hint: "ShowDragDistance.baseSpeedAttr-l",
	      scope: "world",
	      config: true,
	      default: "actor.system.attributes.speed.walk",
	      type: String,
	      onChange: x => window.location.reload()
	    });*/
	   /* game.settings.register('Alternityd100', 'bonusSpeedAttr', {
	      name: "ShowDragDistance.bonusSpeedAttr-s",
	      hint: "ShowDragDistance.bonusSpeedAttr-l",
	      scope: "world",
	      config: true,
	      default: "actor.system.attributes.speed.walk",
	      type: String,
	      onChange: x => window.location.reload()
	    });
	    game.settings.register("Alternityd100", 'maxSpeed', {
			name: "ShowDragDistance.maxSpeed-s",
			hint: "ShowDragDistance.maxSpeed-l",
			scope: "world",
			config: true,
			default: true,
			type: Boolean
	      //onChange: x => window.location.reload()
	    });
	    game.settings.register("Alternityd100", 'maxSpeedColor', {
			name: "ShowDragDistance.maxSpeedColor-s",
			hint: "ShowDragDistance.maxSpeedColor-l",
			scope: "client",
			config: true,
			default: '#FF0000',
			type: String
	      //onChange: x => window.location.reload()
	    });
	    game.settings.register("Alternityd100", 'dash', {
			name: "ShowDragDistance.dash-s",
			hint: "ShowDragDistance.dash-l",
			scope: "world",
			config: true,
			default: true,
			type: Boolean
	      //onChange: x => window.location.reload()
	    });
	    game.settings.register("Alternityd100", 'dashX', {
			name: "ShowDragDistance.dashX-s",
			hint: "ShowDragDistance.dashX-l",
			scope: "world",
			config: true,
			default: 1,
			type: Number
	      //onChange: x => window.location.reload()
       });
	   game.settings.register("Alternityd100", 'dashSpeedColor', {
			name: "ShowDragDistance.dashSpeedColor-s",
			hint: "ShowDragDistance.dashSpeedColor-l",
			scope: "client",
			config: true,
			default: '#00FF00',
			type: String
	      //onChange: x => window.location.reload()
	    });*/
	  	// game.settings.register('ShowDragDistance', 'showPathDefault', {
	   //    name: "ShowDragDistance.showPath-s",
	   //    hint: "ShowDragDistance.showPath-l",
	   //    scope: "client",
	   //    config: true,
	   //    default: true,
	   //    type: Boolean
	   //   // onChange: x => window.location.reload()
	   //  });
	   //TokenSpeedAttributes.base = game.settings.get('Alternityd100','baseSpeedAttr');
	   //TokenSpeedAttributes.bonus = (game.settings.get('Alternityd100','bonusSpeedAttr') !== '') ? game.settings.get('Alternityd100','bonusSpeedAttr'):"";

	   let _handleUserActivity = Users._handleUserActivity;
	   	Users._handleUserActivity = function(userId, activityData={}){
	   		
	   		let user2 = game.users.get(userId);
	   		let active2 = "active" in activityData ? activityData.active : true;
	   		// DragRuler measurement
	   		if ( (active2 === false) || (user2.viewedScene !== canvas.scene.id) ) {
	   			canvas.controls.updateDragRuler(user2, null);
	   		}
		    if ( "dragruler" in activityData ) {
		      canvas.controls.updateDragRuler(user2, activityData.dragruler);
		    }
		    _handleUserActivity(userId,activityData)
		}
	 	
	
	    ControlsLayer.prototype.drawDragRulers = function() {
		    this.dragRulers = this.addChild(new PIXI.Container());
	//	console.log( "game.users" ,game.users)
		    for (let u of game.users) {
		      let dragRuler = new DragRuler(u);
		      this._dragRulers[u._id] = this.dragRulers.addChild(dragRuler);
		    }
		}
		ControlsLayer.prototype.getDragRulerForUser = function(userId) {
		  return this._dragRulers[userId] || null;
		}
		ControlsLayer.prototype.updateDragRuler = function(user, dragRulerData) {
			if ( user === game.user) return;
		    // Update the Ruler display for the user
		    let dragRuler = this.getDragRulerForUser(user.id);
		    if ( !dragRuler ) return;
		    if ( dragRulerData === null ) dragRuler.clear();
		    else dragRuler.update(dragRulerData);
	  	}
		
//this overrides the function called when a token is dragged, this upps to Placeable Object._onDragStart

		let oldOnDragLeftStart = Token.prototype._onDragLeftStart;
		Token.prototype._onDragLeftStart = function(event){
			
			//if(game.settings.get('Alternityd100','enabled') === true && typeof this.document.flags['pick-up-stix'] == 'undefined' && canvas.tokens.controlled.length==1){
				event.interactionData.origin = {x:this.x+(canvas.dimensions.size/2),y:this.y+(canvas.dimensions.size/2)};
				//event.data.origin = this.center;
				
				canvas.controls.dragRuler._onDragStart(event)  //start the drag ruler
				
			//}

			//console.log("oldOnDragLeftStart",oldOnDragLeftStart)
			oldOnDragLeftStart.apply(this,[event])
			

		}
		let oldOnDragLeftMove = Token.prototype._onDragLeftMove;
		Token.prototype._onDragLeftMove = function(event){
			
			if(canvas.controls.dragRuler.active  && typeof this.document.flags['pick-up-stix'] == 'undefined'){
				canvas.controls.dragRuler._onMouseMove(event,this)
				
				if(!this.document.hidden && game.user.isGM && altPressed){
					const dragruler = (canvas.controls.dragRuler._state > 0) ? canvas.controls.dragRuler.toJSON() : null;
					game.user.broadcastActivity({dragruler:dragruler})
				}else if(!game.user.isGM) {
					const dragruler = (canvas.controls.dragRuler._state > 0) ? canvas.controls.dragRuler.toJSON() : null;
					game.user.broadcastActivity({dragruler:dragruler})
				}

				
			}
			
			oldOnDragLeftMove.apply(canvas.tokens.controlled[0],[event])
			
		}
		let oldOnDragLeftDrop = Token.prototype._onDragLeftDrop;
		Token.prototype._onDragLeftDrop = function(event){
		//	if(game.settings.get('Alternityd100','enabled') && canvas.controls.dragRuler.active ){
				
				for ( let c of this.layer.preview.children ) {
			      const o = c._original;
			      if ( o ) {
			        o.document.locked = false;
			        o.alpha = 1.0;
			      }
			    }
			    this.layer.preview.removeChildren();  //ghost ?????????  removed
				//console.log("Drop",this,this.layer.preview,this.layer,dragShift)
				
				if(typeof this.document.flags['pick-up-stix'] == 'undefined' ){
					const dragruler = (canvas.controls.dragRuler._state > 0) ? canvas.controls.dragRuler.toJSON() : null;
					canvas.controls.dragRuler.moveToken(dragShift)
					canvas.controls.dragRuler._onMouseUp(event)
					canvas.controls.dragRuler._endMeasurement();
					canvas.controls.dragRuler._state = 0;
					//console.log("-----------End------", this)
					//canvas.controls.dragRuler.FTPUtility.traverse(0,0,0);
				}
				return false;
			//}else{
			//	oldOnDragLeftDrop.apply(this,[event]);
			//}
		}
		let oldOnDragLeftCancel = Token.prototype._onDragLeftCancel;
		Token.prototype._onDragLeftCancel = function(event){
			event.stopPropagation();
			
			
			oldOnDragLeftCancel.apply(this,[event])
			
		}
		let handleDragCancel = MouseInteractionManager.prototype._handleDragCancel;
		MouseInteractionManager.prototype._handleDragCancel = function(event){
			
			if((typeof this.object.system != 'undefined') && typeof this.object.system.flags['pick-up-stix'] == 'undefined'){
				if( canvas.tokens.controlled.length > 0 && canvas.tokens.controlled[0].mouseInteractionManager.state == 3 ){
					switch(event.button){
						case 0:
						
							handleDragCancel.apply(this,[event])
							break;
						case 2:
							const point = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.tokens);
							if(!dragShift){
								const center = canvas.grid.grid.getCenter(point.x,point.y)
								canvas.controls.dragRuler._addWaypoint(new PIXI.Point(center[0], center[1]));
							}else{
								canvas.controls.dragRuler._addWaypoint(new PIXI.Point(point.x,point.y));
							}
							
							break;
						default:
							handleDragCancel.apply(this,[event])
							break;
					}
			 	}else{
			 		handleDragCancel.apply(this,[event])
			 	}
			}else{
				handleDragCancel.apply(this,[event])
			}
		}
	}
}

//Hooks.on('init', DragRuler.init);


Hooks.on('ready',()=>{
	console.log("\n\n Here Hooks.on('init', DragRuler.init); \n\n\n\n")
	Object.defineProperty(canvas.controls,'dragRuler',  {
	    get() {
	       return canvas.controls.getDragRulerForUser(game.user._id);
		}}
	);
	canvas.controls.dragRulers = null;
	canvas.controls._dragRulers = {};
	canvas.controls.drawDragRulers();

	$('body').on('keydown',(e)=>{
		if (e.ctrlKey) {
			console.log("The CTRL key was pressed!",e);
		  } else {
			//console.log("The ",e.key," key was pressed! \n ",e);
		  }
		switch(e.which){
			case 17:
				ctrlPressed = true;
				if(canvas.controls.dragRuler.active == false && e.originalEvent.location == 1 && !rangeFinder && canvas.tokens.controlled.length>0 && /*game.settings.get('ShowDragDistance','rangeFinder')*/ true === true && canvas.mouseInteractionManager.state !=0 && game.activeTool !='ruler'){
					rangeFinder = true;
					canvas.controls.ruler._state = Ruler.STATES.MEASURING;
					canvas.controls.ruler._addWaypoint(canvas.tokens.controlled[0].center)
					canvas.mouseInteractionManager.state = canvas.mouseInteractionManager.states.DRAG
					canvas.mouseInteractionManager._activateDragEvents()
					e.data = {originalEvent:e.originalEvent,origin:canvas.tokens.controlled[0].center,destination:canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.tokens)}
					canvas.controls.ruler._onMouseMove(e)
					canvas.mouseInteractionManager._dragRight = false;
					console.log("The CTRL key was pressed!");
				}
				break;
			case 18:
				altPressed = true;
				break;
			// X pressed 	
			case 88:
				if(canvas.controls.dragRuler.waypoints.length>1)
					canvas.controls.dragRuler._removeWaypoint(canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.tokens))
				else if(canvas.controls.dragRuler.waypoints.length==1){
					canvas.controls.dragRuler._removeWaypoint(canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.tokens))
					for ( let c of canvas.tokens.controlled[0].layer.preview.children ) {
					      const o = c._original;
					      if ( o ) {
					        o.data.locked = false;
					        o.alpha = 1.0;
					      }
					    }
						console.log("this")
			    	canvas.tokens.controlled[0].preview.removeChildren();
					canvas.controls.dragRuler._onMouseUp(e)
					canvas.mouseInteractionManager.state = 1;
					canvas.tokens.controlled[0].mouseInteractionManager.state = 0
					canvas.tokens.controlled[0]._onDragLeftCancel(e)
					//oldOnDragLeftCancel.apply(canvas.tokens.controlled[0],[event])
				}
				break;
				// P key pressed adds a waypoint
			case 80:
				console.log(e,canvas.tokens)
				if(canvas.controls.dragRuler.active){
					canvas.controls.dragRuler._addWaypoint(canvas.mousePosition)  //this was changed see below != multi moves
				
				//	canvas.controls.dragRuler._addWaypoint(canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.tokens))
				}
				break;

			// Escape Pressed	
			case 27:
				if(canvas.tokens.controlled.length > 0) {
					for ( let c of canvas.tokens.controlled[0].layer.preview.children ) {
				      const o = c._original;
				      if ( o ) {
				        o.data.locked = false;
				        o.alpha = 1.0;
				      }
				    }
					canvas.tokens.controlled[0].layer.preview.removeChildren();
					canvas.controls.dragRuler._onMouseUp(e)
					canvas.mouseInteractionManager.state = 1;
					canvas.tokens.controlled[0].mouseInteractionManager.state = 0
					canvas.tokens.controlled[0]._onDragLeftCancel(e);
					canvas.tokens.controlled[0].release()
						    // Once all animations are complete we can clear the ruler
							//this._endMeasurement();
							canvas.grid.borders.removeChildren(canvas.grid.borders.children.length-1)
							
							// AAAHHH this is needed otherwise the dragged token leaves behind a "preview token"
							token._preview.destroy();
				}
				break;
			case 16:
				dragShift= true;
				break;
			default:
				break;
		}
	})
	$('body').on('keyup',(e)=>{
		switch(e.which){
			case 17:
				ctrlPressed = false;
				if(rangeFinder && canvas.tokens.controlled.length>0){
					rangeFinder = false;
					canvas.controls.ruler._endMeasurement();
					canvas.mouseInteractionManager._deactivateDragEvents()
					canvas.mouseInteractionManager.state = canvas.mouseInteractionManager.states.HOVER
				}
				break;
			case 18:
				altPressed = false;
				if(canvas.controls.dragRuler.active){
				
						game.user.broadcastActivity({dragruler:null})
				}
				break;
			case 16:
				dragShift= false;
				break;
			default:
				break;
		}
	})

	//*/
})
Hooks.on('canvasReady', ()=>{
	canvas.controls.dragRulers = null;
 	canvas.controls._dragRulers = {};
 	canvas.controls.drawDragRulers();
})
Hooks.on('updateUser', (user,data,diff, id)=>{
	canvas.controls.getDragRulerForUser(data._id).color = colorStringToHex(data.color);
})




/*function getSquaresInLine (start, end) {
   
    // Translate coordinates
    var x1 = start[0] || start.x || 0;
    var y1 = start[1] || start.y || 0;
    var x2 = end[0] || end.x || 0;
    var y2 = end[1] || end.y || 0;
    var pointsArray = new Array();
    console.log(x1,y1)
    console.log(x2,y2)
    // Define differences and error check
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    console.log(dx,dy)
    // var sx,sy;
  
    // 	 sx = (x1 < x2) ? 1 : -1;
    // 	 sy = (y1 < y2) ? 1 : -1;
    
    // var err = dx - dy;
    // let originDist = 0;
    // // Main loop
    // while (!((x1 == x2) && (y1 == y2))) {
    //     var e2 = err << 1;
    //     if (e2 > -dy) {
    //         err -= dy;
    //         x1 += sx;
    //     }
    //     if (e2 < dx) {
    //         err += dx;
    //         y1 += sy;
    //     }
    //     originDist+= 1;
    //     // Set coordinates
    //     pointsArray.push({x:x1,y: y1,gridDist:originDist});
    // }
    let ray = new Ray({x:x1,y:y1},{x:x2,y:y2})
    // Return the result
    return pointsArray;
}
function measureDistancesWithDifficultTerrain(segments) {
 	let size = canvas.dimensions.size;
 	let distances = segments.map((segment)=>{
 		let [startY,startX] = canvas.grid.grid.getGridPositionFromPixels(segment.ray.A.x,segment.ray.A.y)
 		let [endY,endX] = canvas.grid.grid.getGridPositionFromPixels(segment.ray.B.x,segment.ray.B.y)
 		let squares = getSquaresInLine([startX,startY],[endX,endY])
 		let totalDistance = 0;
 		let nDiagonals = 0;
 		const rule = canvas.grid.diagonalRule;
 		
		for (let i = 0; i < squares.length;i++){
			let {x,y} = squares[i];
			let gridDistance = canvas.scene.data.gridDistance
			
			let lastX,lastY;
			if(i!==0){
    			lastX = squares[i-1].x;
    			lastY = squares[i-1].y;
    		}else{
    			lastY = startY;
    			lastX = startX;
    		}
    		
			let dx = Math.abs(lastX - x);
			let dy = Math.abs(lastY - y);
			let nd = Math.min(dx, dy);
			
			if(nd > 0 && canvas.grid.diagonalRule == '5105'){
				nDiagonals++;
				if(Math.floor(nDiagonals%2)==0){
					gridDistance = gridDistance * 2;
				}
			}
			
				
			if(typeof canvas.terrain?.costGrid[y]?.[x] != 'undefined'){
	    		let point = canvas.terrain.costGrid[y][x];
	    		squares[i].dist = (point.multiple * gridDistance);
	    		totalDistance += (point.multiple * gridDistance)
	    	}else{
	    		squares[i].dist = gridDistance;
	    		totalDistance += gridDistance;
	    	}
	    	
	    	//return totalDistance
	    	
		}	
		return {totalDistance,squares}
 		
 		
 	})
 	
 	return distances;
};*/

  /* -------------------------------------------- */

  /**
   * Get the text label for a segment of the measured path
   * @param {RulerMeasurementSegment} segment
   * @param {number} totalDistance
   * @returns {string}
   * @protected
   */
   function _getSegmentLabelNogrid(segment, totalDistance) {
    const units = canvas.scene.grid.units;
    let label = `${Math.round(segment.distance * 100) / 100} ${units}`;

    if ( segment.last ) label += ` [${Math.round(totalDistance * 100) / 100} ${units}]`;
    return label;
  }


  /**
   * Given a pair of pixel coordinates, return the grid position as an Array.
   * Always round down to the nearest grid position so the pixels are within the grid space (from top-left).
   * @param {number} x    The x-coordinate pixel position
   * @param {number} y    The y-coordinate pixel position
   * @return {number[]}   An array representing the position in grid units
   */

  function getGridPositionFromPixelsNogrid(x, y) {
    let gs = canvas.dimensions.size/canvas.dimensions.distance;
	//console.log(x, y)
    return [Math.floor(y / gs), Math.floor(x / gs)];
  }

  /**
   * Given a pair of pixel coordinates, return the grid position as an Array.
   * Always round down to the nearest grid position so the pixels are within the grid space (from top-left).
   * @param {number} p0    The starting Picel row: column
   * @param {number} p1    The endind Picel row: column
   * @param {number} totalDistance  totalDistance=0
   * @return {number[]}   An array representing the position in grid units
   */


function grid_line(p0, p1, totalDistance=0, nDiagonals=0,ignoreTerrain=false,isNoGrid=false) {
    if (isNoGrid){
		var dx = p1.col-p0.col, 
    	dy = p1.row-p0.row;
		var p = {row:p0.row,col: p0.col,distance:0,nDiagonals:0,travelled:0};  //defines point[0] 
		var points = [p]; //defines point[0] 
		let travelled = totalDistance;
		let dist = Math.round(Math.sqrt(dx*dx+dy*dy))

		if (dist >1){

    	travelled+=dist;
    	points.push({row:p1.row,col: p1.col,distance:dist,nDiagonals:0,travelled:travelled})
	}
		return points;
	}
	if (!isNoGrid){
	//find the distance between 2 points
	var dx = p1.col-p0.col, 
    	dy = p1.row-p0.row;

    var nx = Math.abs(dx), ny = Math.abs(dy);
    //var sign_x = dx > 0? 1 : -1, sign_y = dy > 0? 1 : -1;
    
	let N = Math.max(nx,ny); // N longest number of squares
    let divN = (N==0) ? 0.0 :1.0 / N; // divN = 1/ Longest distance

    let xStep = dx * divN;   // 1 if longest short/long if short
    let yStep = dy * divN;
	
    var p = {row:p0.row,col: p0.col,distance:0,nDiagonals:0,travelled:0};  //defines point[0] 
	//console.log(dx, dy, divN, xStep,yStep,p)
    var points = [p]; //defines point[0] 
    
    let col = p0.col;
    let row = p0.row;
    let travelled = totalDistance; //defines initial travelled dist 
    for(let i = 0;i < N;i++){ // longest x or y distance to move iterates number of squares to move
    	col+=xStep;    //increment 1 square for max dist or % if shorter
    	row+=yStep;
    	
    	let rCol = Math.round(col);  //rcol rounds to move the token
    	let rRow = Math.round(row);
    	
    	let dist = canvas.dimensions.distance; // this is 2m for alternity

		// Removed as dnd / pathfinder
		//console.log(game.system.id,canvas.grid.diagonalRule)
		if((game.system.id == 'Alternityd100' && canvas.grid.diagonalRule == '5105')){
    		
    	
    		let dx2 = Math.abs(points[i].col - rCol);
			let dy2 = Math.abs(points[i].row - rRow);
			let nd = Math.min(dx2, dy2);
		
    		if(nd>0){
    			nDiagonals++;
				if(nDiagonals%2==0){
					dist = dist * 2;
				}
    		}
    	}


// Terrain---------------------------
    	if(typeof canvas.terrain?.costGrid[rRow]?.[rCol] != 'undefined' && !ignoreTerrain){
    		let point = canvas.terrain.costGrid[rRow][rCol];
    		
    		dist = (point.multiple * dist) 
    	}
// End Terrain---------------------------		
    	travelled+=dist;
    	points.push({row:rRow,col:rCol,distance:dist,nDiagonals:nDiagonals,travelled:travelled})
    }
    
    return points;
}
}
class Hex {
    constructor(q, r, s) {
        this.q = q;
        this.r = r;
        this.s = s;
        if (Math.round(q + r + s) !== 0)
            throw "q + r + s must be 0";
    }
    add(b) {
        return new Hex(this.q + b.q, this.r + b.r, this.s + b.s);
    }
    subtract(b) {
        return new Hex(this.q - b.q, this.r - b.r, this.s - b.s);
    }
    scale(k) {
        return new Hex(this.q * k, this.r * k, this.s * k);
    }
    rotateLeft() {
        return new Hex(-this.s, -this.q, -this.r);
    }
    rotateRight() {
        return new Hex(-this.r, -this.s, -this.q);
    }
    static direction(direction) {
        return Hex.directions[direction];
    }
    neighbor(direction) {
        return this.add(Hex.direction(direction));
    }
    diagonalNeighbor(direction) {
        return this.add(Hex.diagonals[direction]);
    }
    len() {
        return (Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2;
    }
    distance(b) {
        return this.subtract(b).len();
    }
    round() {
        var qi = Math.round(this.q);
        var ri = Math.round(this.r);
        var si = Math.round(this.s);
        var q_diff = Math.abs(qi - this.q);
        var r_diff = Math.abs(ri - this.r);
        var s_diff = Math.abs(si - this.s);
        if (q_diff > r_diff && q_diff > s_diff) {
            qi = -ri - si;
        }
        else if (r_diff > s_diff) {
            ri = -qi - si;
        }
        else {
            si = -qi - ri;
        }
        return new Hex(qi, ri, si);
    }
    lerp(b, t) {
        return new Hex(this.q * (1.0 - t) + b.q * t, this.r * (1.0 - t) + b.r * t, this.s * (1.0 - t) + b.s * t);
    }
    linedraw(b,totalDistance=0,ignoreTerrain=false) {
        var N = this.distance(b);
        var a_nudge = new Hex(this.q + 1e-06, this.r + 1e-06, this.s - 2e-06);
        var b_nudge = new Hex(b.q + 1e-06, b.r + 1e-06, b.s - 2e-06);
		//var b_nudge = new Hex(b.q + 1e-06, b.r + 1e-06, b.s - 2e-06);
        var results = [];
        var step = 1.0 / Math.max(N, 1);
        let travelled = totalDistance;
        for (var i = 0; i <= N; i++) {
        	let hex = a_nudge.lerp(b_nudge, step * i).round();
        	let grid = Coord.rCubeToOffset(hex)
		//console.log(hex,grid)
        	let dist = canvas.dimensions.distance;
        	if(i == 0)
        		dist = 0;
        	else{
	      		if(typeof canvas.terrain?.costGrid[grid.row]?.[grid.col] != 'undefined' && !ignoreTerrain){
		    		let point = canvas.terrain.costGrid[grid.row][grid.col];
		    		dist = (point.multiple * dist) 
		    	}
        	}
        	travelled += dist;
            results.push({row:grid.row,col:grid.col,distance:dist,travelled:travelled});
        }
        return results;
    }
}

class Coord {
    constructor(row, col) {
        this.col = col;
        this.row = row;
    }
    static qoffsetFromCube(offset, h) {
        var col = h.q;
        var row = h.r + (h.q + offset * (h.q & 1)) / 2;
        // if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
        //     throw "offset must be EVEN (+1) or ODD (-1)";
        // }
        return new OffsetCoord(col, row);
    }
    static qoffsetToCube(offset, h) {
        var q = h.col;
        var r = h.row - (h.col + offset * (h.col & 1)) / 2;
        var s = -q - r;
        // if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
        //     throw "offset must be EVEN (+1) or ODD (-1)";
        // }
        return new Hex(q, r, s);
    }
    static rCubeToOffset(cube) {
    	//const offset = (canvas.grid.grid.options.even) ? 1:-1;
        //let row = cube.s//cube.q + (cube.r + offset * (cube.r % 2)) / 2; // 1 + (-1 + -1 * (-1 % 2)) / 2 = 
        //let col = cube.q + (cube.s + offset * (cube.s % 2)) / 2
        
		// if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
        //     throw "offset must be EVEN (+1) or ODD (-1)";
        // }
        let Grid =  this.cubeToOffset(cube)
		//return {row,col};
		return Grid
	}
    static rCoordToCube(row,col) {
    	const offset = (canvas.grid.grid.options.even) ? 1:-1;
        var q = col - (row + offset * (row & 1)) / 2;
        var r = row;
        var s = -q - r;
        // if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
        //     throw "offset must be EVEN (+1) or ODD (-1)";
        // }
        return new Hex(q, r, s);
    }

	static offsetToCube({row, col}={}, {columns=true, even=false}={}) {
		const offset = even ? 1 : -1;
	
		// Column orientation
		if ( columns ) {
		  const q = col;
		  const r = row - ((col + (offset * (col & 1))) / 2);
		  return {q, r, s: 0 - q - r};
		}
	
		// Row orientation
		else {
		  const q = col - ((row + (offset * (row & 1))) / 2);
		  const r = row;
		  return {q, r, s: 0 - q - r};
		}
	  }
	  static cubeToOffset({q, r, s}={}, {columns=true, even=false}={}) {
		const offset = even ? 1 : -1;
	
		// Column orientation
		if ( columns ) {
		  const col = q;
		  const row = r + ((q + (offset * (q & 1))) / 2);
		  return {row, col};
		}
	
		// Row orientation
		else {
		  const row = r;
		  const col = q + ((r + (offset * (r & 1))) / 2);
		  return {row, col};
		}
	  }

}