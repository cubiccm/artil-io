import BaseDestruction from './BaseDestruction';
import * as _ from 'lodash';
import Platform from '@/components/Platform';

export default class CircularDestruction extends BaseDestruction {
  r: number;

  getNewTerrain(
    position: MatterJS.Vector,
    velocity: MatterJS.Vector,
    terrain: Platform
  ) {
    const r = this.r;
    const angle_div = 30;
    const destruction_vertices: MatterJS.Vector[] = [];
    _.range(0, angle_div).forEach((i) => {
      const angle = ((Math.PI * 2) / angle_div) * i;
      const px = r * Math.cos(angle);
      const py = r * Math.sin(angle);
      destruction_vertices.push({ x: px, y: py });
    });
    return this.destruct(position, terrain, destruction_vertices);
  }

  constructor(scene: Phaser.Scene, properties: any) {
    super(scene, properties);
    this.r = properties.r || 50;
  }
}
