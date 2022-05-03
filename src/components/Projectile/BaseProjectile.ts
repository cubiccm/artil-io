import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import Game from '@/scenes/Game';
import { Vector2 } from '@/types';

export default abstract class BaseProjectile extends Phaser.GameObjects
  .Container {
  parent: BaseTank;
  declare body: MatterJS.BodyType;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    velocity_x: number,
    velocity_y: number,
    parent: BaseTank
  ) {
    super(scene);
    this.parent = parent;
    this.createObject();
    const body = this.body as MatterJS.BodyType;
    Game.scene.matter.body.setPosition(body, { x: x, y: y });
    Game.scene.matter.body.setVelocity(body, {
      x: velocity_x * parent.tank_data.bullet_speed,
      y: velocity_y * parent.tank_data.bullet_speed
    });
    body.collisionFilter.category = Global.CATEGORY_PROJECTILE;
    body.collisionFilter.mask =
      Global.CATEGORY_TERRAIN | Global.CATEGORY_TANK | Global.CATEGORY_POINT;
    // Collision event
    body.onCollideCallback = (pair: MatterJS.ICollisionPair) => {
      if (!this.active) return;
      const support = pair.collision.supports[0];
      this.createDestruction(support.x, support.y);
      this.destroy();
      // Remove this bullet from parent
      if (this.parent != null) {
        this.parent.data.values.bullets =
          this.parent.data.values.bullets.filter((v: any) => {
            return v != this;
          });
      }
    };
    this.scene.add.existing(this);
  }

  createObject() {
    // abstract class, will be overwritten
    return;
  }

  createDestruction(x: number, y: number) {
    // abstract class, will be overwritten
    return;
  }

  setVelocity(velocity_x: number, velocity_y: number) {
    Game.scene.matter.body.setVelocity(this.body as MatterJS.BodyType, {
      x: velocity_x,
      y: velocity_y
    });
  }
  getVelocity() {
    return (this.body as MatterJS.BodyType).velocity;
  }
}
