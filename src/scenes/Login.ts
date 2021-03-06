const Phaser = (window as any).Phaser as typeof import('phaser');
import Global from '@/global';
import NetworkController from '@/NetworkController';
import Console from '@/components/Console';

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

    const usernameForm = document.querySelector(
      '#username'
    )! as HTMLInputElement;
    const submitButton = document.querySelector('#loginButton')!;

    const submit_login = () => {
      const username = usernameForm.value.trim();
      if (username != '') {
        if (!Global.socket) Global.socket = new NetworkController();
        Global.socket
          .login(username)
          .then((msg) => {
            Login.scene.scene.start(Global.SCENE_GAME);
            Login.scene.scene.start(Global.SCENE_HUD, {
              playerName: username
            });
          })
          .catch((err) => {
            Global.console.error('Failed to login: ' + err);
            console.log(err);
          });
      }
    };

    submitButton.addEventListener('click', submit_login);
    usernameForm.addEventListener('keypress', (e: any) => {
      if (e.key === 'Enter') {
        submit_login();
      }
    });
    usernameForm.focus();

    this.tweens.add({
      targets: element,
      y: Global.SCREEN_HEIGHT - Global.SCREEN_HEIGHT / 2.5,
      duration: 1500,
      ease: 'Power3'
    });
  }
}
