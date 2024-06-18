class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load sprites
        this.load.image("gatbars", "GatlingBarrels.png");
        this.load.image("gatshell", "GatlingShell.png");
        this.load.image("cantur", "CannonTurret.png");
        this.load.image("mistur", "MissileTurret.png");

        this.load.image("Inf", "Soldier.png");
        this.load.image("ST", "SuperSoldier.png");
        this.load.image("APC", "APC.png");
        this.load.image("Tank", "SandTank.png");

        this.load.image("Goal", "Goal.png");
        this.load.image("Selector", "Selector.png");
        this.load.image("GatIcon", "GatlingIcon.png");
        this.load.image("CanIcon", "CannonIcon.png");
        this.load.image("MisIcon", "LauncherIcon.png");

        this.load.image("shell", "Shell.png");
        this.load.image("missile", "Missile.png");

        this.load.image("gatfire", "GatFire.png");
        this.load.image("canfire", "CannonFire.png");

        this.load.image("gathit", "GatHit.png");
        this.load.image("explosion", "Explosion1.png");

        this.load.audio("gatshot", "GatlingShot.mp3");
        this.load.audio("canshot", "CannonShot.mp3");
        this.load.audio("mislaunch", "MissileLaunch.mp3");
        this.load.audio("misex", "MissileExplosion2.mp3");
        this.load.audio("towerplace", "TowerPlace.mp3");
        this.load.audio("sell", "SellFX.mp3");
        this.load.audio("invalid", "Invalid.mp3");




        // Load tilemap information
        //this.load.image("tilemap_tiles", "tilemap_packed.png");                   // Packed tilemap
        //this.load.tilemapTiledJSON("three-farmhouses", "three-farmhouses.tmj");   // Tilemap in JSON
        this.load.image("tilemap_tiles", "towerDefense_tilesheet.png");                   // Packed tilemap
        this.load.tilemapTiledJSON("TowerField", "LastStand.tmj");   // Tilemap in JSON
    }

    create() {
        

        // ...and pass to the next Scene
        this.scene.start("endScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}