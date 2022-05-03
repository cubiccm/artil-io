import Phaser from 'phaser';
import Global from '@/global';
import Game from '@/scenes/Game';
import DebugMessage from '@/components/DebugMessage';
import Login from '@/scenes/Login';

const _w = Global.SCREEN_WIDTH,
  _h = Global.SCREEN_HEIGHT;
const bar_width = 300,
  bar_height = 30;
const bottom_margin = 30;
export default class HUD extends Phaser.Scene {
  show_debug_info = true;

  health_bar_graphics!: Phaser.GameObjects.Graphics;
  health_bar_text!: Phaser.GameObjects.Text;
  xp_bar_graphics!: Phaser.GameObjects.Graphics;
  gamescene!: Game;
  debug_message?: Phaser.GameObjects.Text;

  public static playerName: string;
  public static upgradeBox: Phaser.GameObjects.DOMElement;
  constructor() {
    super({ key: 'HUDScene', active: true });
  }

  init(data: any) {
    HUD.playerName = data.playerName;
  }

  preload() {
    this.load.html('upgrade_box', 'assets/hud-elements/hud.html');
  }

  create() {
    this.health_bar_graphics = this.add.graphics();
    this.xp_bar_graphics = this.add.graphics();
    this.gamescene = this.scene.get('Artilio') as Game;

    Global.event_bus.on('loading_finished', () => {
      this.add.text(
        _w / 2,
        _h - bottom_margin - bar_height - 30,
        HUD.playerName,
        {
          fontSize: '14pt',
          fontFamily: 'monospace',
          color: 'rgba(255, 255, 255, .8)',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center'
        }
      );
      const upgradeBox = this.add
        .dom(25, _h - _h / 2)
        .createFromCache('upgrade_box');

      HUD.upgradeBox = upgradeBox;
      upgradeBox.addListener('click');
      upgradeBox.on('click', function (event: any) {
        Global.event_bus.emit('HUD_clicked');
        // Clicking Tank, Weapon, Skin upgrades:
        switch (event.target.className) {
          case 'select-buttons': {
            let element = event.target as HTMLDivElement;
            HUD.selectUpgrade(upgradeBox, element);
            break;
          }
          case 'add': {
            HUD.upgradeTank(upgradeBox, event.target.name);
            break;
          }
          case 'skin-item': {
            HUD.selectSkin(event.target as HTMLInputElement);
            let skin = event.target.name;
            Game.player.tank_data.skin = skin;
            Game.player.setTexture(skin);
            Game.player.anims.remove('moving_right');
            Game.player.anims.remove('moving_left');
            Game.player.anims.remove('idle');
            Game.player.createWheelAnimations();
            Game.player.tank_data.components.cannon_texture?.destroy();
            Game.player.createCannonEnd();
            break;
          }
          default:
            break;
        }
      });
    });
  }

  update() {
    if (Game.player) {
      this.drawHealthBar(
        Game.player.tank_data.HP,
        Game.player.tank_data.max_health
      );
      this.drawExpBar(
        Game.player.tank_data.XP + 20, // +20 only for showcase
        100 // this.gamescene.player.tank_data.Max_XP
      );

      var exp = Game.player.tank_data.XP;
      // Update upgrade cost colors if enough XP
    }
  }

  private static selectUpgrade(
    upgradeBox: Phaser.GameObjects.DOMElement,
    element: HTMLDivElement
  ) {
    const options = ['tank-options', 'weapon-options', 'skin-options'];
    const upgrade_types = ['tank-upgrades', 'weapon-upgrades', 'skin-upgrades'];

    upgrade_types.forEach((e) => {
      (upgradeBox.getChildByID(e) as HTMLDivElement).style.setProperty(
        'background-color',
        'gray'
      );
    });
    element.style.setProperty('background-color', 'lightgray');
    let open = upgradeBox.getChildByID(
      element.getAttribute('open') as string
    ) as HTMLInputElement;

    if (open.style.visibility == 'visible') {
      open.style.setProperty('visibility', 'hidden');
      element.style.setProperty('background-color', 'gray');
    } else {
      options.forEach((o) => {
        (upgradeBox.getChildByID(o) as HTMLDivElement).style.setProperty(
          'visibility',
          'hidden'
        );
      });
      open.style.setProperty('visibility', 'visible');
    }
  }
  private static upgradeTank(
    upgradeBox: Phaser.GameObjects.DOMElement,
    name: string
  ) {
    let button = upgradeBox.getChildByName(name) as HTMLButtonElement;
    let parent = button.parentElement as HTMLDivElement;
    let bar = parent.childNodes[1] as HTMLDivElement;
    // Increment bar
    // TODO: ONLY INCREMENT IF ENOUGH XP
    let amount = parseInt(bar.getAttribute('data-amount') as string) + 20;
    if (amount != 120) {
      bar.style.setProperty(
        'background',
        'linear-gradient(to right, ' +
          parent.getAttribute('color') +
          ' ' +
          amount +
          '%, rgb(78, 74, 74) ' +
          amount +
          '%)'
      );
      bar.setAttribute('data-amount', amount.toString());
      this.upgrade(parent.id);

      // TODO: only increment if enough EXP
    }
  }
  private static upgrade(attr: string) {
    const player_data = Game.player.tank_data;
    switch (attr) {
      case 'health-regen': {
        player_data.regen_factor += 2;
        break;
      }
      case 'max-health': {
        player_data.max_health += 25;
        break;
      }
      case 'bullet-damage': {
        break;
      }
      case 'body-speed': {
        player_data.speed.run += 1.5;
        break;
      }
      case 'bullet-speed': {
        player_data.bullets.forEach((b) => {
          player_data.bullet_speed += 0.1;
        });
        break;
      }
      case 'jump': {
        player_data.speed.jump += 1.5;
        break;
      }
      case 'reload': {
        player_data.reload -= 30;
        break;
      }
      default:
        break;
    }
  }
  private static selectSkin(button: HTMLInputElement) {
    let items = button.parentElement?.childNodes;
    items?.forEach((e) => {
      if (e.nodeName == 'INPUT') {
        let child = e as HTMLInputElement;
        child.style.setProperty('background-color', 'lightgray');
      }
    });
    let unlocked = button.getAttribute('unlocked');
    if (unlocked == 'true') {
      // Set player tank texture accordingly
      button.style.setProperty('background-color', 'bisque');
    } else if (unlocked == 'false') {
      button.setAttribute(
        'src',
        'assets/hud-elements/tank-skins/' + button.getAttribute('name') + '.png'
      );
      button.setAttribute('unlocked', 'true');
      button.style.setProperty('background-color', 'bisque');
    }
  }

  drawHealthBar(current_health: number, max_health: number) {
    const bar_width = 300,
      bar_height = 30;
    const bottom_margin = 30;
    const outline_color = 0xff0000,
      outline_alpha = 0.8;
    const fill_color = 0xff5050,
      fill_alpha = 0.5;

    this.health_bar_graphics.clear();

    this.health_bar_graphics.lineStyle(3, outline_color, outline_alpha);
    this.health_bar_graphics.strokeRoundedRect(
      (Global.SCREEN_WIDTH - bar_width) / 2,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height,
      bar_width,
      bar_height,
      bar_height / 2
    );
    this.health_bar_graphics.fillStyle(fill_color, fill_alpha);
    this.health_bar_graphics.fillRoundedRect(
      (Global.SCREEN_WIDTH - bar_width) / 2,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height,
      bar_height + (bar_width - bar_height) * (current_health / max_health),
      bar_height,
      bar_height / 2
    );

    if (current_health != 0)
      current_health = Math.max(1, Math.floor(current_health));
    max_health = Math.floor(max_health);
    this.add
      .text(
        _w / 2,
        _h - bottom_margin - bar_height / 2,
        `Health: ${current_health} / ${max_health}`,
        {
          fontSize: '14pt',
          fontFamily: 'monospace', // TODO: Select a font for the game
          // fontStyle: 'bold'
          align: 'center',
          color: 'rgba(255, 255, 255, .8)',
          stroke: '#000000',
          strokeThickness: 2
        }
      )
      .setOrigin(0.5);
  }

  drawExpBar(current_exp: number, max_exp: number) {
    const bar_width = 100,
      bar_height = 5;
    const bottom_margin = 15;
    const base_color = 0x0000ff;

    this.xp_bar_graphics.clear();

    this.xp_bar_graphics.fillStyle(base_color, 0.5);
    this.xp_bar_graphics.fillRoundedRect(
      (Global.SCREEN_WIDTH - bar_width) / 2,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height,
      bar_width,
      bar_height,
      bar_height / 2
    );

    this.xp_bar_graphics.fillStyle(base_color, 0.8);
    this.xp_bar_graphics.fillRoundedRect(
      (Global.SCREEN_WIDTH - bar_width) / 2,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height,
      bar_height + (bar_width - bar_height) * (current_exp / max_exp),
      bar_height,
      bar_height / 2
    );
  }
}
