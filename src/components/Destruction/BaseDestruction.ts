import Global from '@/global';
import { Vector2 } from '@/types';
export default abstract class BaseDestruction extends Phaser.GameObjects
  .Container {
  constructor(scene: Phaser.Scene, x: number, y: number, vertices: Vector2[]) {
    super(scene);
    const sensor = this.scene.matter.add.fromVertices(x, y, vertices);
    sensor.label = 'Destruction';
    // sensor.isStatic = true;
    sensor.isSensor = true;
    sensor.collisionFilter.category = Global.CATEGORY_DESTRUCTION;
    sensor.collisionFilter.mask = Global.CATEGORY_TERRAIN;
    this.scene.matter.add.gameObject(this, sensor);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, () => {
      this.destroy();
    });
  }
}
