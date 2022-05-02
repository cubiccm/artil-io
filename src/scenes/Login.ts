import Phaser from 'phaser';
import Global from '@/global';
import $ from 'jquery';
import NetworkController from '@/NetworkController';
import Console from '@/components/Console';
import Game from '@/scenes/Game';

const _w = Global.SCREEN_WIDTH,
  _h = Global.SCREEN_HEIGHT;
export default class Login extends Phaser.Scene {
  graphics!: Phaser.GameObjects.Graphics;
  gameButton!: Phaser.GameObjects.Sprite;
  gameText!: Phaser.GameObjects.Text;

  public static scene: Login;
  public static playerName: string;
  constructor() {
    super({ key: 'LoginScene', active: true });
  }

  preload() {
    this.load.html('loginform', 'assets/loginform.html');
    this.load.image('background', 'assets/city.png');
    this.load.image('logo', 'assets/logo.png');
  }

  create() {
    Global.console = new Console();

    Login.scene = this;
    const bkg = this.add.image(_w / 2, _h / 2, 'background');
    // bkg.scale = 1.8;
    const logo = this.add.image(_w / 2, 200, 'logo');
    logo.scale = 0.7;

    const element = this.add.dom(_w / 2, 0).createFromCache('loginform');

    const submit_login = function () {
      let username = $('#username').val() as string;
      username = username?.trim();
      if (username != '') {
        if (!Global.socket) Global.socket = new NetworkController();
        Global.socket
          .login(username)
          .then((msg) => {
            element.setVisible(false);
            Game.scene.remote_data = msg;
            Login.scene.scene.start('Artilio');
          })
          .catch((msg) => {
            Global.console.error('Failed to login: ' + msg);
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
      y: _h - _h / 2.5,
      duration: 1500,
      ease: 'Power3'
    });
  }
}
