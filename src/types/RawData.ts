export default interface RawGameData {
  map?: {
    terrain?: MatterJS.Vector[][];
  };
  players?: RawTankData[];
  self?: RawTankData;
}

export interface RawTankData {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  vang?: number;
  body_angle?: number;
  cannon_angle?: number;
  thrust?: number;
  type?: number;
  name?: string;
  id?: string;
  health?: number;
}
