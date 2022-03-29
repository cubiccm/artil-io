import * as types from "@/types";
import SmoothedHorionztalControl from "@/scripts/control";
import Global from "@/global";

export default class Tank extends Phaser.Physics.Matter.Sprite {
  public smoothedControls!: SmoothedHorionztalControl;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene.matter.world, x, y, "tank", undefined, { shape: scene.cache.json.get("tank_shape").tank } as Phaser.Types.Physics.Matter.MatterBodyConfig);
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
      HP: 100,
    })
    let w = 1100;
    let h = 1100;

    var sx = w / 2;
    var sy = h / 2;

    scene.matter.body.translate(this.body as MatterJS.BodyType, { x: sx / 2 - 10, y: sy - 40 });

    // @ts-ignore
    scene.matter.body.setCentre(this.body, { x: 0, y: 0.45 * sy }, true);
    this.data.values.sensors.bottom = scene.matter.bodies.rectangle(sx, h, sx, 5, { isSensor: true });
    this.data.values.sensors.left = scene.matter.bodies.rectangle(sx - w * 0.45, sy + 250, 5, h * 0.4, { isSensor: true });
    this.data.values.sensors.right = scene.matter.bodies.rectangle(sx + w * 0.45, sy + 250, 5, h * 0.4, { isSensor: true });

    var compoundBody = scene.matter.body.create({
      parts: [
        this.body, this.data.values.sensors.bottom, this.data.values.sensors.left,
        this.data.values.sensors.right
      ],
      friction: 0.01,
      restitution: 0.05 // Prevent body from sticking against a wall
    });

    this.setExistingBody(compoundBody)
    this.setPosition(0, 0);
    this.setScale(0.15);

    this.smoothedControls = new SmoothedHorionztalControl(this, 0.0005);

    this.listenEvents();
  }

  moveLeft(time: number, delta: number) {
    if (!this.data.values.blocked.left) {
      this.smoothedControls.moveLeft(delta);
      // matterSprite.anims.play('left', true);

      let oldVelocityX = this.body.velocity.x;
      let targetVelocityX = -this.data.values.speed.run;
      let newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, -this.smoothedControls.value);
      this.setVelocityX(newVelocityX);
    }
  }

  moveRight(time: number, delta: number) {
    if (!this.data.values.blocked.right) {
      this.smoothedControls.moveRight(delta);
      // matterSprite.anims.play('right', true);

      let oldVelocityX = this.body.velocity.x;
      let targetVelocityX = this.data.values.speed.run;
      let newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, this.smoothedControls.value);
      this.setVelocityX(newVelocityX);
    }
  }

  jump(time: number, delta: number) {
    var canJump = (time - this.data.values.lastJumpedAt) > 250;
    if (canJump) {
      if (this.data.values.blocked.bottom) {
        this.setVelocityY(-this.data.values.speed.jump);
        this.data.values.lastJumpedAt = time;
      }
      else if (this.data.values.blocked.left) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed.jump);
        this.setVelocityX(this.data.values.speed.run);
        this.data.values.lastJumpedAt = time;
      }
      else if (this.data.values.blocked.right) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed.jump);
        this.setVelocityX(-this.data.values.speed.run);
        this.data.values.lastJumpedAt = time;
      }
    }
  }

  listenEvents() {
    let player_data = this.data.values;

    Global.event_bus.on("beforeupdate", (e: any) => {
      player_data.numTouching.left = 0;
      player_data.numTouching.right = 0;
      player_data.numTouching.bottom = 0;
    });

    Global.event_bus.on("afterupdate", (e: any) => {
      player_data.blocked.right = player_data.numTouching.right > 0 ? true : false;
      player_data.blocked.left = player_data.numTouching.left > 0 ? true : false;
      player_data.blocked.bottom = player_data.numTouching.bottom > 0 ? true : false;
    });

    Global.event_bus.on("playerMoveLeft", this.moveLeft);
    Global.event_bus.on("playerMoveRight", this.moveRight);
    Global.event_bus.on("playerJump", this.jump);

    Global.event_bus.on("playerSensorBottom", () => { 
      player_data.numTouching.bottom += 1 
    });

    Global.event_bus.on("playerSensorLeft", () => { 
      player_data.numTouching.left += 1 
    });
    
    Global.event_bus.on("playerSensorRight", () => { 
      player_data.numTouching.right += 1 
    });

    Global.event_bus.on("keydown-LEFT", (e: any) => {
      this.moveLeft(e.time, e.delta);
    });

    Global.event_bus.on("keydown-RIGHT", (e: any) => {
      this.moveRight(e.time, e.delta);
    });

    Global.event_bus.on("keydown-UP", (e: any) => {
      this.jump(e.time, e.delta);
    });
  }
}
