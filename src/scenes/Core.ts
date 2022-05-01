const assets_url_base = 'http://localhost:4000/';

import 'phaser';
import _ from 'lodash';
import Global from '../global.js';
import BaseTank from '../components/Tank/BaseTank.js';
import generateTerrain from '../scripts/terrainGenerator.js';
import Platform from '../components/Platform.js';
import RawGameData from '../types/RawData.js';
import Player from '../components/Player.js';
import GeneralTank from '../components/Tank/GeneralTank.js';
import { Socket } from 'socket.io';

export default class Core extends Phaser.Scene {
  public static scene: Core;
  gamedata = {
    map: {
      terrain: [] as Platform[]
    },
    players: [] as BaseTank[]
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
    if (this.last_update_interval >= 200) {
      this.last_update_interval = 0;
      Object.keys(this.players).forEach((key) => {
        const player = this.players[key];
        player.socket.emit('sync', Core.scene.getRawData(player));
      });
    }
  }

  getRawData(player: Player): RawGameData {
    const res = {} as RawGameData;
    res.map = {};
    res.map.terrain = this.gamedata.map.terrain.map((v) => v.raw);
    res.players = [];
    Object.keys(this.players).forEach((key) => {
      if (this.players[key] != player) res.players?.push(this.players[key].raw);
    });
    res.self = player.raw;
    return res;
  }

  addPlayer(name: string, socket: Socket): Player {
    const x = Phaser.Math.Between(-400, 400);
    const y = Phaser.Math.Between(-300, 300);
    const player = new Player(name, new GeneralTank(this, x, y));
    player.socket = socket;
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
