import Phaser from 'phaser';
import Global from '@/global';
import Game from './Game';
import config from '../config';
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
    this.load.image('loginbkg', 'assets/space2.png');
    this.load.image('logo', 'assets/logo.png');
  }

  create() {
    Login.scene = this;
    //const bkg = this.add.tileSprite(_w / 2, _h / 2, _w, _h, 'loginbkg');
    const bkg = this.add.image(_w / 2, _h / 2, 'loginbkg');
    bkg.scaleX = 0.39;
    bkg.scaleY = 0.34;
    //bkg.scale = 0.38;
    const logo = this.add.image(_w / 2, 200, 'logo');
    logo.scale = 0.7;

    var element = this.add.dom(_w / 2, 0).createFromCache('loginform');

    element.addListener('click');
    element.on('click', function (event: any) {
      if (event.target.name == 'loginButton') {
        var inputUsername = element.getChildByName(
          'username'
        ) as HTMLInputElement;

        if (inputUsername.value != '') {
          element.removeListener('click');
          // element.setVisible(false);
          element.destroy();
          Login.scene.scene.start('HUDScene', {
            playerName: inputUsername.value
          });
          Login.scene.scene.start('Artilio');
        }
      }
    });

    this.tweens.add({
      targets: element,
      y: _h - _h / 2.5,
      duration: 1500,
      ease: 'Power3'
    });
  }
}
