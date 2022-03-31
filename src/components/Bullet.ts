import * as types from '@/types';
import Global from '@/global';
import Tank from '@/components/Tank';
import { BodyFactory } from 'matter';

export default class Bullet {
  body: Phaser.Physics.Matter.Sprite;
  parent: Tank;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    velocity_x: number,
    velocity_y: number,
    parent: Tank
  ) {
    const r = 5;
    const texture = scene.add.circle(0, 0, r, 0xffffff);
    const rigid = scene.matter.add.circle(x, y, r);
    this.body = scene.matter.add.gameObject(texture, rigid) as Phaser.Physics.Matter.Sprite;
    this.body.setVelocity(velocity_x, velocity_y);
    this.parent = parent;
    this.body.setOnCollide( (pair: MatterJS.ICollisionData) => {
      // Collision target: pair.bodyA
      // Deal damage, destroy terrian, etc.
      this.body.destroy();
      // Remove this bullet from parent
      if (this.parent != null) {
        this.parent.data.values.bullets =
          this.parent.data.values.bullets.filter((v: any) => {
            return v != this;
          });
      }
    });
  }
}
