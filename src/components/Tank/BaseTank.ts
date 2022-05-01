import * as types from '@/types';
import Global from '@/global';
import TankSensor from '@/components/Tank/TankSensor';
import { Game } from 'phaser';

export default abstract class BaseTank extends Phaser.Physics.Matter.Sprite {
  declare body: MatterJS.BodyType;

  // Avoid using this method: please use get() or set() to trigger events
  public get tank_data(): types.TankData {
    return this.data.values as types.TankData;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // (x, y) is used to set the initial position after all parts constructed at (0, 0)
    super(scene.matter.world, 0, 0, 'tank_1', undefined, {
      label: 'tank',
      shape: scene.cache.json.get('tank_shape').tank
    } as Phaser.Types.Physics.Matter.MatterBodyConfig);
    scene.add.existing(this);
    const data: types.TankData = {
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
      lastJumpedAt: 0,
      lastFiredAt: 0,
      speed: {
        ground: 2,
        air: 1.5,
        jump: 6
      },
      HP: 0,
      XP: 0,
      id: 'player',
      team: 'blue',
      bullets: [],
      components: {
        cannon_body: undefined
      }
    };

    this.setData(data);
    const w = 1100;
    const h = 1100;

    const sx = w / 2;
    const sy = h / 2;

    scene.matter.body.translate(this.body as MatterJS.BodyType, {
      x: sx,
      y: sy + 270
    });
    scene.matter.body.set(this.body as MatterJS.BodyType, 'centre', {
      x: sx,
      y: sy + 0.9 * sy
    });
    this.data.values.sensors.bottom = new TankSensor(
      scene.matter.bodies.rectangle(sx, h + 5, w - 150, 10, { isSensor: true }),
      this,
      'B',
      false
    );
    let rect = scene.matter.bodies.rectangle(
      sx - w * 0.43,
      sy + 440,
      10,
      h * 0.18,
      {
        isSensor: true
      }
    );
    this.scene.matter.body.rotate(rect, -(25 / 180) * Math.PI);
    this.data.values.sensors.left = new TankSensor(rect, this, 'L', true);

    rect = scene.matter.bodies.rectangle(
      sx + w * 0.44,
      sy + 440,
      10,
      h * 0.18,
      {
        isSensor: true
      }
    );
    this.scene.matter.body.rotate(rect, (30 / 180) * Math.PI);
    this.data.values.sensors.right = new TankSensor(rect, this, 'R', true);

    this.data.values.components.cannon_body = scene.matter.bodies.circle(
      555,
      400,
      10,
      {
        isSensor: true
      }
    );

    const compoundBody = scene.matter.body.create({
      parts: [
        this.body,
        this.data.values.components.cannon_body,
        this.data.values.sensors.bottom.body,
        this.data.values.sensors.left.body,
        this.data.values.sensors.right.body
      ],
      friction: 0.01,
      restitution: 0.05 // Prevent body from sticking against a wall
    });

    this.setExistingBody(compoundBody);
    this.setPosition(0, 0);
    this.setScale(0.1);
    // this.setIgnoreGravity(true);

    this.createCannonEnd();

    this.body.parts.forEach((part: any) => {
      part.collisionFilter.category = Global.CATEGORY_TANK;
      part.collisionFilter.mask =
        Global.CATEGORY_TERRAIN |
        Global.CATEGORY_TANK |
        Global.CATEGORY_PROJECTILE |
        Global.CATEGORY_DESTRUCTION |
        Global.CATEGORY_POWERUP;
    });

    this.setPosition(x, y);

    // Setup tank animations
    this.createWheelAnimations();
    this.scene.events.on(
      Phaser.Scenes.Events.POST_UPDATE,
      () => {
        this.updateAnimations();
        if (this.getCenter().y > Global.WORLD_HEIGHT / 2) {
          this.setPosition(this.x, -Global.WORLD_HEIGHT / 2);
        } else if (this.getCenter().y < -Global.WORLD_HEIGHT / 2) {
          this.setPosition(this.x, Global.WORLD_HEIGHT / 2);
        }
      },
      this
    );
    this.scene.events.on(
      Phaser.Scenes.Events.UPDATE,
      (time: number, delta: number) => {
        this.update(time, delta);
      }
    );
  }

  moveTo(x: number, y: number, proximity?: number) {
    if (
      typeof proximity != 'undefined' &&
      Phaser.Math.Distance.BetweenPointsSquared(
        { x: x, y: y },
        this.body.position
      ) <
        proximity * proximity
    )
      return;
    this.setPosition(x, y);
  }

  setSpeed(vx: number, vy: number) {
    this.setVelocity(vx, vy);
  }

  moving_left = false;
  moving_right = false;

  update(time: number, delta: number) {
    if (this.moving_left) this.moveLeft();
    else if (this.moving_right) this.moveRight();
  }

  setMovingSpeed(speed: number) {
    if (speed == 0) this.moving_left = this.moving_right = false;
    if (speed > 0) this.moving_right = true;
    if (speed < 0) this.moving_left = true;
  }

  moveLeft() {
    if (
      !this.data.values.sensors.left.blocked &&
      this.data.values.sensors.bottom.blocked
    ) {
      const newVelocityX = this.data.values.sensors.bottom.blocked
        ? this.data.values.speed.ground
        : this.data.values.speed.air;

      this.setVelocityX(-newVelocityX);
    }

    if (!this.data.values.sensors.bottom.blocked) {
      this.setAngularVelocity(-0.005); // For rotating in the air
    } else if (this.data.values.sensors.left.blocked) {
      this.setAngularVelocity(0.01); // For climbing
    }
  }

  moveRight() {
    if (
      !this.data.values.sensors.right.blocked &&
      this.data.values.sensors.bottom.blocked
    ) {
      const newVelocityX = this.data.values.sensors.bottom.blocked
        ? this.data.values.speed.ground
        : this.data.values.speed.air;

      this.setVelocityX(newVelocityX);
    }

    if (!this.data.values.sensors.bottom.blocked) {
      this.setAngularVelocity(0.005);
    } else if (this.data.values.sensors.right.blocked) {
      this.setAngularVelocity(-0.01);
    }
  }

  getCannonAngle() {
    const cannon = this.data.values.components.cannon_body as MatterJS.BodyType;
    return cannon.angle;
  }

  rotateBody(angle: number) {
    this.scene.matter.body.setAngle(this.body, angle);
  }

  rotateCannon(angle: number) {
    const cannon = this.data.values.components.cannon_body;
    this.scene.matter.body.setAngle(cannon, angle);
  }

  set(attribute: string, value: any) {
    if (!(attribute in this.data.values)) {
      // eslint-disable-next-line no-console
      console.warn('Failed to set attribute ' + attribute);
      return false;
    }
    this.data.values[attribute] = value;
    switch (attribute) {
      case 'HP':
        Global.event_bus.emit('player-health-update');
        break;
      case 'XP':
        Global.event_bus.emit('player-xp-update');
        break;
    }
    return true;
  }

  get(attribute: string) {
    if (!(attribute in this.data.values))
      // eslint-disable-next-line no-console
      console.warn('Failed to set attribute ' + attribute);
    else return this.data.values[attribute];
  }

  createCannonEnd() {
    const body = this.data.values.components.cannon_body;
    const origin = body.position;
    const texture = this.scene.add.image(origin.x, origin.y, 'cannon');
    texture.scale = 0.4;
    texture.scaleY = 0.6;
    this.scene.matter.add.gameObject(texture, body);
  }

  createWheelAnimations() {
    if (Global.disable_graphics == true) return;
    this.anims.create({
      key: 'moving_right',
      frames: [
        { key: 'tank_1' },
        { key: 'tank_2' },
        { key: 'tank_3' },
        { key: 'tank_4' }
      ],
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: 'moving_left',
      frames: [
        { key: 'tank_4' },
        { key: 'tank_3' },
        { key: 'tank_2' },
        { key: 'tank_1' }
      ],
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'idle',
      frames: [{ key: 'tank_1', frame: undefined }],
      frameRate: 20,
      repeat: 1
    });
  }

  anim_state = 'idle';
  frame_rate: integer = 0;
  updateAnimations() {
    if (Global.disable_graphics == true) return;
    let new_anim_state = '';
    const max_frame_rate = 24; // Frame rate in full speed
    const frame_rate_step = 6; // Step between different frame rate levels
    const frame_rate_level =
      Math.abs(this.body.velocity.x / this.data.values.speed.ground) *
      (max_frame_rate / frame_rate_step);
    const new_frame_rate = Math.min(
      Math.round(frame_rate_level) * frame_rate_step,
      max_frame_rate
    );

    if (
      !this.data.values.sensors.bottom.blocked ||
      (this.body.velocity.x < 0.1 && this.body.velocity.x > -0.1)
    ) {
      new_anim_state = 'idle';
    } else if (this.body.velocity.x > 0) {
      new_anim_state = 'moving_right';
    } else if (this.body.velocity.x < 0) {
      new_anim_state = 'moving_left';
    }

    if (new_anim_state != 'idle')
      this.anims.get(new_anim_state).frameRate = new_frame_rate;

    if (
      new_anim_state == this.anim_state &&
      new_frame_rate == this.frame_rate
    ) {
      // No amination changes
      return false;
    }

    this.anim_state = new_anim_state;
    this.frame_rate = new_frame_rate;
    this.play(new_anim_state);
    return true;
  }
}
