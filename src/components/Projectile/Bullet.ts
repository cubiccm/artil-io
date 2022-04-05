import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import Game from '@/scenes/Game';
import BaseProjectile from './BaseProjectile';

export default class Bullet extends BaseProjectile {
  // body: Phaser.Physics.Matter.Sritpe;
  // parent: BaseTank;
  // scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    parent: BaseTank
  ) {
    super(scene, x, y, vx, vy, parent);
  }

  drawObject() {
    const r = 5;
    const texture = this.scene.add.circle(0, 0, r, 0xff0000);
    this.add(texture);
    const body = this.scene.matter.add.circle(0, 0, r);
    body.label = 'Base Bullet';
    this.scene.matter.add.gameObject(this, body);
  }
}
