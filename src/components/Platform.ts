import _ from 'lodash';
import PolygonClipping from 'polygon-clipping';
import Global from '@/global';
import BaseDestruction from '@/components/Destruction/BaseDestruction';
import Core from '@/scenes/Core';
import UUID from '@/types/UUID';
import Chunk from './Chunk';

export class PlatformTexture extends Phaser.Physics.Matter.Sprite {
  public controller?: Platform;
}

export default class Platform {
  public scene: Phaser.Scene;
  public chunk?: Chunk;
  public anchor: MatterJS.Vector;
  public vertices: MatterJS.Vector[];
  public fillColor: number;
  public fillAlpha: number;
  public gameObject?: Phaser.GameObjects.GameObject;
  public body?: MatterJS.BodyType;
  ID: string;

  public colors: number[];
  graphics!: Phaser.GameObjects.Graphics;
  constructor(
    scene: Phaser.Scene,
    ID: string,
    chunk: Chunk | undefined,
    x: number,
    y: number,
    vertices: MatterJS.Vector[],
    colors?: number[],
    fillColor?: number,
    fillAlpha?: number
  ) {
    // const poly = scene.add.polygon(x, y, vertices, 0x0000ff, 0.5); // weird bug sometimes the shape skips some vertices?
    this.scene = scene;
    this.ID = ID;
    this.chunk = chunk;
    this.anchor = { x: x, y: y };
    this.vertices = vertices;
    this.colors = colors || [0x0000ff];
    this.fillColor =
      fillColor ||
      this.colors[Math.round(Math.random() * (this.colors.length - 1))];
    this.fillAlpha = fillAlpha || 0.1;
    this.createPlatform();
  }

  get raw(): any {
    if (this.gameObject?.active) {
      // Existing platform
      return [this.ID, [this.anchor.x, this.anchor.y], this.vertices];
    } else {
      // Died platform
      return [this.ID];
    }
  }

  createPlatform() {
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
    const texture = this.scene.add
      .polygon(
        this.anchor.x,
        this.anchor.y,
        this.vertices,
        this.fillColor,
        this.fillAlpha
      )
      .setStrokeStyle(7, this.fillColor, 1.0) as unknown as PlatformTexture;
    this.scene.matter.add.gameObject(texture, rigid);
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

    this.gameObject = rigid.gameObject;
    this.body = rigid;

    if (rigid.area < 1000) {
      rigid.gameObject.destroy();
    } else if (this.scene.scene.key == 'Artilio-server') {
      (this.scene as Core).onNewPlatform(this);
    }
  }

  onCollide(new_vertices: PolygonClipping.MultiPolygon) {
    if (this.scene.scene.key == 'Artilio-server') {
      if (!this.gameObject?.active) return;
      this.chunk?.removePlatform(this);

      // this.gameObject.on('destroy', () => {
      //   (this.scene as Core).onDestroyPlatform(this);
      // });
      new_vertices.map((v) => {
        const vertices = v[0].map((p) => ({ x: p[0], y: p[1] }));
        const platform = new Platform(
          this.scene,
          UUID(8),
          this.chunk,
          this.anchor.x,
          this.anchor.y,
          vertices,
          this.colors
        );
      });
      this.chunk?.updateChunk();
    }
  }
}
