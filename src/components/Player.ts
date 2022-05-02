import { Socket } from 'socket.io';
import { RawTankData } from '@/types/RawData';
import BaseTank from '@/components/Tank/BaseTank';

function randID(length: integer) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default class Player {
  name: string;
  ID: string;
  secret: string;
  tank: BaseTank;
  socket?: Socket;

  terrains_not_synced = [] as any[];
  bullets_not_synced = [] as any[];

  constructor(name: string, tank: BaseTank) {
    this.name = name;
    this.ID = randID(8);
    this.secret = randID(12);
    this.tank = tank;
  }

  get raw(): RawTankData {
    return {
      x: this.tank.body.position.x,
      y: this.tank.body.position.y,
      vx: this.tank.body.velocity.x,
      vy: this.tank.body.velocity.y,
      vang: this.tank.body.angularVelocity,
      b_ang: this.tank.body.angle,
      c_ang: this.tank.getCannonAngle(),
      thrust: this.tank.getThrustSpeed(),
      name: this.name,
      id: this.ID,
      health: Phaser.Math.Between(1, 200)
    };
  }
}
