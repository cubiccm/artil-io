import Global from '@/global';
import Core from '@/scenes/Core';
import { combineNoise } from '@/scripts/perlin';
import UUID from '@/types/UUID';
import _ from 'lodash';
import Platform from './Platform';

export default class Chunk {
  public x: number;
  public y: number;
  public w: number;
  public h: number;
  public s: number;
  public scene: Phaser.Scene;
  public platforms: Platform[];
  public age: number;
  public area: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    s: number,
    age: number
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.s = s;
    this.platforms = [];
    this.age = age;
    this.area = 0;
    this.createChunk(scene, x, y, w, h, s);

    // scene.time.addEvent({
    //   delay: 10000,
    //   loop: true,
    //   callback: () => this.regenerateChunk()
    // });
  }

  public createChunk(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    s: number
  ) {
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

    const platform = new Platform(scene, UUID(8), this, x, y, vertices);
  }

  public addPlatform(platform: Platform) {
    this.platforms.push(platform);
    this.area += platform.body!.area;
  }

  public removePlatform(platform: Platform, remove_from_list = true) {
    if (remove_from_list)
      this.platforms.splice(this.platforms.indexOf(platform), 1);
    this.area -= platform.body!.area;
    platform.gameObject?.destroy();
    (this.scene as Core).onDestroyPlatform(platform);
  }

  public updateChunk() {
    if (this.area < 100000) {
      // Set minimum area to regenerate
      this.regenerateChunk();
    }
  }

  private regenerateChunk() {
    this.platforms.forEach((platform) => {
      this.removePlatform(platform, false);
    });
    this.platforms = [];
    this.area = 0;

    this.createChunk(this.scene, this.x, this.y, this.w, this.h, this.s);
  }
}
