import * as types from '@/types';
import SmoothedHorionztalControl from '@/scripts/control';
import Global from '@/global';
import TankSensor from '@/components/Tank/TankSensor';
import Game from '@/scenes/Game';
import Login from '@/scenes/Login';
import HUD from '@/scenes/HUD';

export default abstract class BaseTank extends Phaser.Physics.Matter.Sprite {
  public smoothedControls!: SmoothedHorionztalControl;
  public static skins = [
    'green',
    'orange',
    'yellow',
    'blue',
    'purple',
    'pink',
    'brown',
    'colorful',
    'space'
  ];
  hp_graphics!: Phaser.GameObjects.Graphics;
  declare body: MatterJS.BodyType;
  public get tank_data(): types.TankData {
    return this.data.values as types.TankData;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene.matter.world, x, y, 'greentank', undefined, {
      label: 'tank',
      shape: scene.cache.json.get('tank_shape').tank
    } as Phaser.Types.Physics.Matter.MatterBodyConfig);
    scene.add.existing(this);
    this.hp_graphics = scene.add.graphics();
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
      time: {
        leftDown: 0,
        rightDown: 0
      },
      lastJumpedAt: 0,
      lastFiredAt: 0,
      speed: {
        run: 2,
        jump: 6
      },
      max_health: 200,
      HP: 100,
      XP: 1000,
      regen_factor: 1,
      reload: 300,
      id: 'player',
      team: 'blue',
      bullet_speed: 1,
      weapon: 'bullet',
      weapon_damage: 1,
      bullets: [],
      components: {
        cannon_texture: undefined,
        cannon_body: undefined,
        health_bar: undefined,
        name: this.scene.add.text(0, 0, '')
      },
      skin: 'greentank'
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
    this.data.values.sensors.left = new TankSensor(
      scene.matter.bodies.rectangle(sx - w * 0.45, sy + 400, 5, h * 0.2, {
        isSensor: true
      }),
      this,
      'L',
      true
    );
    this.data.values.sensors.right = new TankSensor(
      scene.matter.bodies.rectangle(sx + w * 0.47, sy + 400, 5, h * 0.2, {
        isSensor: true
      }),
      this,
      'R',
      true
    );

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
    this.data.values.components.health_bar = this.drawHealthBar();
    // Setup tank animations
    this.createWheelAnimations();
    Game.scene.events.on(
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
    Game.scene.events.on(
      Phaser.Scenes.Events.UPDATE,
      (time: number, delta: number) => {
        this.update(time, delta);
      }
    );

    this.smoothedControls = new SmoothedHorionztalControl(this, 0.0005);
  }

  createCannonEnd() {
    const body = this.data.values.components.cannon_body;
    const origin = body.position;
    const texture = this.scene.add.image(
      origin.x,
      origin.y,
      this.tank_data.skin + '-cannon'
    );
    texture.scale = 0.4;
    texture.scaleY = 0.6;
    this.data.values.components.cannon_texture =
      this.scene.matter.add.gameObject(texture, body);
  }
  drawHealthBar() {
    this.hp_graphics.clear();
    const origin = this.data.values.components.cannon_body.position;
    const current_health = this.data.values.HP;
    const max_health = this.data.values.max_health;
    const bar_width = 80,
      bar_height = 10;
    const bottom_margin = 38;
    const outline_color = 0xffa500,
      outline_alpha = 1;
    const fill_color = 0xffa500,
      fill_alpha = 0.5;

    this.hp_graphics.lineStyle(2, outline_color, outline_alpha);
    this.hp_graphics.strokeRoundedRect(
      origin.x - bar_width / 2,
      origin.y - bottom_margin,
      bar_width,
      bar_height,
      bar_height / 2
    );
    this.hp_graphics.fillStyle(fill_color, fill_alpha);
    this.hp_graphics.fillRoundedRect(
      origin.x - bar_width / 2,
      origin.y - bottom_margin,
      bar_height + (bar_width - bar_height) * (current_health / max_health),
      bar_height,
      bar_height / 2
    );
    this.data.values.components.name.destroy();
    this.data.values.components.name = this.scene.add
      .text(origin.x, origin.y - bottom_margin - 10, HUD.playerName, {
        fontSize: '10pt',
        fontFamily: 'monospace',
        align: 'center',
        color: 'rgba(255, 255, 255, .8)',
        stroke: '#000000',
        strokeThickness: 2
      })
      .setOrigin(0.5);
  }
  createWheelAnimations() {
    let frames;
    if (this.tank_data.skin == 'colorful') frames = 12;
    else if (this.tank_data.skin == 'space') frames = 10;
    else frames = 4;
    this.anims.create({
      key: 'moving_right',
      frames: this.anims.generateFrameNames(this.tank_data.skin, {
        prefix: 'tank',
        start: 1,
        end: frames,
        zeroPad: 2
      }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'moving_left',
      frames: this.anims.generateFrameNames(this.tank_data.skin, {
        prefix: 'tank',
        start: frames,
        end: 1,
        zeroPad: 2
      }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: 'idle',
      frames: [{ key: this.tank_data.skin, frame: 'tank01' }],
      frameRate: 20,
      repeat: 1
    });
  }

  anim_state = 'idle';
  frame_rate: integer = 0;
  updateAnimations() {
    let new_anim_state = '';
    const max_frame_rate = 24; // Frame rate in full speed
    const frame_rate_step = 6; // Step between different frame rate levels
    const frame_rate_level =
      Math.abs(this.body.velocity.x / this.data.values.speed.run) *
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
