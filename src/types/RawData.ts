export default interface RawGameData {
  map?: {
    platforms?: MatterJS.Vector[][];
  };
  players?: RawTankData[];
  self?: RawTankData;
  bullets?: RawBulletData[];
}

export interface RawTankData {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  thrust?: number;

  b_ang?: number;
  vang?: number;

  c_ang?: number;

  id?: string;
  type?: number;
  name?: string;

  health?: number;
}

export interface RawBulletData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  player?: string; // Player ID
  // type: number
}

export function serializeRawTankData(data: RawTankData): any[] {
  return [
    data.x,
    data.y,
    data.vx,
    data.vy,
    data.thrust,
    data.b_ang,
    data.vang,
    data.c_ang,
    data.id,
    data.type,
    data.name,
    data.health
  ];
}

export function deserializeRawTankData(param: any[]): RawTankData {
  const data = {} as RawTankData;
  data.x = param[0];
  data.y = param[1];
  data.vx = param[2];
  data.vy = param[3];
  data.thrust = param[4];
  data.b_ang = param[5];
  data.vang = param[6];
  data.c_ang = param[7];
  data.id = param[8];
  data.type = param[9];
  data.name = param[10];
  data.health = param[11];
  return data;
}
