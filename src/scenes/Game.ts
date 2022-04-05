import Phaser from 'phaser';
import Tank from '@/components/Tank';
import DebugMessage from '@/components/DebugMessage';
import Global from '@/global';

import generateTerrain from '@/scripts/terrainGenerator';
import _ from 'lodash';

const _w = window.innerWidth,
  _h = window.innerHeight;

let debugMessage: Phaser.GameObjects.Text;
let cam: Phaser.Cameras.Scene2D.Camera;

export default class Game extends Phaser.Scene {
  public static scene: Game;
  player!: Tank;

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
    Game.scene = this;
    cam = this.cameras.main;
    this.matter.world.createDebugGraphic();

    cam.setBounds(-1024, -1024, 1024 * 2, 1024 * 2);
    this.matter.world.setBounds(-1024, -1024, 1024 * 2, 1024 * 3);

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

    generateTerrain(this);

    // Generate player
    this.player = new Tank(this, 300, 300);

    // Player events
    eventEmitter(this);

    Global.event_bus.on('keydown-LEFT', (e: any) => {
      this.player.moveLeft(e.time, e.delta);
    });

    Global.event_bus.on('keydown-RIGHT', (e: any) => {
      this.player.moveRight(e.time, e.delta);
    });

    Global.event_bus.on('keydown-UP', (e: any) => {
      this.player.jump(e.time, e.delta);
    });

    Global.event_bus.on('mousedown-LEFT', (e: any) => {
      const cam = this.cameras.main;
      const cursor_x = e.x + cam.scrollX;
      const cursor_y = e.y + cam.scrollY;
      this.player.fire(e.time, e.delta, new Phaser.Math.Vector2(cursor_x, cursor_y));
    });

    debugMessage = new DebugMessage(this, this.player, 16, 16);

    // draw debugs
    this.matter.world.drawDebug = true;
    this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;

    this.cameras.main.startFollow(this.player);
    // smoothMoveCameraTowards(playerController.matterSprite);
  }

  update(time: number, delta: number) {
    debugMessage.update(time, delta);
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
    // Not used
  });

  // Update over, so now we can determine if any direction is blocked
  scene.matter.world.on('afterupdate', function (event: any) {
    Global.event_bus.emit('afterupdate', event);
  });
}

function inputEmitter(scene: Phaser.Scene, time: number, delta: number) {
  const keyboard = scene.input.keyboard;
  const keys: any = keyboard.addKeys('LEFT,RIGHT,UP,DOWN,W,A,S,D,SPACE');

  if (keyboard.checkDown(keys.LEFT) || keyboard.checkDown(keys.A)) {
    Global.event_bus.emit('keydown-LEFT', { time: time, delta: delta });
  }

  if (keyboard.checkDown(keys.RIGHT) || keyboard.checkDown(keys.D)) {
    Global.event_bus.emit('keydown-RIGHT', { time: time, delta: delta });
  }

  if (keyboard.checkDown(keys.UP) || keyboard.checkDown(keys.SPACE)) {
    Global.event_bus.emit('keydown-UP', { time: time, delta: delta });
  }

  if (keyboard.checkDown(keys.DOWN)) {
    Global.event_bus.emit('keydown-DOWN', { time: time, delta: delta });
  }

  const pointer = scene.input.activePointer;

  if (pointer.leftButtonDown()) {
    Global.event_bus.emit('mousedown-LEFT', {
      time: time,
      delta: delta,
      x: pointer.x,
      y: pointer.y
    });
  }

  if (pointer.rightButtonDown()) {
    Global.event_bus.emit('mousedown-RIGHT', {
      time: time,
      delta: delta,
      x: pointer.x,
      y: pointer.y
    });
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
