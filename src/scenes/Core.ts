const assets_url_base = 'http://localhost:4000/';
const server_report_rate = 40; // ms

import 'phaser';
import _ from 'lodash';
import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import generateTerrain from '@/scripts/terrainGenerator';
import Platform from '@/components/Platform';
import RawGameData from '@/types/RawData';
import Player from '@/components/Player';
import GeneralTank from '@/components/Tank/GeneralTank';
import { Socket } from 'socket.io';
import Bullet from '@/components/Projectile/Bullet';

export default class Core extends Phaser.Scene {
  public static scene: Core;
  gamedata = {
    map: {
      terrain: [] as Platform[]
    },
    players: [] as BaseTank[],
    bullets: [] as Bullet[]
  };
  players = {} as any;

  initiated = false;

  constructor() {
    super({ key: 'Artilio-server', active: true });
    Core.scene = this;
    this.players = [];
  }

  preload() {
    this.load.json('tank_shape', assets_url_base + 'assets/tank_shape.json');
  }

  create() {
    this.matter.set30Hz();
    this.matter.world.setBounds(
      -Global.WORLD_WIDTH,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH * 2,
      Global.WORLD_HEIGHT * 2,
      undefined,
      true,
      false,
      false,
      false
    );
    this.matter.world.setGravity(0, 1, 0.001);
    this.gamedata.map.terrain = generateTerrain(this);
    this.initiated = true;
    console.log('Game initiated');
  }

  last_update_interval = 0;
  update(time: number, delta: number) {
    this.last_update_interval += delta;
    if (this.last_update_interval >= server_report_rate) {
      this.last_update_interval = 0;
      Object.keys(this.players).forEach((key) => {
        const player = this.players[key];
        player.socket.emit('sync', Core.scene.getRawData(player));
      });
    }
  }

  getRawData(player: Player): RawGameData {
    // Terrain
    const res = {} as RawGameData;
    res.map = {};
    res.map.terrain = player.terrains_not_synced.map((platform) => {
      if (platform.gameObject?.body) return platform.raw;
    });
    player.terrains_not_synced = [];

    // Tanks
    res.players = [];
    Object.keys(this.players).forEach((key) => {
      if (this.players[key] != player) res.players?.push(this.players[key].raw);
    });
    res.self = player.raw;

    // Bullets
    res.bullets = [];
    player.bullets_not_synced.forEach((bullet: Bullet) => {
      if (bullet.body) res.bullets?.push(bullet.raw);
    });
    player.bullets_not_synced = [];

    return res;
  }

  addBullet(bullet: Bullet) {
    this.gamedata.bullets.push(bullet);
    Object.keys(this.players).forEach((key) => {
      const player = this.players[key];
      player.bullets_not_synced.push(bullet);
    });
  }

  addPlayer(name: string, socket: Socket): Player {
    const x = Phaser.Math.Between(-400, 400);
    const y = Phaser.Math.Between(-300, 300);
    const player = new Player(name, new GeneralTank(this, x, y));
    player.socket = socket;

    // Terrain
    player.terrains_not_synced = this.gamedata.map.terrain.filter(
      (platform) => {
        if (platform.gameObject?.body) return platform;
      }
    );
    this.gamedata.map.terrain = player.terrains_not_synced.slice();
    // Bullets
    player.bullets_not_synced = this.gamedata.bullets.filter((bullet) => {
      if (bullet.body) return bullet;
    });
    this.gamedata.bullets = player.bullets_not_synced.slice();

    this.players[player.ID] = player;
    return player;
  }

  getPlayer(ID: string, secret?: string) {
    if (ID in this.players) {
      const player = this.players[ID];
      if (secret && player.secret == secret) return player;
    }
    return false;
  }
}
