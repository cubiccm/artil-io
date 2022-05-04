const assets_url_base = 'http://localhost:4000/';

import 'phaser';
import _ from 'lodash';
import Global from '@/global';
import BaseTank from '@/components/Tank/BaseTank';
import generateTerrain from '@/scripts/terrainGenerator';
import Platform from '@/components/Platform';
import RawGameData from '@/types/RawData';
import Player from '@/components/Player';
import { Socket } from 'socket.io';
import Bullet from '@/components/Projectile/Bullet';

export default class Core extends Phaser.Scene {
  public static scene: Core;
  gamedata = {
    map: {
      platforms: [] as Platform[]
    },
    players: [] as BaseTank[],
    bullets: [] as Bullet[]
  };
  players = {} as any;

  initiated = false;

  constructor() {
    super({ key: Global.SCENE_CORE, active: true });
    Core.scene = this;
    this.players = [];
  }

  preload() {
    this.load.json('tank_shape', assets_url_base + 'assets/tank_shape.json');
  }

  create() {
    // this.matter.set30Hz();
    this.matter.world.autoUpdate = false;

    this.matter.world.setBounds(
      -Global.WORLD_WIDTH / 2,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH,
      Global.WORLD_HEIGHT * 2,
      undefined,
      true,
      false,
      false,
      false
    );
    this.matter.world.setGravity(0, 1, 0.001);
    generateTerrain(this);
    this.initiated = true;
    console.log('Game initiated');
  }

  last_update_interval = 0;
  accumulator = 0;
  update(time: number, delta: number) {
    this.last_update_interval += delta;
    this.accumulator += delta;
    while (this.accumulator >= Global.MATTER_TIME_STEP) {
      this.accumulator -= Global.MATTER_TIME_STEP;
      this.matter.world.step(Global.MATTER_TIME_STEP);
    }
    if (this.last_update_interval >= Global.SERVER_REPORT_RATE) {
      this.last_update_interval -= Global.SERVER_REPORT_RATE;
      Object.values(this.players).forEach((_player: any) => {
        _player.socket?.emit('sync', this.getRawData(_player));
      });
    }
  }

  getRawData(player: Player): RawGameData {
    // Terrain
    const res = {} as RawGameData;
    res.map = {};
    res.map.platforms = player.terrains_not_synced.map((platform) => {
      return platform.raw;
    });
    player.terrains_not_synced = [];

    // Tanks
    res.players = [];
    Object.values(this.players).forEach((_player: any) => {
      if (_player != player && (_player.tank as BaseTank).active)
        res.players?.push(_player.raw);
    });
    res.self = player.raw;

    // Bullets
    res.bullets = [];
    player.bullets_not_synced.forEach((bullet: Bullet) => {
      if (bullet.body && bullet.parent?.player != player)
        res.bullets?.push(bullet.raw);
    });
    player.bullets_not_synced = [];

    return res;
  }

  onNewBullet(bullet: Bullet) {
    this.gamedata.bullets.push(bullet);
    Object.values(this.players).forEach((_player: any) => {
      _player.bullets_not_synced.push(bullet);
    });
  }

  onPlayerJoin(name: string, socket: Socket): Player {
    const x = Phaser.Math.Between(-400, 400);
    const y = Phaser.Math.Between(-300, 300);
    const player = new Player(name, new BaseTank(this, x, y));

    // Terrain
    player.terrains_not_synced = this.gamedata.map.platforms.filter(
      (platform) => {
        if (platform.gameObject?.active) return platform;
      }
    );
    this.gamedata.map.platforms = player.terrains_not_synced.slice();

    // Bullets
    player.bullets_not_synced = this.gamedata.bullets.filter((bullet) => {
      if (bullet.active) return bullet;
    });
    this.gamedata.bullets = player.bullets_not_synced.slice();

    this.players[player.ID] = player;
    return player;
  }

  onPlayerLeave(socket: Socket) {
    Object.keys(this.players).forEach((key: any) => {
      const _player = this.players[key];
      if (_player.socket == socket) {
        (_player.tank.get('bullets') as Bullet[]).forEach((bullet) => {
          bullet.selfDestroy();
        });
        _player.tank.destroy();
        delete this.players[key];
      }
    });
  }

  onPlayerDeath(player: Player, killer?: Player | string) {
    (player.tank.get('bullets') as Bullet[]).forEach((bullet) => {
      bullet.selfDestroy();
    });
    if (typeof killer == 'object') {
      player.socket?.emit('death', killer.name);
      killer.socket?.emit('kill', player.name);
    } else {
      player.socket?.emit('death', killer);
    }
    player.socket?.disconnect();
    player.tank.destroy();
    delete this.players[player.ID];
  }

  onDestroyPlatform(platform: Platform) {
    Object.values(this.players).forEach((_player: any) => {
      _player.terrains_not_synced.push(platform);
    });
  }

  onNewPlatform(platform: Platform) {
    platform.chunk?.addPlatform(platform);
    this.gamedata.map.platforms.push(platform);
    Object.values(this.players).forEach((_player: any) => {
      _player.terrains_not_synced.push(platform);
    });
  }

  getPlayer(ID: string, secret?: string) {
    if (ID in this.players) {
      const player = this.players[ID];
      if (secret && player.secret == secret) return player;
    }
    return false;
  }
}
