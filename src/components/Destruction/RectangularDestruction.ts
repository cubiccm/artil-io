import BaseDestruction from './BaseDestruction';
import * as _ from 'lodash';
import Platform from '@/components/Platform';

export default class RectangularDestruction extends BaseDestruction {
  w: number;
  h: number;
  getNewTerrain(
    position: MatterJS.Vector,
    velocity: MatterJS.Vector,
    terrain: Platform
  ) {
    const destruction_vertices: MatterJS.Vector[] = [
      { x: -this.w / 2, y: -this.h / 2 },
      { x: this.w / 2, y: -this.h / 2 },
      { x: this.w / 2, y: this.h / 2 },
      { x: -this.w / 2, y: this.h / 2 }
    ];
    return this.destruct(position, terrain, destruction_vertices);
  }

  constructor(scene: Phaser.Scene, properties: any) {
    super(scene, properties);
    this.w = properties.w || 50;
    this.h = properties.h || 50;
  }
}
