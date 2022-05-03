import { Socket } from 'socket.io';
import { RawTankData } from '@/types/RawData';
import BaseTank from '@/components/Tank/BaseTank';
import UUID from '@/types/UUID';

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
    this.ID = UUID(8);
    this.secret = UUID(12);
    this.tank = tank;
    this.tank.player = this;
  }

  get raw(): RawTankData {
    return {
      x: this.tank.body?.position.x,
      y: this.tank.body?.position.y,
      vx: this.tank.body?.velocity.x,
      vy: this.tank.body?.velocity.y,
      vang: this.tank.body?.angularVelocity,
      b_ang: this.tank.body?.angle,
      c_ang: this.tank.getCannonAngle(),
      thrust: this.tank.getThrustSpeed(),
      name: this.name,
      id: this.ID,
      health: this.tank.get('HP')
    };
  }
}
