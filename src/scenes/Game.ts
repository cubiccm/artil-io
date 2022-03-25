import Phaser from 'phaser';

let _w = window.innerWidth, _h = window.innerHeight;

let body: Phaser.Physics.Matter.Sprite;
let debugGraphics: Phaser.GameObjects.Graphics;
let debugMessage: Phaser.GameObjects.Text;

export default class Demo extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // this.load.image('logo', 'assets/phaser3-logo.png');
    this.load.svg("body", "assets/pacman.svg", {scale: 0.3});
    this.load.image("tank", "assets/tank.png");
    this.load.json("tank_shape", "assets/tank.json");

  }

  create() {
    console.log(this);
    this.cameras.main.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);
    this.matter.world.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);
  
    this.cameras.main.scrollX = -_w / 2;
    this.cameras.main.scrollY = -_h / 2;
    this.input.on('drag', (pointer: any, gameObject: any, dragX: any, dragY: any) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
  
    debugGraphics = this.add.graphics();
  
    generateTerrain(this);
    generateBody(this);
  
    debugMessage = this.add.text(16, 16, getDebugMessage(), {
        fontSize: '18px',
        padding: { x: 10, y: 5 },
        backgroundColor: '#000000',
    });
    debugMessage.setScrollFactor(0);
    debugGraphics.clear();
    debugMessage.setText(getDebugMessage());
  
    this.cameras.main.startFollow(body);
  }
  
  update() {
    debugMessage.setText(getDebugMessage());
  } 
}

function getDebugMessage ()
{
    return `
    x: ${body.x}
    y: ${body.y}
    `
}

function generateBody(t: Phaser.Scene) {
  body = t.matter.add.sprite(0, 0, "tank", undefined, {shape: t.cache.json.get("tank_shape").tank} as any);
  body.setScale(0.1);
  // body.setCircle();
  body.setBounce(0.15);
  body.setMass(100);
  body.setFriction(0, 0.1, 0);
  t.matter.world.setGravity();
  t.input.keyboard.on("keydown", (event: any) => {
    // Strange force?? Needs further design!
    let COM = new Phaser.Math.Vector2(body.centerOfMass);
    COM.y *= 2;
    if (event.key == "A" || event.key == "a") {
      // body.applyForceFrom(COM, new Phaser.Math.Vector2(-0.7, 0));
      body.applyForce(new Phaser.Math.Vector2(-0.7, 0));
    }  
    if (event.key == "D" || event.key == "d") {
      // body.applyForceFrom(COM, new Phaser.Math.Vector2(0.7, 0));
      body.applyForce(new Phaser.Math.Vector2(0.7, 0));
    } 
    if (event.key == "W" || event.key == "w") {
      // body.applyForceFrom(COM, new Phaser.Math.Vector2(0.7, 0));
      body.applyForce(new Phaser.Math.Vector2(0, -3));
    }
  });
};

function generateTerrain(t: Phaser.Scene) {
  for (let i = 0; i < 30; i++) {
    let rect:any = t.add.rectangle(Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(150, 750), 20, 0xffffff);
    rect.setInteractive();
    t.input.setDraggable(rect);
    t.matter.add.gameObject(rect)
    rect.setStatic(true)
    rect.setFriction(0, 0, 0);
  }
};

