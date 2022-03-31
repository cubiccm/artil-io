import _ from 'lodash';
import { combineNoise } from '@/scripts/perlin';
import Game from '@/scenes/Game';
import { Vector } from 'matter';

interface Vector2 {
  x: number;
  y: number;
}

export default class Platform extends Phaser.GameObjects.Container {
  public vertices: Vector2[];
  public anchor: Vector2;
  public gameObject: Phaser.GameObjects.GameObject;
  public fillColor: number;
  public fillAlpha: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    s: number,
    fillColor?: number,
    fillAlpha?: number
  ) {
    const ny = Math.ceil(h / s);
    const nx = Math.ceil(w / s);

    const noise_t = combineNoise(h, h / 2, 8, 2, nx).pos.map((v) =>
      Math.floor(v)
    );
    const noise_r = combineNoise(w, w / 2, 8, 2, ny).pos.map((v) =>
      Math.floor(v)
    );
    const noise_b = combineNoise(h, h / 8, 8, 2, nx).pos.map((v) =>
      Math.floor(v)
    );
    const noise_l = combineNoise(w, w / 2, 8, 2, ny).pos.map((v) =>
      Math.floor(v)
    );
    const min_noise_t: any = _.min(noise_t);
    const min_noise_r: any = _.min(noise_r);
    const min_noise_b: any = _.min(noise_b);
    const min_noise_l: any = _.min(noise_l);

    const vertices_t = _.range(0, nx - 1).map((i) => ({
      x: (i * w) / nx,
      y: 0 - (noise_t[i] - min_noise_t)
    }));
    const vertices_r = _.range(0, ny - 1).map((i) => ({
      x: w + (noise_r[i] - min_noise_r),
      y: (i * h) / ny
    }));
    const vertices_b = _.range(nx - 1, 0).map((i) => ({
      x: (i * w) / nx,
      y: h + (noise_b[i] - min_noise_b)
    }));
    const vertices_l = _.range(ny - 1, 0).map((i) => ({
      x: 0 - (noise_l[i] - min_noise_l),
      y: (i * h) / ny
    }));

    const vertices: { x: number; y: number }[] = _.flatten([
      vertices_t,
      vertices_r,
      vertices_b,
      vertices_l
    ]);

    // const poly = scene.add.polygon(x, y, vertices, 0x0000ff, 0.5); // wierd bug sometimes the shape skips some vertices?
    super(scene, x, y);
    this.anchor = { x: x, y: y };
    this.vertices = vertices;
    this.fillColor = fillColor || 0x0000ff;
    this.fillAlpha = fillAlpha || 0.5;
    this.gameObject = this.createPlatform();
    console.log(this);
  }

  createPlatform() {
    const poly = this.scene.add.polygon(
      this.anchor.x,
      this.anchor.y,
      this.vertices,
      this.fillColor,
      this.fillAlpha
    );
    try {
      const body: MatterJS.BodyType = this.scene.matter.add.fromVertices(
        this.anchor.x,
        this.anchor.y,
        this.vertices,
        {
          isStatic: true,
          label: 'terrain'
        },
        undefined,
        undefined,
        1
      );
      this.scene.matter.add.gameObject(poly, body);
      poly.controller = this;
      const path_min = this.scene.matter.bounds.create(this.vertices).min;
      const bound_min = body.bounds.min;
      this.scene.add.circle(this.anchor.x, this.anchor.y, 3, 0xffffff, 0.5);
      this.scene.matter.body.setPosition(body, {
        x: this.anchor.x + (this.anchor.x - bound_min.x) + path_min.x,
        y: this.anchor.y + (this.anchor.y - bound_min.y) + path_min.y
      });
      return poly;
    } catch (error) {
      console.log(error);
      poly.destroy();
      return null;
    }
  }

  onCollide(coord) {
    const r = 50;
    const angle_step = (Math.PI * 20) / 180;
    for (let i = 0; i < this.vertices.length - 1; i++) {
      // if distance coord and v is less than r
      const vi = addVector2(this.vertices[i], this.anchor);
      if (Math.abs(coord.x - vi.x) < r && Math.abs(coord.y - vi.y) < r) {
        let angle_start = Math.atan2(vi.y - coord.y, vi.x - coord.x);
        let angle_stop;
        for (let j = i + 1; j < this.vertices.length - 1; j++) {
          const vj = addVector2(this.vertices[j + 1], this.anchor);
          if (!(Math.abs(coord.x - vj.x) < r && Math.abs(coord.y - vj.y) < r)) {
            angle_stop = Math.atan2(vj.y - coord.y, vj.x - coord.x);
            break;
          } else {
            this.vertices.splice(i, 1);
          }
        }
        if (angle_start < angle_stop) angle_start += Math.PI * 2;
        const angle_diff = angle_stop - angle_start;
        const extra_vertices: Vector2[] = [];
        for (let a = angle_start; a > angle_stop; a -= angle_step) {
          const x = coord.x + r * Math.cos(a);
          const y = coord.y + r * Math.sin(a);
          // this.scene.add.circle(x, y, 1, 0x00ff00, 1);
          extra_vertices.push({ x: x - this.anchor.x, y: y - this.anchor.y });
        }
        this.vertices.splice(i, 0, ...extra_vertices);
        break;
      }
    }
    try {
      this.gameObject.destroy();
      this.gameObject = this.createPlatform()!;
    } catch (error) {
      console.log(error);
    }
  }
}

function subtractVector2(v1: Vector2, v2: Vector2) {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y
  };
}

function addVector2(v1: Vector2, v2: Vector2) {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  };
}
