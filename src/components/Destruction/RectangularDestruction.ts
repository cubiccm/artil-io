import BaseDestruction from './BaseDestruction';
import * as _ from 'lodash';

export default class RectangularDestruction extends BaseDestruction {
  static getVerts(w: number, h: number) {
    const angle_div = 30;
    const destruction_vertices: MatterJS.Vector[] = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h }
    ];
    return destruction_vertices;
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vertices: MatterJS.Vector[]
  ) {
    super(scene, x, y, vertices);
  }
}
