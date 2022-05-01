import Bullet from '../components/Projectile/Bullet';
import TankSensor from '../components/Tank/TankSensor';

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
  lastJumpedAt: number;
  lastFiredAt: number;
  speed: {
    ground: number;
    air: number;
    jump: number;
  };
  components: {
    cannon_body?: MatterJS.BodyType;
  };
  HP: number;
  XP: number;
  bullets: Bullet[];
  id: string;
  team: string;
}

export default TankData;
