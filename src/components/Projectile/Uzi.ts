import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import BaseProjectile from './BaseProjectile';
import Platform from '../Platform';
import NaturalDestruction from '../Destruction/NaturalDestruction';

const speed_factor = 1.5;
export default class Uzi extends BaseProjectile {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    parent: BaseTank
  ) {
    super(scene, x, y, vx * speed_factor, vy * speed_factor, parent);
    this.body.gravityScale = { x: 0, y: 2 };
    this.bullet_type = 'uzi';
    this.base_damage = 30;
  }

  createObject() {
    const r = 3;
    const texture = this.scene.add.circle(0, 0, r, 0xfff857);
    this.add(texture);
    // avoid clipping
    const body = this.scene.matter.add.circle(0, 0, 2 * r);
    body.label = 'Uzi';
    this.scene.matter.add.gameObject(this, body);
  }

  createDestruction(
    position: MatterJS.Vector,
    velocity: MatterJS.Vector,
    terrain: Platform
  ) {
    const natural_destruction = new NaturalDestruction(this.scene, {
      r: 50,
      intensity: 1
    });

    terrain?.onCollide(
      natural_destruction.getNewTerrain(position, velocity, terrain)
    );
  }
}
