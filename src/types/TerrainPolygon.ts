import Platform from '@/components/Platform';

export default interface TerrainPolygon
  extends Phaser.GameObjects.GameObject,
    Phaser.Physics.Matter.Components.Collision {
  controller: Platform;
  body: MatterJS.BodyType;
}
