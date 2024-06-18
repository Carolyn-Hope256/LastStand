class Title extends Phaser.Scene{
    constructor(){
        super("titleScene");
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
        
        this.TitleText = this.add.text(640, 60, "LAST STAND", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(80);
        this.Prompt = this.add.text(640, 320, "Press SPACE to start or H for help", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0.5).setFontSize(52);

        this.Help = this.add.text(640, 320, "In the dying days of the revolution, you must defend\nthe last rebel stronghold as long as you can. Use\n the mouse to select towers from the bottom row\nand place them on the field to form defenses.\nEnemies will enter from above and attempt to\nexit the bottom of the map. When you believe\nyourself to be ready, press SPACE to begin the\nnext wave and earn money. Be careful!\nTowers can only be bought and sold between waves.\n\nTower guide:\nGatling: low damage and range, but dirt cheap.\nGood for building mazes and cleaning up stragglers.\nCannon: Slow firing, but high single-target\nDPS at medium range. Solid anti-tank.\nMissile: Slow firing, deals moderate damage in a large\narea at long range. Vicious against infantry.", {fontFamily: 'GunPlay'}).setColor('#dd1111').setOrigin(0.5,0).setFontSize(36);

        this.g = this.add.sprite(140, 816, "GatIcon");
        this.c = this.add.sprite(140, 890, "CanIcon");
        this.m= this.add.sprite(140, 964, "MisIcon");
        this.hKey = this.input.keyboard.addKey('H'); // dev ability, press 'p' for free towers
        this.hKey.on('down', (key, event) => {
            this.helpvisible = !this.helpvisible;
        });
        this.sBar = this.input.keyboard.addKey('SPACE'); // dev ability, press 'p' for free towers
        this.sBar.on('down', (key, event) => {
            this.scene.start("towerdefenseScene");
        });
    }

    update(){
        this.Prompt.visible = !this.helpvisible;
        this.Help.visible = this.helpvisible;
        this.g.visible = this.helpvisible;
        this.c.visible = this.helpvisible;
        this.m.visible = this.helpvisible;
    }
}