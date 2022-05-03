import Phaser from 'phaser';
import _ from 'lodash';
import Global from '@/global';
import PlayerTank from '@/components/Tank/PlayerTank';
import Platform from '@/components/Platform';
import RawGameData, {
  RawBulletData,
  RawTankData,
  UPGRADES_TYPES
} from '@/types/RawData';
import BaseTank from '@/components/Tank/BaseTank';
import Bullet from '@/components/Projectile/Bullet';
import Grenade from '@/components/Projectile/Grenade';
import Cannon from '@/components/Projectile/Cannon';
import Uzi from '@/components/Projectile/Uzi';

let wrapCamB: Phaser.Cameras.Scene2D.Camera;
let wrapCamT: Phaser.Cameras.Scene2D.Camera;

export default class Game extends Phaser.Scene {
  public static scene: Game;
  public static player: PlayerTank;
  public static keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  public static keys: any;

  players = {} as any;
  platforms = {} as any;
  initiated = false;

  constructor() {
    super(Global.SCENE_GAME);
    Game.scene = this;
  }

  preload() {
    this.load.image('background', 'assets/space3.png');
    this.load.json('tank_shape', 'assets/tank_shape.json');
    this.loadTankSprites();

    const load_img = this.add.image(
      Global.SCREEN_WIDTH / 2,
      Global.SCREEN_HEIGHT / 2,
      'loginbkg'
    );
    load_img.scaleX = 0.39;
    load_img.scaleY = 0.34;
    this.progressBar();
  }

  create() {
    this.players = {};
    this.platforms = {};
    Game.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,W,A,S,D,SPACE');

    this.matter.world.setBounds(
      -Global.WORLD_WIDTH / 2,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH,
      Global.WORLD_HEIGHT * 2,
      undefined,
      true,
      false,
      false,
      false
    );

    this.cameras.main.scrollX = -Global.SCREEN_WIDTH / 2;
    this.cameras.main.scrollY = -Global.SCREEN_HEIGHT / 2;
    this.cameras.main.setBounds(
      -Global.WORLD_WIDTH / 2,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH,
      Global.WORLD_HEIGHT * 2
    );

    const bkg = this.add.tileSprite(
      0,
      0,
      Global.WORLD_WIDTH * 2,
      Global.WORLD_HEIGHT * 2,
      'background'
    );
    this.matter.world.setGravity(0, 1, 0.001);

    // Generate player
    Game.player = new PlayerTank(this, 0, 0);
    Game.player.setIgnoreGravity(true);

    // draw debugs
    // this.matter.world.createDebugGraphic();
    this.matter.world.drawDebug = false;
    this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;

    this.cameras.main.startFollow(Game.player);

    addWrapCamera();
    // addWorldBorder();

    // this.matter.set60Hz();
    this.matter.set30Hz();

    Global.socket.onSync((m: any) => {
      this.sync(m);
    });

    Global.socket.init();
  }

  update(time: number, delta: number) {
    // not used, listen to the Game.scene.events.on(Phaser.Scenes.Events.UPDATE, callback) directly
  }

  sync(remote_data?: RawGameData) {
    // Terrain
    remote_data?.map?.platforms?.forEach((data: any) => {
      if (data?.length == 1 && data[0] in this.platforms) {
        // Destroy platform
        (this.platforms[data[0]] as Platform).gameObject?.destroy();
        delete this.platforms[data[0]];
      } else if (data.length == 3) {
        // New platform
        const platform = new Platform(
          this,
          data[0],
          undefined,
          data[1][0],
          data[1][1],
          data[2],
          [0x39ff14, 0xffa500, 0xfff857, 0x00ffff, 0xff80cd]
        );
        this.platforms[data[0]] = platform;
      }
    });

    // Tank
    if (remote_data?.self) {
      if ('x' in remote_data.self) {
        Game.player.syncRemote(remote_data.self);
      }
      if ('health' in remote_data.self) {
        Game.player.set('HP', remote_data.self?.health);
      }
      if ('exp' in remote_data.self) {
        Game.player.set('XP', remote_data.self?.exp);
      }
    }
    const remote_player_keys = [] as string[];
    remote_data?.players?.forEach((player: RawTankData) => {
      if (player.id) remote_player_keys.push(player.id);
      if (player.id && player.id in this.players) {
        // Update existing tank
        const tank = this.players[player.id] as BaseTank;
        if (tank.active) {
          tank.setThrustSpeed(player.thrust || 0);
          tank.setCannonAngle(player.c_ang || 0);
          if ('x' in player) tank.syncRemote(player);
        }
      } else {
        // Create new tank
        if (player.id) {
          this.players[player.id] = new BaseTank(
            this,
            player.x || 0,
            player.y || 0
          );
        }
      }
      /* Upgrades */
      if (player.upgrades && player.upgrades.length == UPGRADES_TYPES.length) {
        const tank = this.players[player.id || ''] as BaseTank;
        UPGRADES_TYPES.forEach((key: string, index: number) => {
          tank?.set(key, player.upgrades?.[index]);
        });
      }
    });
    Object.keys(this.players).forEach((key: any) => {
      const player = this.players[key];
      if (!remote_player_keys.includes(key)) {
        player.get('components')?.cannon_body.gameObject.destroy();
        player.destroy();
        delete this.players[key];
      }
    });
    if (Game.player.body.ignoreGravity == true) {
      this.initiated = true;
      this.cameras.main.zoomTo(1, 5, 'Cubic');
      Game.player.setIgnoreGravity(false);
    }

    // Bullets
    remote_data?.bullets?.forEach((bullet: RawBulletData) => {
      if (bullet.player && bullet.player in this.players) {
        const parent_tank = this.players[bullet.player];

        switch (bullet.type) {
          case 'bullet':
            new Bullet(
              this,
              bullet.x,
              bullet.y,
              bullet.vx,
              bullet.vy,
              parent_tank
            );
            break;
          case 'cannonball':
            new Cannon(
              this,
              bullet.x,
              bullet.y,
              bullet.vx,
              bullet.vy,
              parent_tank
            );
            break;
          case 'grenade':
            new Grenade(
              this,
              bullet.x,
              bullet.y,
              bullet.vx,
              bullet.vy,
              parent_tank
            );
            break;
          case 'uzi':
            new Uzi(
              this,
              bullet.x,
              bullet.y,
              bullet.vx,
              bullet.vy,
              parent_tank
            );
            break;
        }
      }
    });
  }

  loadTankSprites() {
    PlayerTank.skins.forEach((s) => {
      this.load.atlas(
        s + 'tank',
        'assets/sprites/' + s + 'tank-sprites.png',
        'assets/frames/' + s + 'tank.json'
      );
      this.load.image(s + 'tank-cannon', 'assets/cannons/' + s + '-cannon.png');
    });
  }

  progressBar() {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      Global.SCREEN_WIDTH / 2 - 160,
      Global.SCREEN_HEIGHT / 2 - 25,
      320,
      50
    );
    const loadingText = this.make.text({
      x: Global.SCREEN_WIDTH / 2,
      y: Global.SCREEN_HEIGHT / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    this.load.on('progress', function (value: any) {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        Global.SCREEN_WIDTH / 2 - 150,
        Global.SCREEN_HEIGHT / 2 - 15,
        300 * value,
        30
      );
    });

    this.load.on('complete', function () {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      Global.event_bus.emit('loading_finished');
    });
  }
}

function addWrapCamera() {
  // Wrap camera causes significant FPS drop, currently disabled
  // return;
  wrapCamB = Game.scene.cameras.add(
    0,
    0,
    Global.SCREEN_WIDTH,
    Global.SCREEN_HEIGHT,
    false,
    'wrapCamB'
  );
  wrapCamB.setBounds(
    -Global.WORLD_WIDTH / 2,
    -Global.WORLD_HEIGHT,
    Global.WORLD_WIDTH,
    Global.WORLD_HEIGHT * 2
  );
  wrapCamB.startFollow(Game.player, undefined, 1, 0);
  wrapCamB.scrollY = -Global.WORLD_HEIGHT / 2;
  wrapCamB.setAlpha(1);

  wrapCamT = Game.scene.cameras.add(
    0,
    0,
    Global.SCREEN_WIDTH,
    Global.SCREEN_HEIGHT,
    false,
    'wrapCamT'
  );
  wrapCamT.setBounds(
    -Global.WORLD_WIDTH / 2,
    -Global.WORLD_HEIGHT,
    Global.WORLD_WIDTH,
    Global.WORLD_HEIGHT * 2
  );
  wrapCamT.startFollow(Game.player, undefined, 1, 0);
  wrapCamT.scrollY = Global.WORLD_HEIGHT / 2 - Global.SCREEN_HEIGHT;
  wrapCamT.setAlpha(1);

  Game.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, (event: any) => {
    wrapCamB.setViewport(
      0,
      -Game.player.y + (Global.WORLD_HEIGHT + Global.SCREEN_HEIGHT) / 2,
      Global.SCREEN_WIDTH,
      Global.SCREEN_HEIGHT
    );
    wrapCamT.setViewport(
      0,
      -Game.player.y - (Global.WORLD_HEIGHT + Global.SCREEN_HEIGHT) / 2,
      Global.SCREEN_WIDTH,
      Global.SCREEN_HEIGHT
    );
  });
}

function addWorldBorder() {
  // return;
  Game.scene.add.rectangle(
    0,
    -Global.WORLD_HEIGHT / 2,
    Global.WORLD_WIDTH,
    20,
    0xff0000
  );
  Game.scene.add.rectangle(
    0,
    Global.WORLD_HEIGHT / 2,
    Global.WORLD_WIDTH,
    20,
    0xff0000
  );
  Game.scene.add.rectangle(
    -Global.WORLD_WIDTH / 2,
    0,
    20,
    Global.WORLD_HEIGHT,
    0xff0000
  );
  Game.scene.add.rectangle(
    Global.WORLD_WIDTH / 2,
    0,
    20,
    Global.WORLD_HEIGHT,
    0xff0000
  );
  return;

  Game.scene.add
    .rectangle(Global.SCREEN_WIDTH / 2, 0, Global.SCREEN_WIDTH, 5, 0x00ff00)
    .setScrollFactor(0);
  Game.scene.add
    .rectangle(
      Global.SCREEN_WIDTH / 2,
      Global.SCREEN_HEIGHT,
      Global.SCREEN_WIDTH,
      5,
      0x00ff00
    )
    .setScrollFactor(0);
}
