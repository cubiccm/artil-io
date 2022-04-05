import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import Game from '@/scenes/Game';
import BaseProjectile from './BaseProjectile';
import CircularDestruction from '../Destruction/CircularDestruction';
import RectangularDestruction from '../Destruction/RectangularDestruction';
import BaseDestruction from '../Destruction/BaseDestruction';

export default class Bullet extends BaseProjectile {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    parent: BaseTank
  ) {
    super(scene, x, y, vx, vy, parent);
    this.body.gravityScale = { x: 0, y: 5 };
  }

  createObject() {
    const r = 5;
    const texture = this.scene.add.circle(0, 0, r, 0xff0000);
    this.add(texture);
    // avoid clipping
    const body = this.scene.matter.add.circle(0, 0, 2 * r);
    body.label = 'Base Bullet';
    this.scene.matter.add.gameObject(this, body);
  }

  createDestruction(x: number, y: number) {
    const verts =
      Math.random() > 0.5
        ? CircularDestruction.getVerts(50)
        : RectangularDestruction.getVerts(100, 50);

    const sensor = new CircularDestruction(this.scene, x, y, verts);
  }
}
