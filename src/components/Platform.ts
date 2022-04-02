import _ from 'lodash';
import PolygonClipping from 'polygon-clipping';
import { Vector2, TerrainPolygon } from '@/types';

export default class Platform {
  public scene: Phaser.Scene;
  public anchor: Vector2;
  public vertices: Vector2[];
  public fillColor: number;
  public fillAlpha: number;
  public gameObject: Phaser.GameObjects.GameObject | null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vertices: Vector2[],
    fillColor?: number,
    fillAlpha?: number
  ) {
    // const poly = scene.add.polygon(x, y, vertices, 0x0000ff, 0.5); // wierd bug sometimes the shape skips some vertices?
    this.scene = scene;
    this.anchor = { x: x, y: y };
    this.vertices = vertices;
    this.fillColor = fillColor || 0x0000ff;
    this.fillAlpha = fillAlpha || 0.5;
    this.gameObject = this.createPlatform();
  }

  createPlatform(): Phaser.GameObjects.GameObject | null {
    let body: MatterJS.BodyType;
    this.vertices = [
      ...new Set(this.vertices.map((v) => JSON.stringify(v)))
    ].map((v) => JSON.parse(v));
    try {
      body = this.scene.matter.add.fromVertices(
        this.anchor.x,
        this.anchor.y,
        this.vertices,
        {
          isStatic: true,
          label: 'terrain'
        },
        true,
        0,
        0.1
      );
    } catch (error) {
      // this.scene.add.polygon(
      //   this.anchor.x,
      //   this.anchor.y,
      //   this.vertices,
      //   0xff00ff,
      //   1
      // );
      // console.log(error);
      return null;
    }
    const poly = this.scene.add.polygon(
      this.anchor.x,
      this.anchor.y,
      this.vertices,
      this.fillColor,
      this.fillAlpha
    ) as TerrainPolygon;
    this.scene.matter.add.gameObject(poly, body);
    poly.controller = this;
    const path_min = this.scene.matter.bounds.create(this.vertices).min;
    const bound_min = body.bounds.min;
    // this.scene.add.circle(this.anchor.x, this.anchor.y, 3, 0xffffff, 0.5);
    this.scene.matter.body.setPosition(body, {
      x: this.anchor.x + (this.anchor.x - bound_min.x) + path_min.x,
      y: this.anchor.y + (this.anchor.y - bound_min.y) + path_min.y
    });
    return poly;
  }

  onCollide(coord: Vector2, velocity: Vector2) {
    const r = 70;
    const old_vertices: [number, number][] = _.map(this.vertices, (v) => [
      v.x,
      v.y
    ]);
    const destruction_vertices: [number, number][] = [];

    // Random explosion intensity, can be adjusted based on bullet damage
    const explosion_intensity = Phaser.Math.Between(0.6, 1);
    old_vertices.forEach((value) => {
      const dist = Math.sqrt(
        Math.pow(value[0] - coord.x + this.anchor.x, 2) +
          Math.pow(value[1] - coord.y + this.anchor.y, 2)
      );
      let coeff;
      if (dist <= r) {
        coeff = explosion_intensity * (1 - Math.pow(dist / r, 4));
      } else {
        coeff = 0;
      }
      destruction_vertices.push([
        value[0] + velocity.x * coeff,
        value[1] + velocity.y * coeff
      ]);
    });

    // Reduce sawtooth
    const reduce_sawtooth_strength = 0.33;
    const _n = destruction_vertices.length;
    for (let i = 0; i < _n; i++) {
      if (
        old_vertices[i][0] == destruction_vertices[i][0] &&
        old_vertices[i][1] == destruction_vertices[i][1]
      )
        continue;
      destruction_vertices[i][0] =
        (destruction_vertices[(i + _n - 1) % _n][0] +
          destruction_vertices[(i + 1) % _n][0] +
          (1 / reduce_sawtooth_strength) * destruction_vertices[i][0]) /
        (2 + 1 / reduce_sawtooth_strength);
      destruction_vertices[i][1] =
        (destruction_vertices[(i + _n - 1) % _n][1] +
          destruction_vertices[(i + 1) % _n][1] +
          (1 / reduce_sawtooth_strength) * destruction_vertices[i][1]) /
        (2 + 1 / reduce_sawtooth_strength);
    }

    let new_vertices;
    try {
      new_vertices = PolygonClipping.intersection(
        [old_vertices],
        [destruction_vertices]
      );
    } catch (error) {
      // this.scene.add.circle(coord.x, coord.y, 2, 0xff0000, 1);
      // console.log(error);
      return;
    }
    if (!this.gameObject?.active) return;
    this.gameObject?.destroy();

    const min_vertices_count = 15;
    _.map(new_vertices, (v) => {
      v.forEach((value) => {
        if (value.length < min_vertices_count) return;
        const vertices = value.map((p) => ({ x: p[0], y: p[1] }));
        new Platform(
          this.scene,
          this.anchor.x,
          this.anchor.y,
          vertices,
          this.fillColor,
          this.fillAlpha
        );
      });
    });
  }
}
