import _ from 'lodash';

import PoissonDiskSampling from 'poisson-disk-sampling';
import { combineNoise } from '@/scripts/perlin';
import Platform from '@/components/Platform';
import Global from '@/global';
import Game from '@/scenes/Game';

function generateTerrain(scene: Phaser.Scene) {
  const [min_x, max_x] = [-Global.WORLD_WIDTH / 2, Global.WORLD_WIDTH / 2];
  const [min_y, max_y] = [-Global.WORLD_HEIGHT / 2, Global.WORLD_HEIGHT / 2];

  const w = 1200;
  const h = 200;
  const s = 50;

  const eta = h / w;
  const r = Math.min(w, h);

  const p = new PoissonDiskSampling({
    shape: [eta * Global.WORLD_WIDTH, Global.WORLD_HEIGHT],
    minDistance: 1.75 * r,
    tries: 100
  });
  const points = p.fill();

  // Game.scene.cameras.main.setZoom(0.12);
  points.forEach((p) => {
    const x = p[0] / eta - Global.WORLD_WIDTH / 2;
    const y = p[1] - Global.WORLD_HEIGHT / 2;
    // Game.scene.add.rectangle(x, y, w, h, 0xffffff);
    // Game.scene.add.circle(x, y, 100, 0xffffff);

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
      x: (i * w) / nx - w / 2,
      y: 0 - (noise_t[i] - min_noise_t) - h / 2
    }));
    const vertices_r = _.range(0, ny - 1).map((i) => ({
      x: w + (noise_r[i] - min_noise_r) - w / 2,
      y: (i * h) / ny - h / 2
    }));
    const vertices_b = _.range(nx - 1, 0).map((i) => ({
      x: (i * w) / nx - w / 2,
      y: h + (noise_b[i] - min_noise_b) - h / 2
    }));
    const vertices_l = _.range(ny - 1, 0).map((i) => ({
      x: 0 - (noise_l[i] - min_noise_l) - w / 2,
      y: (i * h) / ny - h / 2
    }));

    const vertices: { x: number; y: number }[] = _.flatten([
      vertices_t,
      vertices_r,
      vertices_b,
      vertices_l
    ]);

    const platform = new Platform(scene, x, y, vertices, 0x0000ff, 0.5);
    // const platform = new Platform(scene, x, y, vertices, 0xffffff, 1);
  });
}

export default generateTerrain;
