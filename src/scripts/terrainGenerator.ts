import _ from 'lodash';

import PoissonDiskSampling from 'poisson-disk-sampling';
import { combineNoise } from '@/scripts/perlin';
import Platform from '@/components/Platform';
import Global from '@/global';
import Game from '@/scenes/Game';
import Chunk from '@/components/Chunk';

const w = 1200;
const h = 200;
const s = 50;

const eta = h / w;
const r = Math.min(w, h);

const age = 1000;

function generateTerrain(scene: Phaser.Scene) {
  const p = new PoissonDiskSampling({
    shape: [eta * Global.WORLD_WIDTH, Global.WORLD_HEIGHT - 2 * h],
    minDistance: 1.75 * r,
    tries: 100
  });
  const points = p.fill();
  const platforms = [] as Platform[];

  // Game.scene.cameras.main.setZoom(0.12);
  points.forEach((p) => {
    const x = p[0] / eta - Global.WORLD_WIDTH / 2;
    const y = p[1] - (Global.WORLD_HEIGHT - 2 * h) / 2;

    const chunk = new Chunk(scene, x, y, w, h, s, age);
    chunk.platforms.forEach((platform) => {
      platforms.push(platform);
    });
  });
  return platforms;
}

export default generateTerrain;
