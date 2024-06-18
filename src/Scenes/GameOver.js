class GameOver extends Phaser.Scene{
    constructor(){
        super("endScene");
        this.helpvisible = false;

    }

    preload(){

    }

    create(){
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
        
        this.TitleText = this.add.text(640, 60, "GAME OVER", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(80);
        this.Score = this.add.text(640, 320, "You survived " + CurWave + " waves and scored " + Score + " points.", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(48);

        this.Prompt = this.add.text(640, 400, "Press SPACE to return to title.", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0).setFontSize(36);

        this.sBar = this.input.keyboard.addKey('SPACE'); // dev ability, press 'p' for free towers
        this.sBar.on('down', (key, event) => {
            this.scene.start("titleScene");
        });
    }

    
}