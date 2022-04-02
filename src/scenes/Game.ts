import Phaser from 'phaser';
import Tank from '@/components/Tank';
import DebugMessage from '@/components/DebugMessage';
import Global from '@/global';

import generateTerrain from '@/scripts/terrainGenerator';
import _ from 'lodash';

let player: Tank;
let debugMessage: Phaser.GameObjects.Text;
let cam: Phaser.Cameras.Scene2D.Camera;
let wrapCamB: Phaser.Cameras.Scene2D.Camera;
let wrapCamT: Phaser.Cameras.Scene2D.Camera;

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

    cam.setBounds(
      -Global.WORLD_WIDTH / 2,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH,
      Global.WORLD_HEIGHT * 2
    );

    this.matter.world.setBounds(
      -Global.WORLD_WIDTH,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH * 2,
      Global.WORLD_HEIGHT * 2,
      undefined,
      true,
      false,
      false,
      false
    );

    this.cameras.main.scrollX = -Global.SCREEN_WIDTH / 2;
    this.cameras.main.scrollY = -Global.SCREEN_HEIGHT / 2;
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
    player = new Tank(this, 0, 0);

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
      player.fire(e.time, e.delta, new Phaser.Math.Vector2(cursor_x, cursor_y));
    });

    debugMessage = new DebugMessage(this, player, 16, 16);

    // draw debugs
    this.matter.world.drawDebug = true;
    this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;
    this.cameras.main.startFollow(player);

    wrapCamB = this.cameras.add(
      0,
      0,
      Global.SCREEN_WIDTH,
      Global.SCREEN_HEIGHT,
      false,
      'wrapCamB'
    );
    wrapCamB.setBounds(
      -Global.WORLD_WIDTH / 2,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH,
      Global.WORLD_HEIGHT * 2
    );
    wrapCamB.startFollow(player, undefined, 1, 0);
    wrapCamB.scrollY = -Global.WORLD_HEIGHT / 2;
    wrapCamB.setAlpha(0.6);

    wrapCamT = this.cameras.add(
      0,
      0,
      Global.SCREEN_WIDTH,
      Global.SCREEN_HEIGHT,
      false,
      'wrapCamT'
    );
    wrapCamT.setBounds(
      -Global.WORLD_WIDTH / 2,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH,
      Global.WORLD_HEIGHT * 2
    );
    wrapCamT.startFollow(player, undefined, 1, 0);
    wrapCamT.scrollY = Global.WORLD_HEIGHT / 2 - Global.SCREEN_HEIGHT;
    wrapCamT.setAlpha(0.6);

    this.add.rectangle(
      0,
      -Global.WORLD_HEIGHT / 2,
      Global.WORLD_HEIGHT,
      5,
      0xff0000
    );
    this.add.rectangle(
      0,
      Global.WORLD_HEIGHT / 2,
      Global.WORLD_HEIGHT,
      5,
      0xff0000
    );

    this.add
      .rectangle(Global.SCREEN_WIDTH / 2, 0, Global.SCREEN_WIDTH, 5, 0x00ff00)
      .setScrollFactor(0);
    this.add
      .rectangle(
        Global.SCREEN_WIDTH / 2,
        Global.SCREEN_HEIGHT,
        Global.SCREEN_WIDTH,
        5,
        0x00ff00
      )
      .setScrollFactor(0);
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
    wrapCamB.setViewport(
      0,
      -player.y + (Global.WORLD_HEIGHT + Global.SCREEN_HEIGHT) / 2,
      Global.SCREEN_WIDTH,
      Global.SCREEN_HEIGHT
    );
    wrapCamT.setViewport(
      0,
      -player.y - (Global.WORLD_HEIGHT + Global.SCREEN_HEIGHT) / 2,
      Global.SCREEN_WIDTH,
      Global.SCREEN_HEIGHT
    );
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
