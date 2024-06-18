class TowerDefense extends Phaser.Scene {
    constructor() {
        super("towerdefenseScene");
        this.TowerArray = [];
        this.ProjArray = [];
        this.EnemArray = [];
        this.ArmyArray = [];
        this.FXArray = [];
        this.Wave = false;
        this.Selected = null;
        this.PlaceMode = -1;
        this.TowerCosts = [5, 25, 75];
        
    

        this.Lives;
        this.Money;
        this.MoneyFlashing = 160;
        this.Flashed = false;
        this.FInterval = 0;
        CurWave = 0;
        Score = 0;

        //Depth key:
        //1: Background FX (Craters)
        //2: Enemies
        //3: Towers
        //4: Foreground FX (Projectiles/Explosions);
        //5: UI
    }

    preload() {
        this.load.setPath("./assets/");
        this.invalid = this.sound.add("invalid");
        this.invalid.setVolume(.2);
        this.place = this.sound.add("towerplace");
        this.sell = this.sound.add("sell");
    }

    init() {
        this.STARTX = this.tileXtoWorld(9) + TILESIZE/2;
        this.STARTY = TILESIZE/2;
        this.ENDX = this.tileXtoWorld(9) + TILESIZE/2;
        this.ENDY = this.tileXtoWorld(31) + TILESIZE/2;
    }

    create() {
        CurWave = 1;
        Score = 0;
        this.Lives = 20;
        this.Money = 35;
        this.Wave = false;
        // Creating tilemap
        this.map = this.add.tilemap("TowerField", TILESIZE, TILESIZE, TILEHEIGHT, TILEWIDTH);
        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("towerDefense_tilesheet", "tilemap_tiles");
        // Create the layers
        this.groundLayer = this.map.createLayer("BaseLayer", this.tileset, 0, 0);
        this.overLayer = this.map.createLayer("OverLayer", this.tileset, 0, 0);
        
        
        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(SCALE);

        // Create grid of visible tiles for use with path planning
        this.TDGrid = this.layersToGrid();
        this.CleanGrid = this.layersToGrid([this.BaseLayer, this.OverLayer]); //Clean copy of the grid to refrence when selling towers
        this.walkables = [25, 80, 81, 82, 83, 84, 103, 105, 120, 125, 126, 127, 128, 149, 150, 151, 172, 174, 189, 194];

        // Initialize EasyStar pathfinder
        this.finder = new EasyStar.js();
        // Pass grid information to EasyStar
         this.finder.setGrid(this.TDGrid);
        // Tell EasyStar which tiles can be walked on
        this.finder.setAcceptableTiles(this.walkables);
        this.finder.enableSync();
        this.Path;
        this.testPath();

        //Loading one-time sprites-------------------------------------------------------------
        this.Goal = this.add.sprite(this.ENDX, this.ENDY, "Goal");
        this.Goal.setDepth(1);

        this.Selector = this.add.sprite(-120, this.tileYtoWorld(29)+32, "Selector");
        this.Selector.setDepth(4);

        this.gatbutton = this.add.sprite(this.tileXtoWorld(2) + 32, this.tileYtoWorld(30)+32, "GatIcon");
        this.gatbutton.setDepth(4);
        this.gatPrice = this.add.text(this.tileXtoWorld(2) + 32, this.tileYtoWorld(31)+32, "$5", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(36);

        this.canbutton = this.add.sprite(this.tileXtoWorld(5) + 32, this.tileYtoWorld(30)+32, "CanIcon");
        this.canbutton.setDepth(4);
        this.canPrice = this.add.text(this.tileXtoWorld(5) + 32, this.tileYtoWorld(31)+32, "$25", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(36);

        this.misbutton = this.add.sprite(this.tileXtoWorld(14) + 32, this.tileYtoWorld(30)+32, "MisIcon");
        this.misbutton.setDepth(4);
        this.misPrice = this.add.text(this.tileXtoWorld(14) + 32, this.tileYtoWorld(31)+32, "$75", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(36);


        this.placePrompt = this.add.text(640, 64, "Click to place towers\nPress SPACE to begin next wave", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(48);
        this.placePrompt.setDepth(5);
        this.sellPrompt = this.add.text(-200, -200, "Sell for", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(30);
        this.sellPrompt.setDepth(5);
        this.moneyText = this.add.text(10, this.tileYtoWorld(2), "Money: " + this.Money, {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0,0).setFontSize(40);
        this.moneyText.setDepth(5);
        this.livesText = this.add.text(10, this.tileYtoWorld(3), "Lives: " + this.Lives, {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0,0).setFontSize(40);
        this.livesText.setDepth(5);
        this.waveText = this.add.text(this.tileXtoWorld(20) -10, this.tileYtoWorld(2), "Wave: " + CurWave, {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(1,0).setFontSize(40);
        this.waveText.setDepth(5);
        this.scoreText = this.add.text(this.tileXtoWorld(20) -10, this.tileYtoWorld(3), "Score: " + Score, {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(1,0).setFontSize(40);
        this.scoreText.setDepth(5);


        /*this.pKey = this.input.keyboard.addKey('P'); // dev ability, press 'p' for free towers
        this.pKey.on('down', (key, event) => {
            let x = game.input.mousePointer.x / SCALE;
            let y = game.input.mousePointer.y / SCALE;
            let tX = Math.floor(x/TILESIZE);
            var tY = Math.floor(y/TILESIZE);
            if(this.placeBase(0)){
                this.TowerArray.push(new launcher(tX, tY, this));
            }
        
        });*/

        this.sBar = this.input.keyboard.addKey('SPACE');//Next wave handling
        this.sBar.on('down', (key, event) => {
            if(!this.Wave){
                this.Wave = true;

                this.sellPrompt.x = -200;
                this.sellPrompt.y = -200;
                this.Selected = null;
                this.PlaceMode = -1;
                this.Selector.x = -120;

                console.log("sending convoy");
                console.log(1 + Math.floor(CurWave/2))
                for(let a = 0; a < 1 + Math.floor(CurWave/2); a++){
                    let typ = intInRange(0, 7);
                    if(typ < 3 || CurWave < 3){
                        this.ArmyArray.push(new march(4 + (2* CurWave), max(intInRange(20, 60), Math.floor(120/(CurWave+1))), intInRange(a*10, a*30), this));
                    }
                    else if(typ < 5 || CurWave < 5){
                        this.ArmyArray.push(new squad(3 + Math.floor(1.5* CurWave), intInRange(30, 80), intInRange(a*10, a*30), this));
                    }
                    else if(typ < 7 || CurWave < 10){
                        this.ArmyArray.push(new convoy(2 + CurWave, intInRange(50, 100), intInRange(a*10, a*30), this));
                    }
                    else{
                        this.ArmyArray.push(new platoon(1 + Math.floor(CurWave/3), intInRange(70, 120), intInRange(a*10, a*30), this));
                    }
                }
            }
        });

        // Handle mouse clicks
        // Handles the clicks on the map to make the character move
        // The this parameter passes the current "this" context to the
        // function this.handleClick()
        
        this.input.on('pointerup',this.handleClick, this);

        this.cKey = this.input.keyboard.addKey('C');
        this.lowCost = false;

    }

    update() {
        if(this.Wave){
            this.placePrompt.visible = false;
        }else{
            this.placePrompt.visible = true;
        }

        this.MoneyFlashing--;
        this.FInterval--;
        if(this.Flashed && this.FInterval <= 0){
            this.Flashed = false;
            this.moneyText.visible = true;
            this.FInterval = 30;
        }
        if(!this.Flashed && this.FInterval <= 0 && this.MoneyFlashing >= 0){
            this.Flashed = true;
            this.moneyText.visible = false;
            this.FInterval = 30;
        }


        for(let t in this.TowerArray){//Tower Actions
            this.TowerArray[t].attack();
        }

        for(let p in this.ProjArray){
            this.ProjArray[p].track();
            if(this.ProjArray[p].SelfTerm){
                this.ProjArray[p].Follower.destroy(true);
                this.ProjArray.splice(p, 1);
            }
        }

        for(let e in this.EnemArray){
            if(this.EnemArray[e].Health <= 0){
                this.EnemArray[e].Destroyed = true;
                this.EnemArray[e].Sprite.destroy(true);
                this.Money += this.EnemArray[e].Reward;
                Score += this.EnemArray[e].Reward;
                this.EnemArray.splice(e, 1);
                this.moneyText.setText("Money: " + this.Money);
                this.scoreText.setText("Score: " + Score);
            }
            else if(checkcollision(this.EnemArray[e].Sprite, this.Goal)){
                this.EnemArray[e].Destroyed = true;
                this.EnemArray[e].Sprite.destroy(true);
                this.EnemArray.splice(e, 1);
                this.Lives--;
                this.livesText.setText("Lives: " + this.Lives);
                if(this.Lives <= 0){
                    this.scene.start("endScene");
                }
            }
        }

        for(let a in this.ArmyArray){
            //console.log(this.ArmyArray[a].TimeTil);
            if(this.ArmyArray[a].TimeTil <= 0){
                this.EnemArray.push(this.ArmyArray[a].nextEnemy());
                this.moveCharacter(this.Path, this.EnemArray[this.EnemArray.length-1]);
            }
            this.ArmyArray[a].TimeTil--;
            if(this.ArmyArray[a].Remaining <= 0){
                this.ArmyArray.splice(a, 1);
            }
        }

        if(this.Wave && this.EnemArray.length <= 0 && this.ArmyArray.length <= 0 ){
            this.Wave = false;
            CurWave++;
            this.waveText.setText("Wave: " + CurWave);
        }
        

        for(let f in this.FXArray){
            this.FXArray[f].Lifetime--;
            if(this.FXArray[f].Lifetime <= 0){
                this.FXArray[f].Sprite.destroy(true);
                this.FXArray.splice(f, 1);
            }
        }

    }

    resetCost(tileset) {
        for (let tileID = tileset.firstgid; tileID < tileset.total; tileID++) {
            let props = tileset.getTileProperties(tileID);
            if (props != null) {
                if (props.cost != null) {
                    this.finder.setTileCost(tileID, 1);
                }
            }
        }
    }

    tileXtoWorld(tileX) {
        return tileX * TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * TILESIZE;
    }

    // layersToGrid
    //
    // Uses the tile layer information in this.map and outputs
    // an array which contains the tile ids of the visible tiles on screen.
    // This array can then be given to Easystar for use in path finding.
    layersToGrid() {
        let grid = [];
        // Initialize grid as two-dimensional array
        //for each row in tileheight, inititialize an empty array in grid[row]
        for(let rows = 0; rows < TILEHEIGHT; rows++){
            grid[rows] = [];
        }

        // Loop over layers to find tile IDs, store in grid
        for(let rows = 0; rows < TILEHEIGHT; rows++){//for each row...
            for(let columns = 0; columns < TILEWIDTH; columns++){//and column...
                for(let l in this.map.layers){//for each layer...
                    //console.log(l);
                    if(this.map.layers[l].tilemapLayer.getTileAt(columns, rows)){//if the layer has data for the given x y add it, and overwrite any previous data at that coordinate
                        grid[rows][columns] = this.map.layers[l].tilemapLayer.getTileAt(columns, rows).index;
                    }
                    
                }
            }
        }

        return grid;
    }


    handleClick(pointer) { //Handle all mouse interactions
        let x = pointer.x / SCALE;
        let y = pointer.y / SCALE;
        let tX = Math.floor(x/TILESIZE);
        var tY = Math.floor(y/TILESIZE);

        /*if(this.EnemArray.length > 0){ //Dev ability, click to shoot missile
            this.ProjArray.push(new missile(x, y, this.EnemArray[0], this));
        }*/

        if(this.mouseInBounds(this.gatbutton) && !this.Wave){//Handle clicking gatling tower button
            console.log("Goal Clicked!");
            this.PlaceMode = 0;
            this.Selector.x = this.gatbutton.x;
            this.sellPrompt.x = -200;
            this.sellPrompt.y = -200;
            this.Selected = null;
        }
        else if(this.mouseInBounds(this.canbutton) && !this.Wave){//Handle clicking cannon tower button
            console.log("Goal Clicked!");
            this.PlaceMode = 1;
            this.Selector.x = this.canbutton.x;
            this.sellPrompt.x = -200;
            this.sellPrompt.y = -200;
            this.Selected = null;
        }
        else if(this.mouseInBounds(this.misbutton) && !this.Wave){//Handle clicking missile tower button
            console.log("Goal Clicked!");
            this.PlaceMode = 2;
            this.Selector.x = this.misbutton.x;
            this.sellPrompt.x = -200;
            this.sellPrompt.y = -200;
            this.Selected = null;
        }
        else if(this.TDGrid[tY][tX]== 182 && !this.Wave){//Handle selecting towers/presenting sell prompt
            this.PlaceMode = -1;
            this.Selector.x = -120;
            for(let t in this.TowerArray){
                if(this.mouseInBounds(this.TowerArray[t].Sprite[0])){
                    this.Selected = t;
                    break;
                }
            }
            this.sellPrompt.x = this.TowerArray[this.Selected].Sprite[0].x;
            this.sellPrompt.y = this.TowerArray[this.Selected].Sprite[0].y - 64;
            this.sellPrompt.setText("Click to sell for " + this.TowerArray[this.Selected].SellPrice);
            
        }
        else if(this.mouseInBounds(this.sellPrompt)){//Handle selling behavior
            this.Money += this.TowerArray[this.Selected].SellPrice;
            this.moneyText.setText("Money: " + this.Money);
            for(let s in this.TowerArray[this.Selected].Sprite){
                this.TowerArray[this.Selected].Sprite[s].destroy(true);
            }
            this.overLayer.removeTileAt(this.TowerArray[this.Selected].tX, this.TowerArray[this.Selected].tY);
            this.TDGrid[this.TowerArray[this.Selected].tY][this.TowerArray[this.Selected].tX] = this.CleanGrid[this.TowerArray[this.Selected].tY][this.TowerArray[this.Selected].tX];
            console.log(this.TDGrid[this.TowerArray[this.Selected].tY][this.TowerArray[this.Selected].tX]);
            console.log(this.CleanGrid);
            console.log(this.TDGrid);
            this.TowerArray.splice(this.Selected, 1);
            
            this.sellPrompt.x = -200;
            this.sellPrompt.y = -200;
            this.Selected = null;
            this.testPath();
            this.sell.play();
        }
        else if(this.PlaceMode == 0){//placing gatling
            if(this.placeBase(this.TowerCosts[0])){
                console.log("placing");
                this.TowerArray.push(new gatling(tX, tY, this));

            }
        }
        else if(this.PlaceMode == 1){//placing cannon
            if(this.placeBase(this.TowerCosts[1])){
                console.log("placing");
                this.TowerArray.push(new cannon(tX, tY, this));

            }
        }
        else if(this.PlaceMode == 2){//placing missile
            if(this.placeBase(this.TowerCosts[2])){
                console.log("placing");
                this.TowerArray.push(new launcher(tX, tY, this));

            }
        }
        else{
            this.sellPrompt.x = -200;
            this.sellPrompt.y = -200;
            this.Selected = null;
        }
    }

    placeBase(cost){//checks the viability of a proposed tower locating and cost, and places a wall and returns true if passed
        let x = game.input.mousePointer.x / SCALE;
        let y = game.input.mousePointer.y / SCALE;
        let tX = Math.floor(x/TILESIZE);
        var tY = Math.floor(y/TILESIZE);
        let prevID = this.TDGrid[tY][tX];
        if(this.Money < cost){
            this.MoneyFlashing = 160;
            this.invalid.play();
            return(false);
        }
        if(tY < 4 || tY > 27){
            this.invalid.play();
            return(false);
        }else if(!(this.walkables.includes(prevID))){
            this.invalid.play();
            return(false);
        }
        else{
            this.TDGrid[tY][tX] = 182;

            this.finder.setGrid(this.TDGrid);
            if(this.testPath()){
                console.log("path success");
                this.overLayer.putTileAt(182, tX, tY);
                this.Money -= cost;
                this.moneyText.setText("Money: " + this.Money);
                this.place.play();
            }else{
                console.log("path failure");
                this.TDGrid[tY][tX] = prevID;
                console.log(this.TDGrid);
                this.finder.setGrid(this.TDGrid);
                return(false);
            }
        }
        return(true);
        
       
    }

    testPath(){
        let pathfound = false;
        this.finder.findPath(9, 0, 9, 31, (path) => {
            if (path === null) {
                console.warn("Path was not found.");
                //this.sound.play("invalid");
                this.invalid.play();
                
            } else {
                console.log(path);
                this.Path = path;
                pathfound = true;
                //this.moveCharacter(path, this.activeCharacter);
            }
        });
        this.finder.calculate();
        console.log(this.Path);
        return(pathfound);
    }
    
    moveCharacter(path, character) {
        // Sets up a list of tweens, one for each tile to walk, that will be chained by the timeline
        var tweens = [];
        let pX = path[0].x;
        let pY = path[0].y;
        for(var i = 0; i < path.length-1; i++){
            var ex = path[i+1].x ;
            var ey = path[i+1].y;
            let targ = Phaser.Math.Angle.Between(pX, pY, ex, ey) -0.01;
            let cur = character.Sprite.rotation;
            let dif = targ - cur;
            if(dif < -Math.PI){
                dif += 2*Math.PI;
            }else if(dif > Math.PI){
                dif -= 2*Math.PI;
            }
            //console.log(cur + dif);
            //console.log(Phaser.Math.Angle.Between(pX, pY, ex, ey));
            tweens.push({
                rotation: cur + dif,
                
                duration: 10,
                //rotationOffset: 0,
            });
            tweens.push({
                
                x: (ex*this.map.tileWidth) + 32,
                y: (ey*this.map.tileHeight) + 32,
                
                duration: character.Speed,
                onComplete: function(){
                    //this.FXArray.push(new TempSprite("explosion", character.Sprite.x, character.Sprite.y, 1, 0, 20, this));
                    character.TTraveled++;
                },
                callbackScope: this
                //rotationOffset: 0,
            });
            pX = ex;
            pY = ey;
        }
    
        this.tweens.chain({
            targets: character.Sprite,
            tweens: tweens,
            onStart: () =>{
                console.log("Moving!");
            }
        });

    }

    // A function which takes as input a tileset and then iterates through all
    // of the tiles in the tileset to retrieve the cost property, and then 
    // uses the value of the cost property to inform EasyStar, using EasyStar's
    // setTileCost(tileID, tileCost) function.
    setCost(tileset) {
        // TODO: write this function
        for(let t = tileset.firstgid; t <= tileset.total; t++){//for t in the range of tile ids...
            let p = tileset.getTileProperties(t);
            if(p){// is the properties of tile t, and if tile t exists...
                let c = p.cost; //and has a specified cost...
                if(c){
                    this.finder.setTileCost(t, c); //send that cost to easystar
                }
            }
        }
    }

    mouseInBounds(obj){
        let colliding = true;
        if(game.input.mousePointer.x/SCALE < (obj.x - (obj.displayWidth/2)) || game.input.mousePointer.x/SCALE > (obj.x + (obj.displayWidth/2))){
            colliding = false;
        }
        else if(game.input.mousePointer.y/SCALE < (obj.y - (obj.displayHeight/2)) || game.input.mousePointer.y/SCALE > (obj.y + (obj.displayHeight/2))){
            colliding = false;
        }
        return(colliding);
    }


}
