import * as types from '@/types';
import SmoothedHorionztalControl from '@/scripts/control';
import Global from '@/global';

export default class Tank extends Phaser.Physics.Matter.Sprite {
  public smoothedControls!: SmoothedHorionztalControl;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene.matter.world, x, y, 'tank', undefined, {
      shape: scene.cache.json.get('tank_shape').tank
    } as Phaser.Types.Physics.Matter.MatterBodyConfig);
    scene.add.existing(this);

    this.setData({
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
      HP: 100
    });
    const w = 1100;
    const h = 1100;

    const sx = w / 2;
    const sy = h / 2;

    scene.matter.body.translate(this.body as MatterJS.BodyType, {
      x: sx / 2 - 10,
      y: sy - 40
    });
    scene.matter.body.set(this.body as MatterJS.BodyType, 'centre', {
      x: sx,
      y: sy + 0.9 * sy
    });
    this.data.values.sensors.bottom = scene.matter.bodies.rectangle(
      sx,
      h + 5,
      w - 150,
      10,
      { isSensor: true }
    );
    this.data.values.sensors.left = scene.matter.bodies.rectangle(
      sx - w * 0.45,
      sy + 400,
      5,
      h * 0.2,
      { isSensor: true }
    );
    this.data.values.sensors.right = scene.matter.bodies.rectangle(
      sx + w * 0.47,
      sy + 400,
      5,
      h * 0.2,
      { isSensor: true }
    );

    const compoundBody = scene.matter.body.create({
      parts: [
        this.body,
        this.data.values.sensors.bottom,
        this.data.values.sensors.left,
        this.data.values.sensors.right
      ],
      friction: 0.01,
      restitution: 0.05 // Prevent body from sticking against a wall
    });

    this.setExistingBody(compoundBody);
    this.setPosition(0, 0);
    this.setScale(0.15);

    this.smoothedControls = new SmoothedHorionztalControl(this, 0.0005);

    this.listenEvents();
  }

  moveLeft(time: number, delta: number) {
    const oldVelocityX = this.body.velocity.x;
    const targetVelocityX = -this.data.values.speed.run;
    const newVelocityX = Phaser.Math.Linear(
      oldVelocityX,
      targetVelocityX,
      -this.smoothedControls.value
    );
    if (!this.data.values.blocked.left) {
      this.smoothedControls.moveLeft(delta);
      // matterSprite.anims.play('left', true);

      this.setVelocityX(newVelocityX);
    }

    if (!this.data.values.blocked.bottom)
      this.setAngularVelocity(-0.005); // For rotating in the air
    else if (this.data.values.blocked.left)
      this.setAngularVelocity(0.01); // For climbing
  }

  moveRight(time: number, delta: number) {
    const oldVelocityX = this.body.velocity.x;
    const targetVelocityX = this.data.values.speed.run;
    const newVelocityX = Phaser.Math.Linear(
      oldVelocityX,
      targetVelocityX,
      this.smoothedControls.value
    );
    if (!this.data.values.blocked.right) {
      this.smoothedControls.moveRight(delta);
      // matterSprite.anims.play('right', true);

      this.setVelocityX(newVelocityX);
    }

    if (!this.data.values.blocked.bottom)
      this.setAngularVelocity(0.005);
    else if (this.data.values.blocked.right)
      this.setAngularVelocity(-0.01);
  }

  jump(time: number, delta: number) {
    const canJump = time - this.data.values.lastJumpedAt > 250;
    if (canJump) {
      if (this.data.values.blocked.bottom) {
        this.setVelocityY(-this.data.values.speed.jump);
        this.data.values.lastJumpedAt = time;
      } else if (this.data.values.blocked.left) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed.jump);
        this.setVelocityX(this.data.values.speed.run);
        this.data.values.lastJumpedAt = time;
      } else if (this.data.values.blocked.right) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed.jump);
        this.setVelocityX(-this.data.values.speed.run);
        this.data.values.lastJumpedAt = time;
      }
    }
  }

  listenEvents() {
    Global.event_bus.on('beforeupdate', (e: any) => {
      this.player_data.numTouching.left = 0;
      this.player_data.numTouching.right = 0;
      this.player_data.numTouching.bottom = 0;
    });

    Global.event_bus.on('afterupdate', (e: any) => {
      this.player_data.blocked.right =
        this.player_data.numTouching.right > 0 ? true : false;
      this.player_data.blocked.left =
        this.player_data.numTouching.left > 0 ? true : false;
      this.player_data.blocked.bottom =
        this.player_data.numTouching.bottom > 0 ? true : false;
    });

    Global.event_bus.on('playerMoveLeft', this.moveLeft);
    Global.event_bus.on('playerMoveRight', this.moveRight);
    Global.event_bus.on('playerJump', this.jump);

    Global.event_bus.on('playerSensorBottom', () => {
      this.player_data.numTouching.bottom += 1;
    });

    Global.event_bus.on('playerSensorLeft', () => {
      this.player_data.numTouching.left += 1;
    });

    Global.event_bus.on('playerSensorRight', () => {
      this.player_data.numTouching.right += 1;
    });

    Global.event_bus.on('keydown-LEFT', (e: any) => {
      this.moveLeft(e.time, e.delta);
    });

    Global.event_bus.on('keydown-RIGHT', (e: any) => {
      this.moveRight(e.time, e.delta);
    });

    Global.event_bus.on('keydown-UP', (e: any) => {
      this.jump(e.time, e.delta);
    });
  }

  public get player_data(): types.TankData {
    return this.data.values as any;
  }
}
