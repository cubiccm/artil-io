import BaseDestruction from './BaseDestruction';
import PolygonClipping from 'polygon-clipping';
import Platform from '@/components/Platform';
import _ from 'lodash';

export default class NaturalDestruction extends BaseDestruction {
  r: number;
  intensity: number;
  getNewTerrain(
    position: MatterJS.Vector,
    velocity: MatterJS.Vector,
    terrain: Platform
  ) {
    const r = this.r;
    const old_vertices: [number, number][] = _.map(terrain.vertices, (v) => [
      v.x,
      v.y
    ]);
    const new_vertices: [number, number][] = [];

    // Shift terrain based on explosion location & bullet velocity
    old_vertices.forEach((value) => {
      const dist = Math.sqrt(
        Math.pow(value[0] - position.x + terrain.anchor.x, 2) +
          Math.pow(value[1] - position.y + terrain.anchor.y, 2)
      );
      let coeff;
      if (dist <= r) {
        coeff = this.intensity * (1 - Math.pow(dist / r, 4));
      } else {
        coeff = 0;
      }
      new_vertices.push([
        value[0] + velocity.x * coeff,
        value[1] + velocity.y * coeff
      ]);
    });

    // Reduce sawtooth
    const reduce_sawtooth_strength = 0.33;
    const _n = new_vertices.length;
    for (let i = 0; i < _n; i++) {
      if (
        old_vertices[i][0] == new_vertices[i][0] &&
        old_vertices[i][1] == new_vertices[i][1]
      )
        continue;
      new_vertices[i][0] =
        (new_vertices[(i + _n - 1) % _n][0] +
          new_vertices[(i + 1) % _n][0] +
          (1 / reduce_sawtooth_strength) * new_vertices[i][0]) /
        (2 + 1 / reduce_sawtooth_strength);
      new_vertices[i][1] =
        (new_vertices[(i + _n - 1) % _n][1] +
          new_vertices[(i + 1) % _n][1] +
          (1 / reduce_sawtooth_strength) * new_vertices[i][1]) /
        (2 + 1 / reduce_sawtooth_strength);
    }

    return PolygonClipping.intersection([old_vertices], [new_vertices]);
  }

  constructor(scene: Phaser.Scene, properties: any) {
    super(scene, properties);
    this.r = properties.r || 75;
    this.intensity = properties.intensity || 1.0;
  }
}
