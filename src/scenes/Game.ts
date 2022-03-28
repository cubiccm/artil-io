import Phaser from 'phaser';
import * as types from 'types';
// import * as PlayerController from 'types/PlayerController'
import * as _ from "lodash";
import { combineNoise, generateNoise } from "utils/perlin";

let _w = window.innerWidth, _h = window.innerHeight;

let body: Phaser.Physics.Matter.Sprite;
let debugGraphics: Phaser.GameObjects.Graphics;
let debugMessage: Phaser.GameObjects.Text;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
var smoothedControls: SmoothedHorionztalControl;
var playerController: types.PlayerController;
var cam: Phaser.Cameras.Scene2D.Camera;

export default class Demo extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // this.load.image('logo', 'assets/phaser3-logo.png');
    this.load.svg("body", "assets/pacman.svg", { scale: 0.3 });
    this.load.image("tank", "assets/tank.png");
    this.load.json("tank_shape", "assets/tank_shape.json");
  }

  create() {
    cursors = this.input.keyboard.createCursorKeys();
    cam = this.cameras.main;
    smoothedControls = new SmoothedHorionztalControl(0.0005);
    this.matter.world.createDebugGraphic();

    cam.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);
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

    this.cameras.main.startFollow(playerController.matterSprite);
    // smoothMoveCameraTowards(playerController.matterSprite);

  }

  update(time: number, delta: number) {
    debugMessage.setText(getDebugMessage());
    updateBody(this, time, delta);
    // smoothMoveCameraTowards(playerController.matterSprite, 0.9);
  }
}

function getDebugMessage() {
  return `
    x: ${playerController.matterSprite.x}
    y: ${playerController.matterSprite.y}
    `
}

function generateBody(t: Phaser.Scene) {
  playerController = {
    matterSprite: t.matter.add.sprite(0, 0, 'tank', undefined, { shape: t.cache.json.get("tank_shape").tank } as Phaser.Types.Physics.Matter.MatterBodyConfig),
    blocked: {
      left: false,
      right: false,
      bottom: false
    },
    numTouching: {
      left: 0,
      right: 0,
      bottom: 0
    },
    sensors: {
      bottom: undefined,
      left: undefined,
      right: undefined
    },
    time: {
      leftDown: 0,
      rightDown: 0
    },
    lastJumpedAt: 0,
    speed: {
      run: 2,
      jump: 6
    },
    HP: 100,
  };

  let w = 1300;
  let h = 1100;

  var sx = w / 2;
  var sy = h / 2;

  // var playerBody = t.matter.bodies.rectangle(sx, sy, w * 0.75, h, { chamfer: { radius: 10 } });
  let body = playerController.matterSprite.body as MatterJS.BodyType;
  t.matter.body.translate(body, { x: sx - 100, y: sy + 250 });
  // @ts-ignore
  t.matter.body.setCentre(body, { x: 0, y: 0.45 * sy }, true);
  playerController.sensors.bottom = t.matter.bodies.rectangle(sx, h, sx, 5, { isSensor: true });
  playerController.sensors.left = t.matter.bodies.rectangle(sx - w * 0.45, sy, 5, h * 0.5, { isSensor: true });
  playerController.sensors.right = t.matter.bodies.rectangle(sx + w * 0.45, sy, 5, h * 0.5, { isSensor: true });

  var compoundBody = t.matter.body.create({
    parts: [
      body, playerController.sensors.bottom, playerController.sensors.left,
      playerController.sensors.right
    ],
    friction: 0.01,
    restitution: 0.05 // Prevent body from sticking against a wall
  });

  t.matter.world.setGravity(0, 1, 0.001);

  playerController.matterSprite
    .setExistingBody(compoundBody)
  // .setFixedRotation() // Sets max inertia to prevent rotation
  playerController.matterSprite.setBounce(0)
  playerController.matterSprite.setPosition(0, 0)
  playerController.matterSprite.setScale(0.15);


  t.matter.add.image(630, 750, 'box');
  t.matter.add.image(630, 650, 'box');
  t.matter.add.image(630, 550, 'box');

  t.matter.world.on('beforeupdate', function (event: any) {
    playerController.numTouching.left = 0;
    playerController.numTouching.right = 0;
    playerController.numTouching.bottom = 0;
  });

  // Loop over the active colliding pairs and count the surfaces the player is touching.
  t.matter.world.on('collisionactive', function (event: any) {
    var playerBody = playerController.matterSprite.body;
    var left = playerController.sensors.left;
    var right = playerController.sensors.right;
    var bottom = playerController.sensors.bottom;

    for (var i = 0; i < event.pairs.length; i++) {
      var bodyA = event.pairs[i].bodyA;
      var bodyB = event.pairs[i].bodyB;

      if (bodyA === playerBody || bodyB === playerBody) {
        continue;
      }
      else if (bodyA === bottom || bodyB === bottom) {
        // Standing on any surface counts (e.g. jumping off of a non-static crate).
        playerController.numTouching.bottom += 1;
      }
      else if ((bodyA === left && bodyB.isStatic) || (bodyB === left && bodyA.isStatic)) {
        // Only static objects count since we don't want to be blocked by an object that we
        // can push around.
        playerController.numTouching.left += 1;
      }
      else if ((bodyA === right && bodyB.isStatic) || (bodyB === right && bodyA.isStatic)) {
        playerController.numTouching.right += 1;
      }
    }
  });

  // Update over, so now we can determine if any direction is blocked
  t.matter.world.on('afterupdate', function (event: any) {
    playerController.blocked.right = playerController.numTouching.right > 0 ? true : false;
    playerController.blocked.left = playerController.numTouching.left > 0 ? true : false;
    playerController.blocked.bottom = playerController.numTouching.bottom > 0 ? true : false;
  });

  t.input.on('pointerdown', function () {
    t.matter.world.drawDebug = !t.matter.world.drawDebug;
    t.matter.world.debugGraphic.visible = t.matter.world.drawDebug;
  }, t);

};

function updateBody(t: Phaser.Scene, time: number, delta: number) {
  var matterSprite = playerController.matterSprite;

  // Horizontal movement

  var oldVelocityX;
  var targetVelocityX;
  var newVelocityX;

  if (cursors.left.isDown && !playerController.blocked.left) {
    smoothedControls.moveLeft(delta);
    // matterSprite.anims.play('left', true);

    // Lerp the velocity towards the max run using the smoothed controls. This simulates a
    // player controlled acceleration.
    oldVelocityX = matterSprite.body.velocity.x;
    targetVelocityX = -playerController.speed.run;
    newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, -smoothedControls.value);

    matterSprite.setVelocityX(newVelocityX);
  }
  else if (cursors.right.isDown && !playerController.blocked.right) {
    smoothedControls.moveRight(delta);
    // matterSprite.anims.play('right', true);

    // Lerp the velocity towards the max run using the smoothed controls. This simulates a
    // player controlled acceleration.
    oldVelocityX = matterSprite.body.velocity.x;
    targetVelocityX = playerController.speed.run;
    newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, smoothedControls.value);

    matterSprite.setVelocityX(newVelocityX);
  }
  else {
    smoothedControls.reset();
    // matterSprite.anims.play('tank', true);
  }

  // Jumping & wall jumping

  // Add a slight delay between jumps since the sensors will still collide for a few frames after
  // a jump is initiated
  var canJump = (time - playerController.lastJumpedAt) > 250;
  if (cursors.up.isDown && canJump) {
    if (playerController.blocked.bottom) {
      matterSprite.setVelocityY(-playerController.speed.jump);
      playerController.lastJumpedAt = time;
    }
    else if (playerController.blocked.left) {
      // Jump up and away from the wall
      matterSprite.setVelocityY(-playerController.speed.jump);
      matterSprite.setVelocityX(playerController.speed.run);
      playerController.lastJumpedAt = time;
    }
    else if (playerController.blocked.right) {
      // Jump up and away from the wall
      matterSprite.setVelocityY(-playerController.speed.jump);
      matterSprite.setVelocityX(-playerController.speed.run);
      playerController.lastJumpedAt = time;
    }
  }
}

function generateTerrain(t: Phaser.Scene) {
  // for (let i = 0; i < 30; i++) {
  //   let rect: any = t.add.rectangle(Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(150, 750), 20, 0xffffff);
  //   rect.setInteractive();
  //   t.input.setDraggable(rect);
  //   t.matter.add.gameObject(rect)
  //   rect.setStatic(true);
  //   rect.setFriction(0, 0, 0);
  // }

  let w = 750;
  let h = 200;
  let s = 20;

  let ny = Math.ceil(h / s);
  let nx = Math.ceil(w / s);

  let noise_t = combineNoise(generateNoise(h, h/2, 8, 2, nx)).pos;
  let noise_r = combineNoise(generateNoise(w, w/2, 8, 2, ny)).pos;
  let noise_b = combineNoise(generateNoise(128, 128, 8, 2, nx)).pos;
  let noise_l = combineNoise(generateNoise(128, 128, 8, 2, ny)).pos;
  let min_noise_t: any = _.min(noise_t);
  let min_noise_r: any = _.min(noise_r);
  let min_noise_b: any = _.min(noise_b);
  let min_noise_l: any = _.min(noise_l);
  console.log(noise_t);
  let verts_t = _.range(1, nx).map((i) => ({ x: i * w / nx, y: 0 - (noise_t[i]-min_noise_t)}));
  // let verts_r = _.range(1, ny).map((i) => ({ x: w + (noise_r[i] - min_noise_r) , y: i * h / ny }));
  // let verts_b = _.range(nx, 1).map((i) => ({ x: i * w / nx, y: h + (noise_b[i] - min_noise_b) }));
  // let verts_l = _.range(ny, 1).map((i) => ({ x: 0 - (noise_l[i] - min_noise_l), y: i * h / ny }));
  // let verts_t = _.range(1, nx).map((i) => ({ x: i * w / nx, y: 0 - (noise_t[i]-min_noise_t)}));
  let verts_r = _.range(1, ny).map((i) => ({ x: w  , y: i * h / ny }));
  let verts_b = _.range(nx, 1).map((i) => ({ x: i * w / nx, y: h  }));
  let verts_l = _.range(ny, 1).map((i) => ({ x: 0 , y: i * h / ny }));

  let verts = _.flatten([verts_t, verts_r, verts_b, verts_l]);
  console.log('v', verts);

  // let sverts = "";
  // _.map(verts, (v: any) => (sverts += `${v.x} ${v.y} `));
  // sverts.trimEnd();
  // console.log(sverts);


  // var poly: any = t.add.polygon(100, 700, verts, 0x0000ff, 1); // wierd bug sometimes the shape skips some vertices?
  // t.matter.add.gameObject(poly, { shape: { type: 'fromVerts', verts: verts, flagInternal: true } });
  // poly.setStatic(true);

  var poly = t.matter.add.fromVertices(100, 500, verts, { isStatic: true,  }); // if i tried to add all noise, the shape disappeears wtf?
  console.log(poly)
};

class SmoothedHorionztalControl {
  public msSpeed: number;
  public value: number;

  public constructor(speed: number) {
    this.msSpeed = speed;
    this.value = 0;
  }

  public moveLeft(delta: number) {
    if (this.value > 0) { this.reset(); }
    this.value -= this.msSpeed * delta;
    if (this.value < -1) { this.value = -1; }
    playerController.time.rightDown += delta;
  }

  public moveRight(delta: number) {
    if (this.value < 0) { this.reset(); }
    this.value += this.msSpeed * delta;
    if (this.value > 1) { this.value = 1; }
  }

  public reset() {
    this.value = 0;
  }

}

function smoothMoveCameraTowards(target: any, smoothFactor: any = 0) {
  if (smoothFactor === undefined) { smoothFactor = 0; }
  cam.scrollX = smoothFactor * cam.scrollX + (1 - smoothFactor) * (target.x - cam.width * 0.5);
  cam.scrollY = smoothFactor * cam.scrollY + (1 - smoothFactor) * (target.y - cam.height * 0.5);
}
