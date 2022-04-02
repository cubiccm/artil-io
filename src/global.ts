export default class Global {
  public static readonly event_bus = new Phaser.Events.EventEmitter();

  public static readonly CATEGORY_TERRAIN = Math.pow(2, 1);
  public static readonly CATEGORY_TANK = Math.pow(2, 2);
  public static readonly CATEGORY_PROJECTILE = Math.pow(2, 3);
  public static readonly CATEGORY_POINT = Math.pow(2, 4);
  public static readonly CATEGORY_POWERUP = Math.pow(2, 5);

  public static readonly WORLD_WIDTH = 2048 * 4;
  public static readonly WORLD_HEIGHT = 2048 * 2;

  public static SCREEN_WIDTH = window.innerWidth;
  public static SCREEN_HEIGHT = window.innerHeight;
}
