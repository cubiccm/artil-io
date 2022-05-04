import Global from '@/global';
import Platform from '@/components/Platform';
import PolygonClipping from 'polygon-clipping';
export default abstract class BaseDestruction {
  // extends Phaser.GameObjects.Container
  // constructor(
  //   scene: Phaser.Scene,
  //   x: number,
  //   y: number,
  //   vertices: MatterJS.Vector[]
  // ) {
  //   super(scene);
  //   const sensor = this.scene.matter.add.fromVertices(x, y, vertices);
  //   sensor.label = 'Destruction';
  //   sensor.isSensor = true;
  //   sensor.collisionFilter.category = Global.CATEGORY_DESTRUCTION;
  //   sensor.collisionFilter.mask = Global.CATEGORY_TERRAIN;
  //   this.scene.matter.add.gameObject(this, sensor);
  //   this.scene.events.on(Phaser.Scenes.Events.UPDATE, () => {
  //     this.destroy();
  //   });
  // }

  scene: Phaser.Scene;
  constructor(scene: Phaser.Scene, properties: any) {
    this.scene = scene;
  }

  // Calculate [terrain] MINUS [destruction_range]
  // All coords in destruction_range are in its local coord (destruction center as origin)
  // Returns a MultiPolygon
  destruct(
    position: MatterJS.Vector,
    terrain: Platform,
    destruction_range: MatterJS.Vector[]
  ) {
    const old_vertices: [number, number][] = terrain.vertices.map((v) => [
      v.x,
      v.y
    ]);
    const destruction_vertices: [number, number][] = [];
    destruction_range.forEach((v) => {
      const x = v.x + position.x - terrain.anchor.x;
      const y = v.y + position.y - terrain.anchor.y;
      destruction_vertices.push([x, y]);
    });
    let new_vertices;
    try {
      new_vertices = PolygonClipping.difference(
        [old_vertices],
        [destruction_vertices]
      );
    } catch (error) {
      // console.error(error);
      return [];
    }
    return new_vertices;
  }

  getNewTerrain(
    position: MatterJS.Vector,
    velocity: MatterJS.Vector,
    terrain: Platform
  ) {
    // Template method
  }
}
