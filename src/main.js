// Carolyn Hope
// Created: 6/14/2024
// Phaser: 3.80.0
//
// Last Stand
//
// A simple tower defense game in Phaser using the EasyStar.js pathfinder 
// https://github.com/prettymuchbryce/easystarjs
// 
// Assets from the following Kenney Asset packs
// TOwer Defense Top Down
// https://kenney.nl/assets/tower-defense-top-down
//
// Tanks Top down
// https://kenney.nl/assets/top-down-tanks
//
//Tanks
//https://kenney.nl/assets/tanks
//
//GunPlay font courtesy of
//https://www.1001fonts.com/military-fonts.html
//
//Tower placement error noise from
//https://orangefreesounds.com/wrong-answer-sound-effect/
//
//All other sfx courtesy of
//https://www.zapsplat.com/basic-member-home/


// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 640,
    height: 1024,
    scene: [Load, Title, TowerDefense, GameOver]
}

var cursors;
var my = {sprite: {}};


const TILESIZE = 64;
const SCALE = .5;
const TILEWIDTH = 20;
const TILEHEIGHT = 32;

var CurWave;
var Score;

const game = new Phaser.Game(config);


//Utility Functions----------------------------------------------------
function distBetween(x1, y1, x2, y2, v){
    let xs = (x1-x2) * (x1-x2);
    if(v){console.log("x^2 " + xs)};
    let ys = (y1-y2) * (y1-y2);
    if(v){console.log("y^2 " + ys)};
    if(v){console.log("c: " + Math.sqrt(xs + ys))};
    return(Math.sqrt(xs + ys));   
}

//checks if the center of sprite 1 is within the bounding box of sprite 2
function checkcollision(obj1, obj2) {
    colliding = true;
    if(obj1.x < (obj2.x - (obj2.displayWidth/2)) || obj1.x > (obj2.x + (obj2.displayWidth/2))){
        colliding = false;
    }
    else if(obj1.y < (obj2.y - (obj2.displayHeight/2)) || obj1.y > (obj2.y + (obj2.displayHeight/2))){
        colliding = false;
    }
    return(colliding);
}

function intInRange(i1, i2){
    let r = i2 - i1;
    return(i1 + Math.floor(Math.random() * (r + 1) ) );
}

function compareDist(en1, en2){//sorting algorithm for sorting targets based on which has traveled furthest
    return(en2.TTraveled - en1.TTraveled);
}

function min(int1, int2){
    if(int1 < int2){
        return(int1);
    }
    else{
        return(int2);
    }
}

function max(int1, int2){
    if(int1 > int2){
        return(int1);
    }
    else{
        return(int2);
    }
}

//Towers---------------------------------------------------------------
class tower {
    constructor(tileX, tileY, scene){
        this.Scene = scene;
        this.X = (tileX * TILESIZE) + 32;
        this.Y = (tileY * TILESIZE) + 32;
        this.tX = tileX;
        this.tY = tileY;
        this.Sprite = [];
        this.InRange = [];
        this.Target;
        this.FireRate;
        this.Cooldown;
        this.Damage;
        this.Range;
    }

    rotSprite(thet){
        for(let s in this.Sprite){
            this.Sprite[s].rotation = thet;
        }
    }

    getViable(){
        this.InRange = [];
        for(let e in this.Scene.EnemArray){
            if(distBetween(this.X, this.Y, this.Scene.EnemArray[e].Sprite.x, this.Scene.EnemArray[e].Sprite.y) <= this.Range){
                this.InRange.push(this.Scene.EnemArray[e]);
            }
        }
        this.InRange.sort(compareDist);
    }

    pickTarget(){
        this.getViable();
        if(this.InRange.length > 0){
            this.Target = this.InRange[0];
            //console.log("Target Acquired");
        }
    }

    attack(){

    }
}

class gatling extends tower {
    constructor(tileX, tileY, scene){
        super(tileX, tileY, scene);
        this.SellPrice = scene.TowerCosts[0];
        this.FireRate = 10;
        this.Cooldown = 0;
        this.Damage = 5;
        this.Range = 240;
        this.Sprite =[scene.add.sprite(this.X, this.Y, "gatbars"), scene.add.sprite(this.X, this.Y, "gatshell"), scene.add.sprite(this.X, this.Y, "gatfire")];
        this.Sprite[0].flipY = true;
        this.Sprite[0].setOrigin(0.5, 0.6);
        this.Sprite[1].setOrigin(0.5, 0.4);
        this.Sprite[2].setOrigin(0.5, 1.1);
        this.Sprite[2].visible = false;
        for(let s in this.Sprite){
            this.Sprite[s].setDepth(3);
        }
        this.sfx = scene.sound.add("gatshot");
        this.sfx.setVolume(0.1);
    }

    attack(){
        if(this.Cooldown <= 0){
            if(this.Target && (this.Target.Destroyed || distBetween(this.X, this.Y, this.Target.Sprite.x, this.Target.Sprite.y) >= this.Range)){
                //console.log("Target lost. Dist: " + distBetween(this.X, this.Y, this.Target.Sprite.x, this.Target.Sprite.y));
                //console.log("Target x: " + this.Target.Sprite.x + " y: " + this.Target.Sprite.y + " Tower x: " + this.X + " y: " + this.Y);
                this.Target = null;
                this.Sprite[0].setOrigin(0.5, 0.6);
                this.Sprite[1].setOrigin(0.5, 0.4);
                this.Sprite[2].visible = false;
                
            }
            if(!this.Target){
                this.pickTarget();
            }
            if(this.Target){
                this.Cooldown = this.FireRate;
                this.Target.Health -= this.Damage;
                this.sfx.play();
                this.Sprite[2].visible = true;
                this.Sprite[0].setOrigin(0.5, 0.5);
                this.Sprite[1].setOrigin(0.5, 0.3);
                //console.log(this.Target.Health)
                this.Scene.FXArray.push(new TempSprite("gathit", this.Target.Sprite.x + intInRange(-32,32), this.Target.Sprite.y + intInRange(-32,32), Math.random() * .5, Math.random(), 5, this.Scene));
                this.Scene.FXArray[this.Scene.FXArray.length-1].Sprite.setDepth(4);
            }
        }
        if(this.Target){
            this.rotSprite(Phaser.Math.Angle.Between(this.X, this.Y, this.Target.Sprite.x, this.Target.Sprite.y) + Math.PI/2);
        }
        this.Cooldown--;
    }
    
}

class cannon extends tower {
    constructor(tileX, tileY, scene){
        super(tileX, tileY, scene);
        this.SellPrice = scene.TowerCosts[1];
        this.FireRate = 120;
        this.Cooldown = 0;
        this.Damage = 1000;
        this.Range = 360;
        this.Sprite =[scene.add.sprite(this.X, this.Y, "cantur"), scene.add.sprite(this.X, this.Y, "canfire")];
        this.Recoil = 0;
        this.Sprite[1].setOrigin(0.5, 1);
        this.Sprite[1].visible = false;
        this.Sprite[1].setDepth(5);
        this.Sprite[0].setDepth(3);
        
        this.sfx = scene.sound.add("canshot");
        this.sfx.setVolume(1);
    }

    attack(){
        if(this.Recoil > 0){
            this.Recoil -= .005
        }
        if(this.Recoil > .2){
            this.Sprite[1].visible = true;
        }else{
            this.Sprite[1].visible = false;
        }
        this.Sprite[0].setOrigin(0.5, 0.5 - this.Recoil);

        if(this.Target && (this.Target.Destroyed || distBetween(this.X, this.Y, this.Target.Sprite.x, this.Target.Sprite.y) >= this.Range)){
            this.Target = null;            
        }

        if(this.Cooldown <= 0){
            
            if(!this.Target){
                this.pickTarget();
            }
            if(this.Target){
                this.Cooldown = this.FireRate;
                //this.Target.Health -= this.Damage;
                this.sfx.play();
                this.Sprite[1].visible = true;
                this.Recoil = 0.3;
                this.Scene.ProjArray.push(new shell(this.X, this.Y, this.Target, this.Scene));
                //this.Scene.FXArray[this.Scene.FXArray.length-1].Sprite.setDepth(4);
            }
        }
        if(this.Target){
            this.rotSprite(Phaser.Math.Angle.Between(this.X, this.Y, this.Target.Sprite.x, this.Target.Sprite.y) + Math.PI/2);
        }
        this.Cooldown--;
    }
    
}
class launcher extends tower {
    constructor(tileX, tileY, scene){
        super(tileX, tileY, scene);
        this.SellPrice = scene.TowerCosts[2];
        this.FireRate = 200;
        this.Cooldown = 0;
        this.Damage = 1000;
        this.Range = 600;
        this.Sprite =[scene.add.sprite(this.X, this.Y, "mistur")];
        this.Recoil = 0;
        this.Sprite[0].setDepth(3);
        
        this.sfx = scene.sound.add("mislaunch");
        this.sfx.setVolume(1);
    }

    attack(){

        if(this.Target && (this.Target.Destroyed || distBetween(this.X, this.Y, this.Target.Sprite.x, this.Target.Sprite.y) >= this.Range)){
            this.Target = null;            
        }

        if(this.Cooldown <= 0){
            
            if(!this.Target){
                this.pickTarget();
            }
            if(this.Target){
                this.Cooldown = this.FireRate;
                //this.Target.Health -= this.Damage;
                this.sfx.play();
                this.Recoil = 0.3;
                this.Scene.ProjArray.push(new missile(this.X, this.Y, this.Target, this.Scene));
                //this.Scene.FXArray[this.Scene.FXArray.length-1].Sprite.setDepth(4);
            }
        }
        if(this.Target){
            this.rotSprite(Phaser.Math.Angle.Between(this.X, this.Y, this.Target.Sprite.x, this.Target.Sprite.y) + Math.PI/2);
        }
        this.Cooldown--;
    }
    
}

//Enemies--------------------------------------------------------------
class enemy {
    constructor(x, y, scene){
        this.TTraveled = 0;
        this.Destroyed = false;
    }
}

class infantry extends enemy{
    constructor(x, y, scene){
        super(x, y, scene);
        this.Sprite = scene.add.sprite(x, y, "Inf");
        this.Sprite.setDepth(2);
        this.Health = 100;
        this.Speed = 300;
        this.Reward = 1;
    }
}

class SuperTroop extends enemy{
    constructor(x, y, scene){
        super(x, y, scene);
        this.Sprite = scene.add.sprite(x, y, "ST");
        this.Sprite.setScale(1.25);
        this.Sprite.setDepth(2);
        this.Health = 250;
        this.Speed = 400;
        this.Reward = 2;
    }
}

class APC extends enemy{
    constructor(x, y, scene){
        super(x, y, scene);
        this.Sprite = scene.add.sprite(x, y, "APC");
        this.Sprite.setDepth(2);
        this.Health = 1600;
        this.Speed = 500;
        this.Reward = 5;
    }
}

class tank extends enemy{
    constructor(x, y, scene){
        super(x, y, scene);
        this.Sprite = scene.add.sprite(x, y, "Tank");
        this.Sprite.setDepth(2);
        this.Health = 3200;
        this.Speed = 200;
        this.Reward = 20;
    }
}


//Enemy Spawners-------------------------------------------------------
class spawner {
    constructor(count, delay, startdelay, scene){
        this.Remaining = count;
        this.TimeTil = startdelay;
        this.Delay = delay;
        this.Scene = scene;
    }

    nextEnemy(){

    }
}

class march extends spawner{
    constructor(count, delay, startdelay, scene){
        super(count, delay, startdelay, scene);
    }

    nextEnemy(){
        this.TimeTil = this.Delay;
        this.Remaining--;
        return(new infantry(this.Scene.tileXtoWorld(9) + 32, 32, this.Scene));
    }
}

class squad extends spawner{
    constructor(count, delay, startdelay, scene){
        super(count, delay, startdelay, scene);
    }

    nextEnemy(){
        this.TimeTil = this.Delay;
        this.Remaining--;
        return(new SuperTroop(this.Scene.tileXtoWorld(9) + 32, 32, this.Scene));
    }
}

class convoy extends spawner{
    constructor(count, delay, startdelay, scene){
        super(count, delay, startdelay, scene);
    }

    nextEnemy(){
        this.TimeTil = this.Delay;
        this.Remaining--;
        return(new APC(this.Scene.tileXtoWorld(9) + 32, 32, this.Scene));
    }
}

class platoon extends spawner{
    constructor(count, delay, startdelay, scene){
        super(count, delay, startdelay, scene);
    }

    nextEnemy(){
        this.TimeTil = this.Delay;
        this.Remaining--;
        return(new tank(this.Scene.tileXtoWorld(9) + 32, 32, this.Scene));
    }
}




//Projectiles----------------------------------------------------------
class projectile{
    constructor(x, y, target, scene){
        this.Scene = scene;
        this.X = x;
        this.Y = y;

        this.Target = target;
        this.Points = [x, y, target.Sprite.x, target.Sprite.y];
        this.Trajectory = new Phaser.Curves.Spline(this.Points);
        this.SelfTerm = false;
        this.Distance = distBetween(x, y, target.Sprite.x, target.Sprite.y);

        this.Sprite;
        this.Follower;
        this.Speed;

    }
    start(){
        this.Follower = this.Scene.add.follower(this.Trajectory, this.X, this.Y, this.Sprite);
        this.Follower.startFollow({
            from: 0,
            to: 1,
            delay: 0,
            duration: this.Distance/this.Speed,
            ease: 'Linear',
            repeat: 0,
            yoyo: false,
            rotateToPath: true,
            rotationOffset: 90,
            onComplete: function(){
                this.pathend();
            },
            callbackScope: this
        });
    }
    track(){
        if(!this.Target.Destroyed){
            this.Trajectory.points[1].x = this.Target.Sprite.x;
            this.Trajectory.points[1].y = this.Target.Sprite.y;
        }
        
    }
    pathend(){
        this.SelfTerm = true;
    }
}

class shell extends projectile{
    constructor(x, y, target, scene){
        super(x, y, target, scene);
        
        this.Sprite = "shell";
        this.Speed = 2;
        this.start();

    }
    track(){
        if(!this.Target.Destroyed){
            this.Trajectory.points[1].x = this.Target.Sprite.x;
            this.Trajectory.points[1].y = this.Target.Sprite.y;
            if(checkcollision(this.Follower, this.Target.Sprite)){
                this.Target.Health -= 1000;
                this.SelfTerm = true;
            }
        }
    }
}

class missile extends projectile{
    constructor(x, y, target, scene){
        super(x, y, target, scene);
        
        this.Sprite = "missile";
        this.Speed = 1;
        this.start();
        this.sfx = this.Scene.sound.add("misex");
        this.sfx.setVolume(.5)


    }
    pathend(){
        this.SelfTerm = true;
        for(let e in this.Scene.EnemArray){
            if(distBetween(this.Follower.x, this.Follower.y, this.Scene.EnemArray[e].Sprite.x, this.Scene.EnemArray[e].Sprite.y) <= 180){
                this.Scene.EnemArray[e].Health -= 600;
            }
            this.Scene.FXArray.push(new TempSprite("explosion", this.Follower.x, this.Follower.y, 3, Math.random(), 10, this.Scene));
            this.sfx.play();
        }
    }
}

//FX-------------------------------------------------------------------
class TempSprite {
    constructor(sprite, x, y, scale, rot, lifetime, scene){
        this.Sprite = scene.add.sprite(x, y, sprite);
        this.Sprite.setScale(scale);
        this.Sprite.rotation = rot;
        this.Lifetime = lifetime;
    }
}