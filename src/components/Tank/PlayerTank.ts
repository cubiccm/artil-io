import Global from '@/global';
import Game from '@/scenes/Game';
import BaseTank from '@/components/Tank/BaseTank';
import HUD from '@/scenes/HUD';
export default class PlayerTank extends BaseTank {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    scene.events.on(
      Phaser.Scenes.Events.POST_UPDATE,
      () => {
        if (!this.active) return;
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
        Global.socket.sync(this.raw, true);
      },
      this
    );
  }

  set(attribute: string, value: any) {
    switch (attribute) {
      case 'HP':
        Global.event_bus.emit('player-health-update');
        break;
      case 'XP':
        Global.event_bus.emit('player-xp-update');
        break;
    }
    return super.set(attribute, value);
  }

  update(time: number, delta: number) {
    if (this.active == false || (this.scene as Game).initiated == false) return;
    const keyboard = this.scene.input.keyboard;
    const pointer = this.scene.input.activePointer;
    const keys: any = Game.keys;

    const prev_direction = this.moving_direction;
    if (keyboard.checkDown(keys.LEFT) || keyboard.checkDown(keys.A)) {
      this.moving_direction = -1;
    } else if (keyboard.checkDown(keys.RIGHT) || keyboard.checkDown(keys.D)) {
      this.moving_direction = 1;
    } else {
      this.moving_direction = 0;
    }

    if (this.moving_direction != prev_direction) {
      Global.socket.sync(this.raw);
    }

    if (keyboard.checkDown(keys.UP) || keyboard.checkDown(keys.SPACE)) {
      this.jump(time, delta);
    }

    if (keyboard.checkDown(keys.DOWN) || keyboard.checkDown(keys.S)) {
      // not implemented
    }

    if (
      pointer.leftButtonDown() &&
      !HUD.inHUDBounds(
        this.scene.input.mousePointer.x,
        this.scene.input.mousePointer.y
      )
    ) {
      if (this.is_firing == false) {
        this.is_firing = true;
        Global.socket.fire([this.get('weapon'), this.raw]);
      }
    } else {
      if (this.is_firing == true) {
        this.is_firing = false;
        Global.socket.stopFire();
      }
    }

    super.update(time, delta);
  }

  jump(time: number, delta: number) {
    const canJump = time - this.data.values.lastJumpedAt > 250;
    if (canJump) {
      if (this.data.values.sensors.bottom.blocked) {
        this.setVelocityY(-this.data.values.speed_jump);
        this.data.values.lastJumpedAt = time;
      } else if (this.data.values.sensors.left.blocked) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed_jump);
        this.setVelocityX(this.data.values.speed_ground);
        this.data.values.lastJumpedAt = time;
      } else if (this.data.values.sensors.right.blocked) {
        // Jump up and away from the wall
        this.setVelocityY(-this.data.values.speed_jump);
        this.setVelocityX(-this.data.values.speed_ground);
        this.data.values.lastJumpedAt = time;
      }
    }
  }
}
