import _ from 'lodash';
import PolygonClipping from 'polygon-clipping';
import { Vector2 } from '@/types';
import Global from '@/global';

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
    this.vertices = this.vertices.map((v) => ({
      x: Math.round(v.x * 100) / 100,
      y: Math.round(v.y * 100) / 100
    }));
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
    ) as unknown as Phaser.Physics.Matter.Sprite;
    // poly.controller = this;
    this.scene.matter.add.gameObject(poly, body);
    const path_min = this.scene.matter.bounds.create(this.vertices).min;
    const bound_min = body.bounds.min;
    // this.scene.add.circle(this.anchor.x, this.anchor.y, 3, 0xffffff, 0.5);
    this.scene.matter.body.setPosition(body, {
      x: this.anchor.x + (this.anchor.x - bound_min.x) + path_min.x,
      y: this.anchor.y + (this.anchor.y - bound_min.y) + path_min.y
    });
    poly.setCollisionCategory(Global.CATEGORY_TERRAIN);
    poly.setCollidesWith([
      Global.CATEGORY_TANK,
      Global.CATEGORY_PROJECTILE,
      Global.CATEGORY_DESTRUCTION
    ]);
    body.parts.forEach((part) => {
      part.collisionFilter.category = Global.CATEGORY_TERRAIN;
      part.onCollideCallback = (pair: MatterJS.ICollisionPair) => {
        const support = pair.collision.supports[0];
        const self = pair.bodyA === part ? pair.bodyA : pair.bodyB;
        const other = pair.bodyA === part ? pair.bodyB : pair.bodyA;
        if (other.collisionFilter.category === Global.CATEGORY_PROJECTILE) {
          this.onCollide(support);
        }
      };
    });

    if (body.area < 1000) {
      body.gameObject.destroy();
    }
    return poly;
  }

  onCollide(coord: Vector2) {
    const r = 50;
    const angle_div = 30;
    const old_vertices: [number, number][] = this.vertices.map((v) => [
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
      // this.scene.add.circle(coord.x, coord.y, 2, 0xff0000, 1);
      // console.log(error);
      return;
    }
    if (!this.gameObject!.active) return;
    this.gameObject!.destroy();
    new_vertices.map((v) => {
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
