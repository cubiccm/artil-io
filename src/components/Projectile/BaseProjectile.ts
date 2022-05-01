import Global from '../../global.js';
import BaseTank from '../../components/Tank/BaseTank.js';
import Platform from '../../components/Platform.js';
import Game from '../../scenes/Game.js';

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
    Game.scene.matter.body.setVelocity(body, { x: velocity_x, y: velocity_y });
    body.collisionFilter.category = Global.CATEGORY_PROJECTILE;
    body.collisionFilter.mask =
      Global.CATEGORY_TERRAIN | Global.CATEGORY_TANK | Global.CATEGORY_POINT;
    // Collision event
    body.onCollideCallback = (pair: MatterJS.ICollisionPair) => {
      if (!this.active) return;
      const position = pair.collision.supports[0];
      const velocity = this.body.velocity;
      const terrain = (
        pair.bodyA == this.body ? pair.bodyB : pair.bodyA
      ) as MatterJS.BodyType;
      this.createDestruction(position, velocity, terrain.gameObject.controller);
      this.destroy();
      // Remove this bullet from parent tank
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

  createDestruction(
    position: MatterJS.Vector,
    velocity: MatterJS.Vector,
    terrain: Platform
  ) {
    // abstract class, will be overwritten
    return;
  }
}
