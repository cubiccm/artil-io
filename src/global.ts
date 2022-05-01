import NetworkController from './NetworkController.js';
import Console from './components/Console.js';

export default class Global {
  public static readonly event_bus = new Phaser.Events.EventEmitter();

  public static readonly CATEGORY_TERRAIN = 1 << 0;
  public static readonly CATEGORY_TANK = 1 << 1;
  public static readonly CATEGORY_POINT = 1 << 2;
  public static readonly CATEGORY_POWERUP = 1 << 3;
  public static readonly CATEGORY_PROJECTILE = 1 << 4;
  public static readonly CATEGORY_DESTRUCTION = 1 << 5;
  public static readonly CATEGORY_EXPLOSION = 1 << 6;

  public static readonly WORLD_WIDTH = 2048 * 4;
  public static readonly WORLD_HEIGHT = 2048 * 2;

  public static SCREEN_WIDTH = window.innerWidth;
  public static SCREEN_HEIGHT = window.innerHeight;

  public static disable_graphics = false;

  public static socket: NetworkController;
  public static _console: Console;
}
