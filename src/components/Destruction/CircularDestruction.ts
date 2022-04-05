import { Vector2 } from '@/types';
import BaseDestruction from './BaseDestruction';
import * as _ from 'lodash';

export default class CircularDestruction extends BaseDestruction {
  static getVerts(r?: number) {
    if (r === undefined) r = 50;
    const angle_div = 30;
    const destruction_vertices: Vector2[] = [];
    _.range(0, angle_div).forEach((i) => {
      const angle = ((Math.PI * 2) / angle_div) * i;
      const px = r! * Math.cos(angle);
      const py = r! * Math.sin(angle);
      destruction_vertices.push({ x: px, y: py });
    });
    return destruction_vertices;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, vertices: Vector2[]) {
    super(scene, x, y, vertices);
  }
}
