import Platform from '@/components/Platform';

export default interface TerrainPolygon extends Phaser.GameObjects.Polygon {
  controller: Platform;
}
