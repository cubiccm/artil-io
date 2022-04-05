import Bullet from '@/components/Projectile/Bullet';
import TankSensor from '@/components/Tank/TankSensor';

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
  components: {
    cannon_end?: MatterJS.BodyType;
  };
  HP: number;
  XP: number;
  bullets: Bullet[];
  id: string;
  team: string;
}

export default TankData;
