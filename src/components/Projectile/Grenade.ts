import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import Game from '@/scenes/Game';
import BaseProjectile from './BaseProjectile';
import CircularDestruction from '../Destruction/CircularDestruction';
import RectangularDestruction from '../Destruction/RectangularDestruction';
import BaseDestruction from '../Destruction/BaseDestruction';

const speed_factor = 0.8;
export default class Grenade extends BaseProjectile {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    parent: BaseTank
  ) {
    super(scene, x, y, vx * speed_factor, vy * speed_factor, parent);
    this.body.gravityScale = { x: 2, y: 4 };
  }

  createObject() {
    const r = 10;
    const texture = this.scene.add.circle(0, 0, r, 0x39ff14);
    this.add(texture);
    // avoid clipping
    const body = this.scene.matter.add.circle(0, 0, 2 * r);
    body.label = 'Grenade';
    this.scene.matter.add.gameObject(this, body);
  }

  createDestruction(x: number, y: number) {
    const verts = CircularDestruction.getVerts(75);
    const sensor = new CircularDestruction(this.scene, x, y, verts);
  }
}
