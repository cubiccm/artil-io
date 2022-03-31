import Phaser from 'phaser';
import Tank from '@/components/Tank';
import DebugMessage from '@/components/DebugMessage';
import Global from '@/global';

import generateTerrain from '@/scripts/terrainGenerator';
import _ from 'lodash';

const _w = window.innerWidth,
  _h = window.innerHeight;

let player: Tank;
let debugMessage: Phaser.GameObjects.Text;
let cam: Phaser.Cameras.Scene2D.Camera;

export default class Game extends Phaser.Scene {
  public static scene: Game;
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

    generateTerrain(this);

    // Generate player
    player = new Tank(this, 300, 300);

    // Player events
    eventEmitter(this);

    Global.event_bus.on('keydown-LEFT', (e: any) => {
      player.moveLeft(e.time, e.delta);
    });

    Global.event_bus.on('keydown-RIGHT', (e: any) => {
      player.moveRight(e.time, e.delta);
    });

    Global.event_bus.on('keydown-UP', (e: any) => {
      player.jump(e.time, e.delta);
    });

    Global.event_bus.on('mousedown-LEFT', (e: any) => {
      const cam = this.cameras.main;
      const cursor_x = e.x + cam.scrollX;
      const cursor_y = e.y + cam.scrollY;
      player.fire(new Phaser.Math.Vector2(cursor_x, cursor_y));
    });

    debugMessage = new DebugMessage(this, player, 16, 16);

    // draw debugs
    this.matter.world.drawDebug = true;
    this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;

    this.cameras.main.startFollow(player);
    // smoothMoveCameraTowards(playerController.matterSprite);

    // const create = this.matter.vector.create;
    // const path1 = [
    //   create(-100, -100),
    //   create(0, -50),
    //   create(100, -50),
    //   create(50, 25),
    //   create(50, 50),
    //   create(50, 75),
    //   create(75, 100),
    //   create(0, 100)
    // ];
    // const path2 = [
    //   create(0, 0),
    //   create(100, 0),
    //   create(100, 100),
    //   create(75, 25)
    // ];

    // const x = 100,
    //   y = 100;
    // this.add.circle(0, 0, 4, 0xff0000); // mark 0 0 with red circle
    // this.add.circle(x, y, 4, 0xffffff); // mark center with white circle

    // const body1 = this.matter.add.fromVertices(x, y, path1, { isStatic: true });
    // const path_min1 = this.matter.bounds.create(path1).min;
    // const bound_min1 = body1.bounds.min;
    // this.matter.body.setPosition(body1, {
    //   x: x + (x - bound_min1.x) + path_min1.x,
    //   y: y + (y - bound_min1.y) + path_min1.y
    // });

    // const poly = this.add.polygon(0, 0, path1, 0xff0000, 1);
    // const obj = this.matter.add.gameObject(poly, body1);

    // const poly2 = new Phaser.GameObjects.Polygon(
    //   Game.scene,
    //   x,
    //   y,
    //   path2,
    //   0xff0000,
    //   1
    // );

    // const rect = new Phaser.GameObjects.Rectangle(
    //   Game.scene,
    //   100,
    //   100,
    //   100,
    //   100,
    //   0xff0000,
    //   1
    // );
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
