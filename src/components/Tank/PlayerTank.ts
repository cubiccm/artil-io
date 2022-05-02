import Global from '@/global';
import Bullet from '@/components/Projectile/Bullet';
import Game from '@/scenes/Game';
import BaseTank from '@/components/Tank/BaseTank';

export default class PlayerTank extends BaseTank {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    scene.events.on(
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

  move_direction = 0;
  update(time: number, delta: number) {
    const keyboard = this.scene.input.keyboard;
    const pointer = this.scene.input.activePointer;
    const keys: any = Game.keys;

    const prev_direction = this.move_direction;
    if (keyboard.checkDown(keys.LEFT) || keyboard.checkDown(keys.A)) {
      this.move_direction = -1;
      this.moveLeft();
    } else if (keyboard.checkDown(keys.RIGHT) || keyboard.checkDown(keys.D)) {
      this.move_direction = 1;
      this.moveRight();
    } else {
      this.move_direction = 0;
    }

    if (this.move_direction != prev_direction) {
      Global.socket.move(this.move_direction);
    }

    if (keyboard.checkDown(keys.UP) || keyboard.checkDown(keys.SPACE)) {
      this.jump(time, delta);
    }

    if (keyboard.checkDown(keys.DOWN) || keyboard.checkDown(keys.S)) {
      // not implemented
    }

    if (pointer.leftButtonDown()) {
      const cam = this.scene.cameras.main;
      const cursor_x = pointer.x + cam.scrollX;
      const cursor_y = pointer.y + cam.scrollY;
      this.fire(time, delta, { x: cursor_x, y: cursor_y });
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
        this.setVelocityX(this.data.values.speed.ground);
        this.data.values.lastJumpedAt = time;
      } else if (this.data.values.sensors.right.blocked) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed.jump);
        this.setVelocityX(-this.data.values.speed.ground);
        this.data.values.lastJumpedAt = time;
      }
    }
  }

  fire(time: number, delta: number, cursor: MatterJS.Vector) {
    const canFire = time - this.data.values.lastFiredAt > 250;
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
        this
      )
    );
    this.data.values.lastFiredAt = time;
  }
}
