interface TankData {
  blocked: {
    left: boolean;
    right: boolean;
    bottom: boolean;
  };
  numTouching: {
    left: number;
    right: number;
    bottom: number;
  };
  sensors: {
    bottom?: MatterJS.BodyType;
    left?: MatterJS.BodyType;
    right?: MatterJS.BodyType;
  };
  time: {
    leftDown: number;
    rightDown: number;
  };
  lastJumpedAt: number;
  prevXSpeed: number;
  speed: {
    run: number;
    jump: number;
  };
  HP: number;
}

export default TankData;
