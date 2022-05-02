const fire_cooldown = 250;

import * as types from '@/types';
import Global from '@/global';
import TankSensor from '@/components/Tank/TankSensor';
import { RawTankData } from '@/types/RawData';
import Bullet from '@/components/Projectile/Bullet';
import Core from '@/scenes/Core';
import Player from '@/components/Player';

export default abstract class BaseTank extends Phaser.Physics.Matter.Sprite {
  declare body: MatterJS.BodyType;
  player?: Player;

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
        if (this.body.position.y >= Global.WORLD_HEIGHT / 2) {
          this.setPosition(this.x, -Global.WORLD_HEIGHT / 2);
        } else if (this.body.position.y < -Global.WORLD_HEIGHT / 2) {
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

  get raw(): RawTankData {
    return {
      x: this.body.position.x,
      y: this.body.position.y,
      vx: this.body.velocity.x,
      vy: this.body.velocity.y,
      thrust: this.getThrustSpeed(),

      b_ang: this.body.angle,
      vang: this.body.angularVelocity,

      c_ang: this.getCannonAngle()
    };
  }

  syncRemote(remote: RawTankData) {
    // Estimates location displacement based on velocity and network delay
    const exp_delay = 400;
    const remote_velocity = new Phaser.Math.Vector2();
    remote_velocity.set(remote.vx || 0, remote.vy || 0);
    const local = this.body.position;
    const local_velocity = new Phaser.Math.Vector2();
    local_velocity.set(this.body.velocity.x, this.body.velocity.y);
    const proximity = Math.max(
      ((exp_delay * 60) / 1000) *
        Math.max(local_velocity.length(), remote_velocity.length()),
      20
    );
    const difference = Math.min(
      Phaser.Math.Distance.BetweenPointsSquared(
        {
          x: remote.x,
          y: remote.y
        },
        {
          x: local.x,
          y: local.y
        }
      ),
      Phaser.Math.Distance.BetweenPointsSquared(
        {
          x: remote.x,
          y:
            (remote.y || 0) +
            ((remote.y || 0) > 0
              ? -Global.WORLD_HEIGHT / 2
              : Global.WORLD_HEIGHT / 2)
        },
        {
          x: local.x,
          y:
            local.y +
            (local.y > 0 ? -Global.WORLD_HEIGHT / 2 : Global.WORLD_HEIGHT / 2)
        }
      )
    );
    // Global.console.log(
    //   `PROX ${proximity.toFixed(4)} DIFF ${Math.sqrt(difference).toFixed(4)}`,
    //   'Prox'
    // );
    if (difference > proximity * proximity) {
      // console.log(
      //   `REMOTE p(${remote.x?.toFixed(1)}, ${remote.y?.toFixed(
      //     1
      //   )}) v(${remote.vx?.toFixed(2)}, ${remote.vy?.toFixed(2)}) LOCAL p(${
      //     local.x
      //   }, ${local.y}) v(${this.body.velocity.x?.toFixed(
      //     2
      //   )}, ${this.body.velocity.y?.toFixed(2)}) PROX ${proximity?.toFixed(
      //     4
      //   )} DIFF ${Math.sqrt(difference)?.toFixed(4)}`
      // );
      this.moveTo(remote.x || 0, remote.y || 0);
      this.setSpeed(remote.vx || 0, remote.vy || 0);
      this.rotateBody(remote.b_ang || 0);
      this.setAngularVelocity(remote.vang || 0);
    }
  }

  moveTo(x: number, y: number) {
    this.setPosition(x, y);
  }

  setSpeed(vx: number, vy: number) {
    this.setVelocity(vx, vy);
  }

  moving_direction = 0;
  update(time: number, delta: number) {
    if (this.moving_direction < 0) this.moveLeft();
    else if (this.moving_direction > 0) this.moveRight();
    if (this.is_firing == true) {
      const now = Date.now();
      if (this.get('lastFiredAt') + fire_cooldown < now) {
        this.set('lastFiredAt', now);
        this.fire();
      }
    }
  }

  getThrustSpeed() {
    return this.moving_direction;
  }

  setThrustSpeed(speed?: number) {
    if (!speed) speed = 0;
    if (speed == 0) this.moving_direction = 0;
    else this.moving_direction = speed > 0 ? 1 : -1;
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

  setCannonAngle(angle?: number) {
    if (!angle) angle = 0;
    const cannon = this.data.values.components.cannon_body;
    this.scene.matter.body.setAngle(cannon, angle);
  }

  is_firing = false;
  setFireStatus(status: boolean) {
    this.is_firing = status;
  }

  fire() {
    const origin = this.data.values.components.cannon_body.position;
    const angle = this.data.values.components.cannon_body.angle;
    const cannon_length = 30;
    const velocity = 30;
    const vx = velocity * Math.cos(angle);
    const vy = velocity * Math.sin(angle);
    const bullet = new Bullet(
      this.scene,
      origin.x + Math.cos(angle) * cannon_length,
      origin.y + Math.sin(angle) * cannon_length,
      vx,
      vy,
      this
    );
    this.get('bullets').push(bullet);
    if ('onNewBullet' in this.scene) {
      (this.scene as Core)?.onNewBullet(bullet);
    }
  }

  set(attribute: string, value: any) {
    if (!(attribute in this.data.values)) {
      // eslint-disable-next-line no-console
      console.warn('Attribute not found: ' + attribute);
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
      console.warn('Attribute not found: ' + attribute);
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
