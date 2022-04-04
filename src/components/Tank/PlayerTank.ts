import * as types from '@/types';
import SmoothedHorionztalControl from '@/scripts/control';
import Global from '@/global';
import TankSensor from '@/components/TankSensor';
import Bullet from '@/components/Bullet';
import Game from '@/scenes/Game';
import BaseTank from '@/components/Tank/BaseTank';

export default class PlayerTank extends BaseTank {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  recive(message: any) {
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
      this.fire(time, delta, new Phaser.Math.Vector2(cursor_x, cursor_y));
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

  fire(time: number, delta: number, cursor: Phaser.Math.Vector2) {
    const canFire = time - this.data.values.lastFiredAt > 250;
    if (!canFire) return;
    const origin = this.data.values.components.cannon_end.position;
    const velocity = 30;
    const vx =
      velocity * Math.cos(Math.atan2(cursor.y - origin.y, cursor.x - origin.x));
    const vy =
      velocity * Math.sin(Math.atan2(cursor.y - origin.y, cursor.x - origin.x));
    this.data.values.bullets.push(
      new Bullet(this.scene, origin.x, origin.y, vx, vy, this)
    );
    this.data.values.lastFiredAt = time;
  }
}
