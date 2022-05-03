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
    cannon_texture?: Phaser.GameObjects.GameObject;
    cannon_body?: MatterJS.BodyType;
  };
  max_health: number;
  HP: number;
  XP: number;
  regen_factor: number;
  reload: number;
  bullet_speed: number;
  weapon: string;
  weapon_damage: number;
  bullets: Bullet[];
  id: string;
  team: string;
  skin: string;
}

export default TankData;
