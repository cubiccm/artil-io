import _ from 'lodash';
import { combineNoise } from '@/scripts/perlin';
import Game from '@/scenes/Game';
import { Vector } from 'matter';
import PolygonClipping from 'polygon-clipping';

interface Vector2 {
  x: number;
  y: number;
}

export default class Platform {
  public vertices: Vector2[];
  public anchor: Vector2;
  public gameObject: Phaser.GameObjects.GameObject;
  public fillColor: number;
  public fillAlpha: number;
  public scene: Phaser.Scene;

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

  createPlatform() {
    let body: MatterJS.BodyType;
    try {
      body = this.scene.matter.add.fromVertices(
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
    } catch (error) {
      console.log(error);
      return;
    }
    const poly = this.scene.add.polygon(
      this.anchor.x,
      this.anchor.y,
      this.vertices,
      this.fillColor,
      this.fillAlpha
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
  }

  onCollide(coord) {
    const r = 50;
    const angle_div = 30;
    const old_vertices: [number, number][] = _.map(this.vertices, (v) => [
      v.x,
      v.y
    ]);
    const destruction_vertices: [number, number][] = [];
    _.range(0, angle_div).forEach((i) => {
      const angle = ((Math.PI * 2) / angle_div) * i;
      const x = coord.x - this.anchor.x + r * Math.cos(angle);
      const y = coord.y - this.anchor.y + r * Math.sin(angle);
      destruction_vertices.push([x, y]);
    });
    let new_vertices;
    try {
      new_vertices = PolygonClipping.difference(
        [old_vertices],
        [destruction_vertices]
      );
    } catch (error) {
      // console.log(error);
      return;
    }
    if (!this.gameObject.active) return;
    this.gameObject.destroy();
    _.map(new_vertices, (v) => {
      const vertices = v[0].map((p) => ({ x: p[0], y: p[1] }));
      new Platform(
        this.scene,
        this.anchor.x,
        this.anchor.y,
        vertices,
        this.fillColor,
        this.fillAlpha
      );
    });
  }
}
