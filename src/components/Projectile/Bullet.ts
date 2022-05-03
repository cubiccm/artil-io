import Global from '@/global';
import BaseProjectile from './BaseProjectile';
import CircularDestruction from '@/components/Destruction/CircularDestruction';
import RectangularDestruction from '@/components/Destruction/RectangularDestruction';
import BaseDestruction from '@/components/Destruction/BaseDestruction';
import NaturalDestruction from '@/components/Destruction/NaturalDestruction';
import Platform from '@/components/Platform';
import { RawBulletData } from '@/types/RawData';

export default class Bullet extends BaseProjectile {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    parent?: any
  ) {
    super(scene, x, y, vx, vy, parent);
    this.body.gravityScale = { x: 1, y: 4 };
  }

  get raw(): RawBulletData {
    return {
      x: this.body.position.x,
      y: this.body.position.y,
      vx: this.body.velocity.x,
      vy: this.body.velocity.y,
      player: this.parent?.player?.ID
    };
  }

  createObject() {
    const r = 5;
    const texture = this.scene.add.circle(0, 0, r, 0xffa500);
    this.add(texture);
    // avoid clipping
    const body = this.scene.matter.add.circle(0, 0, 2 * r);
    body.label = 'Base Bullet';
    this.scene.matter.add.gameObject(this, body);
  }

  createDestruction(
    position: MatterJS.Vector,
    velocity: MatterJS.Vector,
    terrain: Platform
  ) {
    // Natural Destruction
    const natural_destruction = new NaturalDestruction(this.scene, {
      r: 100,
      intensity: 1.5
    });

    // Circular Destruction
    const circular_destruction = new CircularDestruction(this.scene, {
      r: 70
    });

    // Rectangular Destruction
    const rectangular_destruction = new RectangularDestruction(this.scene, {
      w: 100,
      r: 50
    });

    terrain?.onCollide(
      circular_destruction.getNewTerrain(position, velocity, terrain)
    );

    // funny bullet
    // const verts = CircularDestruction.getVerts(50);
    // Math.random() > 0.5
    // ? CircularDestruction.getVerts(50)
    // : RectangularDestruction.getVerts(100, 50);

    // const sensor = new CircularDestruction(
    //   this.scene,
    //   position.x,
    //   position.y,
    //   verts
    // );
  }
}
