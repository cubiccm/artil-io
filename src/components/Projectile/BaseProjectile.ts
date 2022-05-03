import Global from '@/global';
import Platform from '@/components/Platform';

export default abstract class BaseProjectile extends Phaser.GameObjects
  .Container {
  parent?: any;
  declare body: MatterJS.BodyType;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    velocity_x: number,
    velocity_y: number,
    parent?: any
  ) {
    super(scene);
    if (parent) this.parent = parent;
    this.createObject();
    const body = this.body as MatterJS.BodyType;
    scene.matter.body.setPosition(body, { x: x, y: y });
    scene.matter.body.setVelocity(body, {
      x: velocity_x * parent.tank_data.bullet_speed,
      y: velocity_y * parent.tank_data.bullet_speed
    });
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
      this.selfDestroy();
    };
    this.scene.add.existing(this);
  }

  selfDestroy() {
    // Remove this bullet from parent tank
    this.parent?.set(
      'bullets',
      this.parent?.get('bullets').filter((v: any) => {
        return v != this;
      })
    );
    this.destroy();
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

  setVelocity(velocity_x: number, velocity_y: number) {
    this.scene.matter.body.setVelocity(this.body as MatterJS.BodyType, {
      x: velocity_x,
      y: velocity_y
    });
  }
  getVelocity() {
    return (this.body as MatterJS.BodyType).velocity;
  }
}
