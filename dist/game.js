/**
 * Created by Kjelle on 08.12.2014.
 */
var Ludum = {};
Ludum.Boot = function(game){};

Ludum.Boot.prototype.preload = function () {
    this.load.image('ground', 'assets/platform.png');
};

Ludum.Boot.prototype.create = function () {
    this.game.state.start('Preloader');
};
/**
 * Created by Kjelle on 04.12.2014.
 */
function Level(){
    this.platforms = null;
    this.geometry = null;
    this.enemies = null;

    this.createSky();
    this.createRain();
    this.createPlatforms();
    this.createEnemies();


}

Level.prototype.update = function () {
    if(this.enemies.countDead() > 0){
        var e = this.enemies.getFirstDead();
        if(game.rnd.between(0,1) === 1){
            e.reset(0,game.rnd.between(-20,game.world.height - 64 -48));
            e.moving = 'right';
        } else {
            e.reset(game.world.width,game.rnd.between(-20,game.world.height - 64 -48));
            e.moving = 'left';
        }
    }

};

Level.prototype.createEnemies = function () {
    this.enemies = game.add.group();
    for(var i = 0; i<1; i++){
        this.enemies.add(new Soldier({x: game.rnd.between(0,1300), y: 200}));
    }

};

Level.prototype.createSky = function () {
    var sky = game.add.sprite(0, 0, 'sky');
    var scaleY = game.world.height / sky.height;
    var scaleX = game.world.width / sky.width;
    sky.scale.setTo(scaleX, scaleY);
};

Level.prototype.createRain = function () {
    var emitter = game.add.emitter(game.world.centerX+50, -200, 400);

    emitter.width = game.world.width;
    emitter.angle = 10; // uncomment to set an angle for the rain.

    emitter.makeParticles('rain');

    emitter.minParticleScale = 0.1;
    emitter.maxParticleScale = 0.3;

    emitter.setYSpeed(500, 800);
    emitter.setXSpeed(-5, 5);

    emitter.minRotation = 0;
    emitter.maxRotation = 0;

    emitter.start(false, 1600, 5, 0);
};

Level.prototype.createPlatforms = function () {
    this.platforms = game.add.group();
    this.platforms.enableBody = true;

    this.geometry = game.add.group();
    this.geometry.enableBody = true;

    var ground = this.geometry.create(-40, game.world.height - 64, 'ground');

    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    var scaleX = (game.world.width +40) / ground.width;
    ground.scale.setTo(scaleX, 2);
    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;

    //  Now let's create two ledges
    var ledge = this.platforms.create(game.world.width - 100, game.world.height - 200, 'ground');
    ledge.body.immovable = true;
    ledge.scale.setTo(1, 0.5);

    ledge = this.platforms.create(game.world.width - 200, game.world.height - 400, 'ground');
    ledge.body.immovable = true;
    ledge.scale.setTo(1, 0.5);

    ledge = this.platforms.create(-300, game.world.height - 200, 'ground');
    ledge.body.immovable = true;
    ledge.scale.setTo(1, 0.5);

    ledge = this.platforms.create(-200, game.world.height - 400, 'ground');
    ledge.body.immovable = true;
    ledge.scale.setTo(1, 0.5);
};
var game = new Phaser.Game(1334, 750, Phaser.AUTO, 'game');
window.onload = function () {
    game.state.add('Boot', Ludum.Boot);
    game.state.add('Preloader', Ludum.Preloader);
    game.state.add('MainMenu', Ludum.MainMenu);
    game.state.add('Game', Ludum.Game);
    game.state.start('Boot');
};

var shakeWorld = 0;
var shakeWorldMax = 20;
var shakeWorldTime = 0;
var shakeWorldTimeMax = 40;

function checkForCameraShake() {
    // on update
    if (shakeWorldTime > 0) {
        var magnitude = ( shakeWorldTime / shakeWorldTimeMax ) * shakeWorldMax;
        var rand1 = game.rnd.integerInRange(-magnitude,magnitude);
        var rand2 = game.rnd.integerInRange(-magnitude,magnitude);
        game.world.setBounds(rand1, rand2, game.width + rand1, game.height + rand2);
        shakeWorldTime--;
        if (shakeWorldTime === 0) {
            game.world.setBounds(0, 0, game.width,game.height); // normalize after shake?
        }
    }
}

function cameraShake(amount){
    shakeWorldTime = amount;
}
function Actor(location, spriteName) {
    Phaser.Sprite.call(this, game, location.x, location.y, spriteName);

    this.moveSpeed = 15;
    this.jumpTimer = 0;
    this.jumpDuration = 0.3;
    this.jumpSpeed = 30;
    this.doubleJumped = false;
    this.airborne = false;
    this.bounce = 0.2;
    this.gravity = 1600;


    game.physics.arcade.enable(this);

    //  Player physics properties.
    this.body.drag.x = 100;
    this.body.bounce.y = 0.2;
    this.body.gravity.y = this.gravity;
    this.body.collideWorldBounds = true;

    game.add.existing(this);

    this.bloodEmitter = game.add.emitter(0, 0, 100);
    this.bloodEmitter.setScale(1,5,1,5);
    this.bloodEmitter.gravity = this.gravity;
    this.bloodEmitter.makeParticles('blood', [0,1,2,3,4,5,6,7],500,true);


}

Actor.prototype = Object.create(Phaser.Sprite.prototype);
Actor.prototype.constructor = Actor;

Actor.prototype.moveLeft = function(){
    this.body.velocity.x = -this.moveSpeed * game.time.physicsElapsedMS;
    this.animations.play('left');
};

Actor.prototype.moveRight = function() {
    this.body.velocity.x = this.moveSpeed * game.time.physicsElapsedMS;
    this.animations.play('right');
};

Actor.prototype.jump = function(){
    if(this.jumpTimer < this.jumpDuration){
        this.body.velocity.y = -this.jumpSpeed * game.time.physicsElapsedMS;
        this.jumpTimer += game.time.physicsElapsed;
    }
};
/**
 * Player object
 */

function Player (location) {
    Actor.call(this,location, 'dude');

    this.fallThrough = false;
    this.bullets = game.add.group();
    this.fireRate = 100;
    this.nextFire = 0;

    this.score = 0;
    this.multiplier = 0;

    this.gameOverText = game.add.text(game.world.centerX, 150, 'GAME OVER',
        { font: "96px Arial", fill: "#ffffff", align: "center" });
    this.gameOverText.anchor.setTo(0.5, 0.5);
    this.gameOverText.setShadow(0, 5,'rgba(128,128,128,1)');

    this.clickText = game.add.text(game.world.centerX, 300, '- click to restart -',
        { font: "40px Arial", fill: "#ffffff", align: "center" });
    this.clickText.anchor.setTo(0.5, 0.5);

    this.gameOverText.visible = false;
    this.clickText.visible = false;

    this.events.onKilled.add(this.die, this);


    this.body.checkCollision.up = false;
    this.body.setSize(20,32,10,16);

    this.flashEmitter = game.add.emitter(0, 0, 1);
    this.flashEmitter.setScale(1, 2, 1, 2);
    this.flashEmitter.gravity = 0;
    this.flashEmitter.setXSpeed(0,0);
    this.flashEmitter.setYSpeed(0,0);
    this.flashEmitter.makeParticles('flash');

    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(50, 'bullet');
    this.bullets.setAll('checkWorldBounds', true);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('body.mass', 0.1);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.callAll('body.setSize','body',4,2,0,-3);
    this.bullets.callAll('animations.add', 'animations', 'fire', [0, 1, 2, 3], 60);

    game.camera.follow(this.sprite, Phaser.Camera.FOLLOW_PLATFORMER);


    //  Our two animations, walking left and right.
    this.animations.add('left', [0, 1, 2, 3], 10, true);
    this.animations.add('right', [5, 6, 7, 8], 10, true);

    //controls
    this.controls = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        down: game.input.keyboard.addKey(Phaser.Keyboard.S),
        right: game.input.keyboard.addKey(Phaser.Keyboard.D)
    };

    this.controls.up.onUp.add(function(){

        if(this.airborne){
            this.doubleJumped = true;
        }
        this.airborne = true;
        this.jumpTimer = 0;
    }, this)



}
Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function () {

    //  Reset the players velocity (movement)
    this.body.velocity.x = 0;

    // Horizontal movement
    if (this.controls.left.isDown) {
        this.moveLeft();
    } else if (this.controls.right.isDown) {
        this.moveRight();
    } else {
        this.animations.stop();
        this.frame = 4;
    }

    //Vertical movement
    if(this.controls.up.isDown){
        if(!this.airborne || !this.doubleJumped){
            this.jump();
        }
    }

    if(this.body.touching.down){
        this.airborne = false;
        this.doubleJumped = false;
        if(this.controls.down.isDown){
            this.fallThroughFloor();
        }
    }

    if (game.input.activePointer.isDown)
    {
        this.fire();
    }

    if(!this.multiplierRecentlyIncreased && this.alive){
        this.multiplier++;
        this.multiplierRecentlyIncreased = true;
        mxText.text = 'Multiplier: ' + this.multiplier +'x';
        game.time.events.add(Phaser.Timer.SECOND * 5, function(){
            this.multiplierRecentlyIncreased = false;

            var ninja = new Soldier({x: -20, y: -20});
            ninja.kill();
            level.enemies.add(ninja);

        }, this);
    }

};



Player.prototype.fallThroughFloor = function(){
    this.fallThrough = true;
    game.time.events.add(Phaser.Timer.QUARTER, function(){
        this.fallThrough = false;
    }, this);
};

Player.prototype.fire = function () {

    if (this.alive && game.time.now > this.nextFire && this.bullets.countDead() > 0)
    {
        this.nextFire = game.time.now + this.fireRate;

        var bullet = this.bullets.getFirstDead();

        if(this.body.velocity.x > 0){
            bullet.reset(this.x + 28, this.y + 24);
        } else if(this.body.velocity.x === 0) {
            bullet.reset(this.x + 16, this.y + 24);
        } else {
            bullet.reset(this.x, this.y + 24);
        }
        this.flashEmitter.x = bullet.x;
        this.flashEmitter.y = bullet.y;
        this.flashEmitter.start(true, 20, null, 1);


        game.physics.arcade.moveToPointer(bullet, 800);
        bullet.rotation = game.physics.arcade.angleToPointer(bullet);
        bullet.animations.play('fire');
    }

};

Player.prototype.hitEnemy = function (enemy,bullet) {
    enemy.body.velocity.x = game.rnd.between((bullet.body.velocity.x < 0 ? -100:100),(bullet.body.velocity.x < 0 ? -600:600));
    enemy.body.velocity.y = game.rnd.between(0,-800);
    enemy.body.angularVelocity = game.rnd.between(-200,200);

    if(!enemy.dying){
        enemy.dying = true;
        this.score = this.score + 100 * this.multiplier;
        scoreText.text = 'Score: ' + this.score;
        game.time.events.add(Phaser.Timer.SECOND, function(){

            enemy.dying = false;
            enemy.angle = 0;
            if(enemy.hasBacon){
                enemy.resetBacon();
            }
            enemy.kill();
        }, this);
        bullet.kill();
    }
    this.bloodEmitter.x = bullet.x;
    this.bloodEmitter.y = bullet.y;
    this.bloodEmitter.setXSpeed((bullet.body.velocity.x < 0 ? -50:50), (bullet.body.velocity.x > 0 ? -200:200));
    this.bloodEmitter.setYSpeed(100, -300);
    this.bloodEmitter.start(true, 2000, null, 20);
};

Player.prototype.takeDamage = function (b,enemy) {
    if(!enemy.dying && !this.recentlyDamaged){
        this.body.velocity.x = game.rnd.between(-200, 200);
        this.body.velocity.y = game.rnd.between(-200, -400);
        cameraShake(20);
        this.damage(0.25);
        this.recentlyDamaged = true;
        this.multiplier = 1;
        mxText.text = 'Multiplier: ' + this.multiplier +'x';
        game.time.events.add(Phaser.Timer.SECOND, function(){
            this.recentlyDamaged = false;
        }, this);
    }

};

Player.prototype.platformCollision = function(player,platform){
    return !this.fallThrough;
};

Player.prototype.die = function () {
    this.gameOverText.visible = true;
    this.clickText.visible = true;
    game.input.onDown.add(function(){
        game.state.start('Game');
    }, this);
};

/**
 * Created by Kjelle on 06.12.2014.
 */

function Soldier(location){
    Actor.call(this,location, 'soldier');

    this.body.mass = 100;
    //this.body.setSize(20, 25, 6, 4);
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;

    this.animations.add('left', [0, 1,2,3], 10, true);
    this.animations.add('right', [5, 6,7,8], 10, true);

    if(game.rnd.between(0,1) === 1){

        this.moving = 'right';
    } else {

        this.moving = 'left';
    }

}

Soldier.prototype = Object.create(Actor.prototype);
Soldier.prototype.constructor = Soldier;

Soldier.prototype.update = function(){
   //this.moveLeft();
    if(this.alive && !this.dying){
        if(this.moving === 'left'){
            this.moveLeft();
        } else if(this.moving === 'right') {
            this.moveRight();
        }

        if(this.body.blocked.left){
            this.moving = 'right';
            if(this.hasBacon){
                player.multiplier = 1;
                mxText.text = 'Multiplier: ' + player.multiplier +'x';
                this.resetBacon();
            }
        } else if(this.body.blocked.right){
            this.moving = 'left';
            if(this.hasBacon){
                player.multiplier = 1;
                mxText.text = 'Multiplier: ' + player.multiplier +'x';
                this.resetBacon();
            }
        }

        if(this.body.blocked.down){
            this.jump();
        }

        var dice = game.rnd.between(0,100);

        if(dice === 5){

            this.moving = 'right';
        } else if(dice === 32) {

            this.moving = 'left';
        } else if(dice === 73){
            this.jump();
        }
    }

};

Soldier.prototype.resetBacon = function(){

    bacon.reset(game.world.centerX, game.world.height - 64 -40);
    this.hasBacon = false;
    this.tint = 0xFFFFFF;

};


Ludum.Game = function (game) {
    player = null;
    level = null;
    this.debugtext = null;
    bacon = null;
};

Ludum.Game.prototype.create = function create() {

    game.time.slowMotion = 1;
    //menuMusic.fadeOut(4000);
    game.physics.startSystem(Phaser.Physics.ARCADE);

    level = new Level();
    player = new Player({x: 240, y: 450});
    bacon = game.add.sprite(game.world.centerX, game.world.height - 64 -40, 'bacon');

    scoreText = game.add.text(20, 20, 'Score: 0',
        { font: "20px Arial", fill: "#ffffff", align: "left" });
    scoreText.setShadow(0, 2,'rgba(128,128,128,1)');

    mxText = game.add.text(20, 40, 'Multiplier: 1',
        { font: "20px Arial", fill: "#ffffff", align: "left" });
    mxText.setShadow(0, 2,'rgba(128,128,128,1)');

    game.physics.arcade.enable(bacon);
    bacon.body.immovable = true;


};

Ludum.Game.prototype.update = function update() {
    //Static non-passable geometry collision
    game.physics.arcade.collide(player, level.geometry);
    game.physics.arcade.collide(level.enemies, level.geometry);
    game.physics.arcade.collide(player.bloodEmitter, level.geometry, function (particle, geo) {
        particle.body.velocity.x = 0;
    });

    //Passable platform collision
    game.physics.arcade.collide(player, level.platforms, null, player.platformCollision, player);
    game.physics.arcade.collide(level.enemies, level.platforms);
    game.physics.arcade.collide(player, bacon);
    game.physics.arcade.overlap(level.enemies, bacon, function(bakon,enemy){
        if(!enemy.dying){
            bakon.kill();
            enemy.hasBacon = true;
            enemy.tint = 0xFF0000;
        }
    });

    //Player and enemy collision
    game.physics.arcade.overlap(level.enemies, player.bullets, player.hitEnemy, null, player);
    game.physics.arcade.overlap(level.enemies, player, player.takeDamage, null, player);

    level.update();

    checkForCameraShake();


};


/**
 * Created by Kjelle on 08.12.2014.
 */
Ludum.MainMenu = function (game) {
    menuMusic = null;
};

Ludum.MainMenu.prototype.create = function () {
    /*var sky = game.add.sprite(0, 0, 'sky');
    var scaleY = game.world.height / sky.height;
    var scaleX = game.world.width / sky.width;
    sky.scale.setTo(scaleX, scaleY);*/
    game.time.slowMotion = 2;

    this.createRain();
    this.makeRainStuff();

    menuMusic = game.add.audio('menuMusic',1,true);
    menuMusic.play();

    baconking = game.add.sprite(game.world.centerX, 350, 'baconking');
    baconking.anchor.setTo(0.5,0.5);

    var headerText = game.add.text(game.world.centerX, 150, 'BACON DEFENDER',
        { font: "96px Arial", fill: "#ffffff", align: "center" });
    headerText.anchor.setTo(0.5, 0.5);
    headerText.setShadow(0, 5,'rgba(128,128,128,1)');

    var clickText = game.add.text(game.world.centerX, 500, '- click to start -',
        { font: "40px Arial", fill: "#ffffff", align: "center" });
    clickText.anchor.setTo(0.5, 0.5);

    var sprite_tween = this.add.tween(clickText);
    sprite_tween.to({x: game.world.centerX, y: 520, tint:0xFFFF00},
        1000 /*duration of the tween (in ms)*/,
        Phaser.Easing.Sinusoidal.InOut /*easing type*/,
        true /*autostart?*/,
        100 /*delay*/,
        -1,
        true/*yoyo?*/);

    game.input.onDown.add(this.startGame, this);
};

Ludum.MainMenu.prototype.startGame = function () {
    game.state.start('Game');
};

Ludum.MainMenu.prototype.makeRainStuff = function () {
    var emitter = game.add.emitter(game.world.centerX+50, -300, 400);

    emitter.width = game.world.width;
    emitter.angle = 10; // uncomment to set an angle for the rain.

    emitter.makeParticles(['bacon','soldier']);

    emitter.minParticleScale = 0.2;
    emitter.maxParticleScale = 2;

    emitter.setYSpeed(1, 5);
    emitter.setXSpeed(-5, 5);

    emitter.minRotation = 0;
    emitter.maxRotation = 20;

    emitter.start(false, 16000, 300, 0);
};

Ludum.MainMenu.prototype.createRain = function () {
    var emitter = game.add.emitter(game.world.centerX+50, -200, 400);

    emitter.width = game.world.width;
    emitter.angle = 10; // uncomment to set an angle for the rain.

    emitter.makeParticles('rain');

    emitter.minParticleScale = 0.1;
    emitter.maxParticleScale = 0.3;

    emitter.setYSpeed(500, 800);
    emitter.setXSpeed(-5, 5);

    emitter.minRotation = 0;
    emitter.maxRotation = 0;

    emitter.start(false, 1600, 5, 0);
};


/**
 * Created by Kjelle on 08.12.2014.
 */
Ludum.Preloader = function (game) {
};

Ludum.Preloader.prototype.preload = function () {
    this.stage.backgroundColor = '#0d0e0f';
    var preloadBar = game.add.sprite((320 - 158) / 2, (480 - 50) / 2, 'ground');
    this.load.setPreloadSprite(preloadBar);
    game.add.text(game.world.centerX, 400, 'LOADING',
        { font: "60px Arial", fill: "#ffffff", align: "center" })
        .anchor.setTo(0.5, 0.5);


    //Level assets
    this.load.image('sky', 'assets/night_sky.png');
    this.load.image('bacon', 'assets/bacon.png');
    this.load.image('baconking', 'assets/baconking.png');

    //Enemy assets
    this.load.spritesheet('soldier', 'assets/ninja.png', 24, 48);

    //Player assets
    this.load.spritesheet('dude', 'assets/dude.png', 24, 48);
    this.load.spritesheet('bullet', 'assets/bullet.png', 16, 8);

    //particles
    this.load.spritesheet('blood', 'assets/blood.png', 1, 1);
    this.load.spritesheet('flash', 'assets/flash.png', 38, 38);
    this.load.spritesheet('rain', 'assets/rain.png', 17, 17);

    //UI
    this.load.spritesheet('startButton', 'assets/startbutton.png', 100, 50);

    //sound
    game.load.audio('menuMusic', 'assets/menu.mp3');
};

Ludum.Preloader.prototype.create = function () {
    this.game.state.start('MainMenu');
};