import Phaser from 'phaser';
import Global from '@/global';
import $ from 'jquery';
import NetworkController from '@/NetworkController';
import Console from '@/components/Console';
import Game from '@/scenes/Game';
import HUD from './HUD';

export default class Login extends Phaser.Scene {
  graphics!: Phaser.GameObjects.Graphics;
  gameButton!: Phaser.GameObjects.Sprite;
  gameText!: Phaser.GameObjects.Text;

  public static scene: Login;
  public static playerName: string;
  constructor() {
    super({ key: Global.SCENE_LOGIN, active: true });
  }

  preload() {
    this.load.html('loginform', 'assets/loginform.html');
    this.load.image('loginbkg', 'assets/space2.png');
    this.load.image('logo', 'assets/logo.png');
  }

  create() {
    if (!Global.console) Global.console = new Console();

    Login.scene = this;
    const bkg = this.add.image(
      Global.SCREEN_WIDTH / 2,
      Global.SCREEN_HEIGHT / 2,
      'loginbkg'
    );
    bkg.scaleX = 0.39;
    bkg.scaleY = 0.34;
    const logo = this.add.image(Global.SCREEN_WIDTH / 2, 200, 'logo');
    logo.scale = 0.7;

    const element = this.add
      .dom(Global.SCREEN_WIDTH / 2, 0)
      .createFromCache('loginform');

    const submit_login = function () {
      let username = $('#username').val() as string;
      username = username?.trim();
      if (username != '') {
        if (!Global.socket) Global.socket = new NetworkController();
        Global.socket
          .login(username)
          .then((msg) => {
            // element.setVisible(false);
            Login.scene.scene.add(Global.SCENE_HUD, HUD);
            Login.scene.scene.add(Global.SCENE_GAME, Game);
            Login.scene.scene.start(Global.SCENE_HUD, {
              playerName: username
            });
            Login.scene.scene.start(Global.SCENE_GAME);
            Login.scene.scene.pause(Global.SCENE_LOGIN);
          })
          .catch((err) => {
            Global.console.error('Failed to login: ' + err);
            console.log(err);
          });
      }
    };

    $('#loginButton').on('click', submit_login);
    $('#username').on('keydown', function (event: any) {
      if (event.code != 'Enter') return;
      submit_login();
    });
    $('#username')[0].focus();

    this.tweens.add({
      targets: element,
      y: Global.SCREEN_WIDTH - Global.SCREEN_HEIGHT / 2.5,
      duration: 1500,
      ease: 'Power3'
    });
  }
}
