import Global from '@/global';
import Bullet from '@/components/Projectile/Bullet';
import Game from '@/scenes/Game';
import BaseTank from '@/components/Tank/BaseTank';

export default class PlayerTank extends BaseTank {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.body.parts.forEach((part: any) => {
      part.collisionFilter.category = Global.CATEGORY_TANK;
      part.collisionFilter.mask =
        Global.CATEGORY_TERRAIN |
        Global.CATEGORY_TANK |
        Global.CATEGORY_PROJECTILE |
        Global.CATEGORY_DESTRUCTION |
        Global.CATEGORY_POWERUP;
    });

    Game.scene.events.on(
      Phaser.Scenes.Events.POST_UPDATE,
      () => {
        const cursor_x =
          this.scene.input.mousePointer.x + this.scene.cameras.main.scrollX;
        const cursor_y =
          this.scene.input.mousePointer.y + this.scene.cameras.main.scrollY;
        const cannon = this.data.values.components.cannon_body;

        let angle = Math.atan2(
          cursor_y - cannon.position.y,
          cursor_x - cannon.position.x
        );
        const tank_angle = this.body.angle;
        const max_angle = (15 / 180) * Math.PI;
        if (
          tank_angle - angle < -max_angle &&
          tank_angle - angle > max_angle - Math.PI
        ) {
          if (tank_angle - angle >= -Math.PI / 2)
            angle = tank_angle + max_angle;
          else angle = tank_angle + Math.PI - max_angle;
        }
        this.scene.matter.body.setAngle(cannon, angle);
      },
      this
    );
  }

  receive(message: any) {
    // sync data
  }

  send(message: any) {
    // sync data
  }

  update(time: number, delta: number) {
    const keyboard = Game.scene.input.keyboard;
    const pointer = Game.scene.input.activePointer;
    const keys: any = Game.keys;

    if (keyboard.checkDown(keys.LEFT) || keyboard.checkDown(keys.A)) {
      this.moveLeft(time, delta);
    }

    if (keyboard.checkDown(keys.RIGHT) || keyboard.checkDown(keys.D)) {
      this.moveRight(time, delta);
    }

    if (keyboard.checkDown(keys.UP) || keyboard.checkDown(keys.SPACE)) {
      this.jump(time, delta);
    }

    if (keyboard.checkDown(keys.DOWN) || keyboard.checkDown(keys.S)) {
      // not implemented
    }

    if (pointer.leftButtonDown()) {
      const cam = Game.scene.cameras.main;
      const cursor_x = pointer.x + cam.scrollX;
      const cursor_y = pointer.y + cam.scrollY;
      this.fire(time, delta, { x: cursor_x, y: cursor_y });
    }

    if (time % 5 == 0) {
      this.tank_data.HP = Math.min(
        this.data.values.regen_factor + this.tank_data.HP,
        this.tank_data.max_health
      );
    }
  }

  moveLeft(time: number, delta: number) {
    if (!this.data.values.sensors.left.blocked) {
      this.smoothedControls.moveLeft(delta);
      // matterSprite.anims.play('left', true);

      const oldVelocityX = this.body.velocity.x;
      const targetVelocityX = -this.data.values.speed.run;
      const newVelocityX = Phaser.Math.Linear(
        oldVelocityX,
        targetVelocityX,
        -this.smoothedControls.value
      );

      this.setVelocityX(newVelocityX);
    }

    if (!this.data.values.sensors.bottom.blocked) {
      this.setAngularVelocity(-0.005); // For rotating in the air
    } else if (this.data.values.sensors.left.blocked) {
      this.setAngularVelocity(0.01); // For climbing
    }
  }

  moveRight(time: number, delta: number) {
    if (!this.data.values.sensors.right.blocked) {
      this.smoothedControls.moveRight(delta);
      // matterSprite.anims.play('right', true);

      const oldVelocityX = this.body.velocity.x;
      const targetVelocityX = this.data.values.speed.run;
      const newVelocityX = Phaser.Math.Linear(
        oldVelocityX,
        targetVelocityX,
        this.smoothedControls.value
      );

      this.setVelocityX(newVelocityX);
    }

    if (!this.data.values.sensors.bottom.blocked) {
      this.setAngularVelocity(0.005);
    } else if (this.data.values.sensors.right.blocked) {
      this.setAngularVelocity(-0.01);
    }
  }

  jump(time: number, delta: number) {
    const canJump = time - this.data.values.lastJumpedAt > 250;
    if (canJump) {
      if (this.data.values.sensors.bottom.blocked) {
        this.setVelocityY(-this.data.values.speed.jump);
        this.data.values.lastJumpedAt = time;
      } else if (this.data.values.sensors.left.blocked) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed.jump);
        this.setVelocityX(this.data.values.speed.run);
        this.data.values.lastJumpedAt = time;
      } else if (this.data.values.sensors.right.blocked) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed.jump);
        this.setVelocityX(-this.data.values.speed.run);
        this.data.values.lastJumpedAt = time;
      }
    }
  }

  fire(time: number, delta: number, cursor: MatterJS.Vector) {
    var canFire = time - this.data.values.lastFiredAt > this.data.values.reload;
    Global.event_bus.once('HUD_clicked', () => {
      canFire = false;
    });
    if (!canFire) return;
    const origin = this.data.values.components.cannon_body.position;
    const angle = this.data.values.components.cannon_body.angle;
    const cannon_length = 30;
    const velocity = 30;
    const vx = velocity * Math.cos(angle);
    const vy = velocity * Math.sin(angle);
    this.data.values.bullets.push(
      new Bullet(
        this.scene,
        origin.x + Math.cos(angle) * cannon_length,
        origin.y + Math.sin(angle) * cannon_length,
        vx,
        vy,
        this.tank_data.bullet_speed,
        this
      )
    );
    this.data.values.lastFiredAt = time;
  }
}
