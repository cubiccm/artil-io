import generateWorld from './worldGenerator.js'

var _w = window.innerWidth, _h = window.innerHeight;

var config = {
  type: Phaser.AUTO,
  width: _w,
  height: _h,
  physics: {
    default: 'matter',
    matter: {
      gravity: { 
        y: 100 
      }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

var body;
var debugGraphics;
var debugMessage;

function preload() {
  this.load.svg("body", "assets/pacman.svg", {scale: 0.3});
  this.load.image("tank", "assets/tank.png");
  this.load.json("tank_shape", "assets/tank.json");
}

function create() {
  this.cameras.main.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);

  this.cameras.main.scrollX = -_w / 2;
  this.cameras.main.scrollY = -_h / 2;
  this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;
  });

  debugGraphics = this.add.graphics();

  generateWorld(this);
  generateBody(this);

  debugMessage = this.add.text(16, 16, getDebugMessage(), {
      fontSize: '18px',
      padding: { x: 10, y: 5 },
      backgroundColor: '#000000',
      fill: '#ffffff'
  });
  debugMessage.setScrollFactor(0);
  debugGraphics.clear();
  debugMessage.setText(getDebugMessage());

  this.cameras.main.startFollow(body);
}

function update() {
  debugMessage.setText(getDebugMessage());
} 

function getDebugMessage ()
{
    return `
    x: ${body.x}
    y: ${body.y}
    `
}

var generateBody = (t) => {
  body = t.matter.add.sprite(0, 0, "tank", null, {shape: t.cache.json.get("tank_shape").tank}).setScale(0.1);
  // body.setCircle();
  body.setBounce(0.15).setMass(100).setFriction(0, 0.1, 0);
  t.matter.world.setGravity();
  t.input.keyboard.on("keydown", (event) => {
    // Strange force?? Needs further design!
    let COM = new Phaser.Math.Vector2(body.centerOfMass);
    COM.y *= 2;
    if (event.key == "A" || event.key == "a") {
      body.applyForceFrom(COM, new Phaser.Math.Vector2(-0.7, 0));
    } else if (event.key == "D" || event.key == "d") {
      body.applyForceFrom(COM, new Phaser.Math.Vector2(0.7, 0));
    }
  });
};