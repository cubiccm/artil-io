import _ from 'lodash';
import PolygonClipping from 'polygon-clipping';
import Global from '@/global';
import BaseDestruction from './Destruction/BaseDestruction';

export default class Platform {
  public scene: Phaser.Scene;
  public anchor: MatterJS.Vector;
  public vertices: MatterJS.Vector[];
  public fillColor: number;
  public fillAlpha: number;
  public gameObject: Phaser.GameObjects.GameObject | null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vertices: MatterJS.Vector[],
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
    let rigid: MatterJS.BodyType;
    this.vertices = this.vertices.map((v) => ({
      x: Math.round(v.x * 100) / 100,
      y: Math.round(v.y * 100) / 100
    }));
    this.vertices = [
      ...new Set(this.vertices.map((v) => JSON.stringify(v)))
    ].map((v) => JSON.parse(v));
    try {
      rigid = this.scene.matter.add.fromVertices(
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
      return null;
    }
    const texture = this.scene.add.polygon(
      this.anchor.x,
      this.anchor.y,
      this.vertices,
      this.fillColor,
      this.fillAlpha
    ) as unknown as Phaser.Physics.Matter.Sprite;
    this.scene.matter.add.gameObject(texture, rigid);
    // Temporary solution, refactor later
    texture.controller = this;

    const path_min = this.scene.matter.bounds.create(this.vertices).min;
    const bound_min = rigid.bounds.min;
    this.scene.matter.body.setPosition(rigid, {
      x: this.anchor.x + (this.anchor.x - bound_min.x) + path_min.x,
      y: this.anchor.y + (this.anchor.y - bound_min.y) + path_min.y
    });

    rigid.parts.forEach((part) => {
      part.collisionFilter.category = Global.CATEGORY_TERRAIN;
      part.collisionFilter.mask =
        Global.CATEGORY_TANK |
        Global.CATEGORY_PROJECTILE |
        Global.CATEGORY_DESTRUCTION;
      part.onCollideCallback = (pair: MatterJS.ICollisionPair) => {
        // const support = pair.collision.supports[0];
        // const self = (
        //   pair.bodyA === part ? pair.bodyA : pair.bodyB
        // ) as MatterJS.BodyType;
        // const other = (
        //   pair.bodyA === part ? pair.bodyB : pair.bodyA
        // ) as MatterJS.BodyType;
        // if (other.collisionFilter.category === Global.CATEGORY_DESTRUCTION) {
        //   const destruction = other.gameObject as BaseDestruction;
        //   this.onCollide(other.vertices);
        // }
      };
    });

    if (rigid.area < 1000) {
      rigid.gameObject.destroy();
    }
    return texture;
  }

  onCollide(new_vertices: PolygonClipping.MultiPolygon) {
    if (!this.gameObject?.active) return;
    this.gameObject?.destroy();
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

  /*
  onCollide(coord: MatterJS.Vector, destructionVertices: MatterJS.Vector[]) {
    const old_vertices: [number, number][] = this.vertices.map((v) => [
      v.x,
      v.y
    ]);
    const destruction_vertices: [number, number][] = [];
    destructionVertices.forEach((v) => {
      const x = v.x - this.anchor.x;
      const y = v.y - this.anchor.y;
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
    if (!this.gameObject?.active) return;
    this.gameObject?.destroy();
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
  */
}
