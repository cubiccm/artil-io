import * as types from '@/types';
import Global from '@/global';
import Tank from '@/components/Tank';
import { BodyFactory } from 'matter';
import generateTerrain from '@/scripts/terrainGenerator';

export default class Bullet {
  body: Phaser.Physics.Matter.Sprite;
  parent: Tank;
  scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    velocity_x: number,
    velocity_y: number,
    parent: Tank
  ) {
    this.scene = scene;
    this.parent = parent;

    // Draw bullet
    this.body = this.drawBody(x, y);
    this.body.setVelocity(velocity_x, velocity_y);

    // Collision event
    this.body.setOnCollide((pair: MatterJS.ICollisionData) => {
      this.body.destroy();
      const targetA = pair.bodyA as MatterJS.BodyType;
      switch (targetA.label) {
        case 'terrain':
          targetA.gameObject.controller.onCollide(pair.collision.supports[0]);
          break;
        case 'bullet':
          break;
        case 'tank':
          break;
      }

      const targetB = pair.bodyB as MatterJS.BodyType;
      switch (targetB.label) {
        case 'terrain':
          targetB.gameObject.controller.onCollide(pair.collision.supports[0]);
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
