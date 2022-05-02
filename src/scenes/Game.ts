import Phaser from 'phaser';
import PlayerTank from '@/components/Tank/PlayerTank';
import DebugMessage from '@/components/DebugMessage';
import Global from '@/global';
import generateTerrain from '@/scripts/terrainGenerator';
import _ from 'lodash';

let debugMessage: Phaser.GameObjects.Text;
let wrapCamB: Phaser.Cameras.Scene2D.Camera;
let wrapCamT: Phaser.Cameras.Scene2D.Camera;

export default class Game extends Phaser.Scene {
  public static scene: Game;
  public static player: PlayerTank;
  public static playerName: string;
  public static keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  public static keys: any;

  constructor() {
    super('Artilio');
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
    Game.scene = this;
    Game.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,W,A,S,D,SPACE');

    // cam.setBounds(
    //   -Global.WORLD_WIDTH / 2,
    //   -Global.WORLD_HEIGHT,
    //   Global.WORLD_WIDTH,
    //   Global.WORLD_HEIGHT * 2
    // );

    this.matter.world.setBounds(
      -Global.WORLD_WIDTH,
      -Global.WORLD_HEIGHT,
      Global.WORLD_WIDTH * 2,
      Global.WORLD_HEIGHT * 2,
      undefined,
      true,
      false,
      false,
      false
    );

    this.cameras.main.scrollX = -Global.SCREEN_WIDTH / 2;
    this.cameras.main.scrollY = -Global.SCREEN_HEIGHT / 2;
    this.input.on(
      'drag',
      (pointer: any, gameObject: any, dragX: any, dragY: any) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    );

    const bkg = this.add.tileSprite(
      0,
      0,
      Global.WORLD_WIDTH * 2,
      Global.WORLD_HEIGHT * 2,
      'background'
    );
    this.matter.world.setGravity(0, 1, 0.001);

    generateTerrain(this);

    // Generate player
    Game.player = new PlayerTank(this, 0, 0);
    // player.setIgnoreGravity(true);

    debugMessage = new DebugMessage(this, Game.player, 16, 16);

    // draw debugs
    this.matter.world.createDebugGraphic();
    this.matter.world.drawDebug = true;
    this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;
    this.cameras.main.startFollow(Game.player);

    addWrapCamera();
    addWorldBorder();

    // this.matter.set60Hz();
    this.matter.set30Hz();
  }

  update(time: number, delta: number) {
    // not used, listen to the Game.scene.events.on(Phaser.Scenes.Events.UPDATE, callback) directly
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
    var progressBar = this.add.graphics();
    var progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      Global.SCREEN_WIDTH / 2 - 160,
      Global.SCREEN_HEIGHT / 2 - 25,
      320,
      50
    );
    var loadingText = this.make.text({
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
  wrapCamB.setAlpha(0.6);

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
  wrapCamT.setAlpha(0.6);

  Game.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, function (event: any) {
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
