import Bullet from '@/components/Bullet';
import TankSensor from '@/components/TankSensor';

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
    bottom?: TankSensor;
    left?: TankSensor;
    right?: TankSensor;
  };
  time: {
    leftDown: number;
    rightDown: number;
  };
  lastJumpedAt: number;
  lastFiredAt: number;
  speed: {
    run: number;
    jump: number;
  };
  HP: number;
  XP: number;
  bullets: Bullet[];
  components: {
    cannon_body?: MatterJS.BodyType;
    cannon_end?: Phaser.GameObjects.Image;
  };
}

export default TankData;
