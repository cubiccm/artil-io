import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import Game from '@/scenes/Game';

export default abstract class BaseProjectile extends Phaser.GameObjects
  .Container {
  // body: Phaser.Physics.Matter.Sritpe;
  parent: BaseTank;
  scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    velocity_x: number,
    velocity_y: number,
    parent: BaseTank
  ) {
    super(scene);
    this.scene = scene;
    this.parent = parent;
    this.drawObject();
    const body = this.body as MatterJS.BodyType;
    Game.scene.matter.body.setPosition(body, { x: x, y: y });
    Game.scene.matter.body.setVelocity(body, { x: velocity_x, y: velocity_y });
    body.collisionFilter.category = Global.CATEGORY_PROJECTILE;
    body.collisionFilter.mask =
      Global.CATEGORY_TERRAIN | Global.CATEGORY_TANK | Global.CATEGORY_POINT;
    // Collision event
    body.onCollideCallback = (pair: MatterJS.IPair) => {
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

  drawObject() {
    // abstract class
  }
}
