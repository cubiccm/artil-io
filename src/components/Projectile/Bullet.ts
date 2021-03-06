import Global from '@/global';
import BaseProjectile from './BaseProjectile';
import CircularDestruction from '@/components/Destruction/CircularDestruction';
import RectangularDestruction from '@/components/Destruction/RectangularDestruction';
import BaseDestruction from '@/components/Destruction/BaseDestruction';
import NaturalDestruction from '@/components/Destruction/NaturalDestruction';
import Platform from '@/components/Platform';

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
    this.bullet_type = 'bullet';
    this.base_damage = 50;
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
      natural_destruction.getNewTerrain(position, velocity, terrain)
    );
  }
}
