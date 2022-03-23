var _w = window.innerWidth, _h = window.innerHeight;

var config = {
  type: Phaser.AUTO,
  width: _w,
  height: _h,
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

function preload() {
  this.load.svg("body", "assets/pacman.svg", {scale: 0.3});
  this.load.image("tank", "assets/tank.png");
  this.load.json("tank_shape", "assets/tank.json");
}

function create() {
  this.cameras.main.scrollX = -_w / 2;
  this.cameras.main.scrollY = -_h / 2;
  this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;
  });
  generateTerrain(this);
  generateBody(this);
}

function update() {

} 

var generateTerrain = (t) => {
  for (let i = 0; i < 30; i++) {
    let rect = t.add.rectangle(Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(150, 750), 20, 0xffffff);
    rect.setInteractive();
    t.input.setDraggable(rect);
    t.matter.add.gameObject(rect).setStatic(true).setFriction(0, 0, 0);
  }
};

var body;
var generateBody = (t) => {
  body = t.matter.add.sprite(0, 0, "tank", null, {shape: t.cache.json.get("tank_shape").tank}).setScale(0.12);
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
  t.cameras.main.startFollow(body);
};