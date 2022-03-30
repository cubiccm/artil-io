import Phaser from 'phaser';
import * as _ from 'lodash';
import Tank from '@/components/Tank';
import DebugMessage from '@/components/DebugMessage';
import Global from '@/global';

import generateTerrain from '@/scripts/terrainGenerator';

const _w = window.innerWidth,
  _h = window.innerHeight;

let player: Tank;
let debugMessage: Phaser.GameObjects.Text;
let cam: Phaser.Cameras.Scene2D.Camera;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Artilio');
  }

  preload() {
    this.load.image('tank', 'assets/tank.png');
    this.load.json('tank_shape', 'assets/tank_shape.json');
    this.load.image('tank_1', 'assets/tank-frames/tank_1.png');
    this.load.image('tank_2', 'assets/tank-frames/tank_2.png');
    this.load.image('tank_3', 'assets/tank-frames/tank_3.png');
    this.load.image('tank_4', 'assets/tank-frames/tank_4.png');
  }

  create() {
    cam = this.cameras.main;
    this.matter.world.createDebugGraphic();

    cam.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);
    this.matter.world.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);

    this.cameras.main.scrollX = -_w / 2;
    this.cameras.main.scrollY = -_h / 2;
    this.input.on(
      'drag',
      (pointer: any, gameObject: any, dragX: any, dragY: any) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    );

    this.matter.world.setGravity(0, 1, 0.001);

    player = new Tank(this, 300, 300);

    generateTerrain(this);
    eventEmitter(this);

    debugMessage = new DebugMessage(this, player, 16, 16);

    this.cameras.main.startFollow(player);
    // smoothMoveCameraTowards(playerController.matterSprite);
  }

  update(time: number, delta: number) {
    inputEmitter(this, time, delta);
    // smoothMoveCameraTowards(playerController.matterSprite, 0.9);
  }
}

function eventEmitter(scene: Phaser.Scene) {
  scene.matter.world.on('beforeupdate', function (event: any) {
    Global.event_bus.emit('beforeupdate', event);
  });

  // Loop over the active colliding pairs and count the surfaces the player is touching.
  scene.matter.world.on('collisionactive', function (event: any) {
    // const playerBody = player.body;
    const left = player.player_data.sensors.left;
    const right = player.player_data.sensors.right;
    const bottom = player.player_data.sensors.bottom;

    event.pairs.forEach((pair: any) => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      if (bodyA === bottom || bodyB === bottom) {
        // Standing on any surface counts (e.g. jumping off of a non-static crate).
        Global.event_bus.emit('playerSensorBottom', event);
      } else if (
        (bodyA === left && bodyB.isStatic) ||
        (bodyB === left && bodyA.isStatic)
      ) {
        // Only static objects count since we don't want to be blocked by an object that we
        // can push around.
        Global.event_bus.emit('playerSensorLeft', event);
      } else if (
        (bodyA === right && bodyB.isStatic) ||
        (bodyB === right && bodyA.isStatic)
      ) {
        Global.event_bus.emit('playerSensorRight', event);
      }
    });
  });

  // Update over, so now we can determine if any direction is blocked
  scene.matter.world.on('afterupdate', function (event: any) {
    Global.event_bus.emit('afterupdate', event);

    // --------------------------BEGIN ANIMATIONS-------------------------------
    if (player.player_data.prevXSpeed >= 0 && player.body.velocity.x < 0) {
      Global.event_bus.emit('playerMovingLeft');
    }
    else if (player.player_data.prevXSpeed <= 0 && player.body.velocity.x > 0) {
      Global.event_bus.emit('playerMovingRight');
    }
    else if (player.body.velocity.x < 0.01 && player.body.velocity.x > -0.01) {
      Global.event_bus.emit('playerIdle');
    }
    player.setData('prevXSpeed', player.body.velocity.x);
    // ---------------------------END ANIMATIONS--------------------------------
  });

  scene.input.on(
    'pointerdown',
    function () {
      scene.matter.world.drawDebug = !scene.matter.world.drawDebug;
      scene.matter.world.debugGraphic.visible = scene.matter.world.drawDebug;
    },
    scene
  );
}

function inputEmitter(scene: Phaser.Scene, time: number, delta: number) {
  const keyboard = scene.input.keyboard;
  const keys: any = keyboard.addKeys('LEFT,RIGHT,UP,DOWN');

  if (keyboard.checkDown(keys.LEFT)) {
    Global.event_bus.emit('keydown-LEFT', { time: time, delta: delta });
  }

  if (keyboard.checkDown(keys.RIGHT)) {
    Global.event_bus.emit('keydown-RIGHT', { time: time, delta: delta });
  }

  if (keyboard.checkDown(keys.UP)) {
    Global.event_bus.emit('keydown-UP', { time: time, delta: delta });
  }

  if (keyboard.checkDown(keys.DOWN)) {
    Global.event_bus.emit('keydown-DOWN', { time: time, delta: delta });
  }
}

function smoothMoveCameraTowards(target: any, smoothFactor: any = 0) {
  if (smoothFactor === undefined) {
    smoothFactor = 0;
  }
  cam.scrollX =
    smoothFactor * cam.scrollX +
    (1 - smoothFactor) * (target.x - cam.width * 0.5);
  cam.scrollY =
    smoothFactor * cam.scrollY +
    (1 - smoothFactor) * (target.y - cam.height * 0.5);
}
