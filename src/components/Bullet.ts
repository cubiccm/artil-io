import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import { TerrainPolygon } from '@/types';

export default class Bullet {
  body: Phaser.Physics.Matter.Sprite;
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
    this.scene = scene;
    this.parent = parent;

    // Draw bullet
    this.body = this.drawBody(x, y);
    this.body.setVelocity(velocity_x, velocity_y);

    // Collision event
    this.body.setOnCollide((pair: any) => {
      this.body.destroy();
      const targetA = pair.bodyA as MatterJS.BodyType;
      switch (targetA.label) {
        case 'terrain':
          (targetA.gameObject as TerrainPolygon).controller.onCollide(
            pair.collision.supports[0]
          );
          break;
        case 'bullet':
          break;
        case 'tank':
          break;
      }

      const targetB = pair.bodyB as MatterJS.BodyType;
      switch (targetB.label) {
        case 'terrain':
          (targetB.gameObject as TerrainPolygon).controller.onCollide(
            pair.collision.supports[0]
          );
          break;
        case 'bullet':
          break;
        case 'tank':
          break;
      }

      // Remove this bullet from parent
      if (this.parent != null) {
        this.parent.data.values.bullets =
          this.parent.data.values.bullets.filter((v: any) => {
            return v != this;
          });
      }
    });
  }

  drawBody(x: number, y: number): Phaser.Physics.Matter.Sprite {
    const r = 5;
    const texture = this.scene.add.circle(0, 0, r, 0xffffff);
    const rigid = this.scene.matter.add.circle(x, y, r);
    rigid.label = 'bullet';
    return this.scene.matter.add.gameObject(
      texture,
      rigid
    ) as Phaser.Physics.Matter.Sprite;
  }

  handleCollision(target: MatterJS.BodyType): void {
    // Deal damage, destroy terrain, etc.
  }
}
