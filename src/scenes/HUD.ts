import Phaser from 'phaser';
import Global from '@/global';
import Game from '@/scenes/Game';
import DebugMessage from '@/components/DebugMessage';

const bar_width = 300,
  bar_height = 30;
const bottom_margin = 30;

export default class HUD extends Phaser.Scene {
  show_debug_info = true;

  username_text?: Phaser.GameObjects.Text;
  health_bar_graphics?: Phaser.GameObjects.Graphics;
  health_bar_text?: Phaser.GameObjects.Text;
  xp_bar_graphics?: Phaser.GameObjects.Graphics;
  xp_bar_text?: Phaser.GameObjects.Text;
  gamescene?: Game;
  debug_message?: Phaser.GameObjects.Text;

  public static playerName: string;
  public static upgradeBox: Phaser.GameObjects.DOMElement;
  public static tank_box: HTMLDivElement;
  public static weapon_box: HTMLDivElement;
  public static skin_box: HTMLDivElement;
  constructor() {
    super(Global.SCENE_HUD);
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
    this.gamescene = this.scene.get(Global.SCENE_GAME) as Game;

    Global.event_bus.on(
      'player-health-update',
      () => {
        this.drawHealthBar(
          Game.player.get('HP') || 0,
          Game.player.get('max_health') || 0
        );
      },
      this
    );

    Global.event_bus.on(
      'player-xp-update',
      () => {
        this.drawExpBar(Game.player.get('XP') || 0, 1000);
      },
      this
    );

    this.scale.on(
      'resize',
      () => {
        if (this && this.scene.isActive()) this.redrawAll();
      },
      this
    );

    if (this.show_debug_info)
      this.debug_message = new DebugMessage(this, 16, 16);

    this.redrawAll();

    const upgradeBox = this.add
      .dom(25, Global.SCREEN_HEIGHT - Global.SCREEN_HEIGHT / 2)
      .createFromCache('upgrade_box');

    HUD.upgradeBox = upgradeBox;
    HUD.tank_box = HUD.upgradeBox.getChildByID(
      'tank-options'
    ) as HTMLDivElement;
    HUD.weapon_box = HUD.upgradeBox.getChildByID(
      'weapon-options'
    ) as HTMLDivElement;
    HUD.skin_box = HUD.upgradeBox.getChildByID(
      'skin-options'
    ) as HTMLDivElement;
    HUD.tank_box.style.visibility = 'hidden';
    HUD.weapon_box.style.visibility = 'hidden';
    HUD.skin_box.style.visibility = 'hidden';
    upgradeBox.addListener('click');
    upgradeBox.on('click', function (event: any) {
      switch (event.target.className) {
        case 'select-buttons': {
          const element = event.target as HTMLDivElement;
          HUD.selectUpgrade(upgradeBox, element);
          break;
        }
        case 'add': {
          HUD.upgradeTank(upgradeBox, event.target.name);
          break;
        }
        case 'weapon-item': {
          HUD.select(event.target as HTMLInputElement, 'weapon');
          break;
        }
        case 'skin-item': {
          HUD.select(event.target as HTMLInputElement, 'skin');
          break;
        }
        default:
          break;
      }
    });
  }

  update() {
    if (Game.player) {
      const exp = Game.player.tank_data.XP;
      // Update upgrade cost colors if enough XP
      const upgrade_costs = HUD.upgradeBox
        .getChildByID('tank-options')
        .getElementsByClassName('add') as HTMLCollectionOf<HTMLButtonElement>;

      const weapon_costs = HUD.upgradeBox
        .getChildByID('weapon-options')
        .getElementsByClassName('cost') as HTMLCollectionOf<HTMLDivElement>;

      const skin_costs = HUD.upgradeBox
        .getChildByID('skin-options')
        .getElementsByClassName('cost') as HTMLCollectionOf<HTMLDivElement>;
      for (const item of upgrade_costs) {
        if (parseInt(item.textContent as string) > exp) {
          item.style.setProperty('color', 'red');
        } else {
          item.style.setProperty('color', 'gray');
        }
      }
      for (const item of weapon_costs) {
        if (parseInt(item.textContent as string) > exp) {
          item.style.setProperty('color', 'red');
        } else {
          item.style.setProperty('color', 'gray');
        }
      }
      for (const item of skin_costs) {
        if (parseInt(item.textContent as string) > exp) {
          item.style.setProperty('color', 'red');
        } else {
          item.style.setProperty('color', 'gray');
        }
      }
      const pointer = Game.scene.input.activePointer;
      if (pointer.leftButtonDown()) {
        if (!HUD.inHUDBounds(pointer.x, pointer.y)) {
          (
            HUD.upgradeBox.getChildByID('tank-upgrades') as HTMLInputElement
          ).style.setProperty('background-color', 'gray');
          (
            HUD.upgradeBox.getChildByID('weapon-upgrades') as HTMLInputElement
          ).style.setProperty('background-color', 'gray');
          (
            HUD.upgradeBox.getChildByID('skin-upgrades') as HTMLInputElement
          ).style.setProperty('background-color', 'gray');
          HUD.tank_box.style.visibility = 'hidden';
          HUD.weapon_box.style.visibility = 'hidden';
          HUD.skin_box.style.visibility = 'hidden';
        }
      }
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
    const open = upgradeBox.getChildByID(
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
    const button = upgradeBox.getChildByName(name) as HTMLButtonElement;
    const parent = button.parentElement as HTMLDivElement;
    const bar = parent.childNodes[1] as HTMLDivElement;
    // Increment bar
    const cost = parseInt(button.textContent as string);
    if (cost <= Game.player.tank_data.XP) {
      const amount = parseInt(bar.getAttribute('data-amount') as string) + 20;
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
        Game.player.inc('XP', -cost);
        button.textContent = (cost + 100).toString();
        this.upgrade(parent.id);
      }
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
        player_data.weapon_damage += 0.2;
        break;
      }
      case 'body-speed': {
        player_data.speed_ground += 1.5;
        break;
      }
      case 'bullet-speed': {
        player_data.bullet_speed += 0.1;
        break;
      }
      case 'jump': {
        // player_data.speed_jump += 1.5;
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
  private static select(button: HTMLInputElement, type: string) {
    const items = button.parentElement?.parentElement?.childNodes;
    const unlocked = button.getAttribute('unlocked');
    if (unlocked == 'true') {
      // Set player tank texture accordingly
      this.clearButtons(items);
      button.style.setProperty('background-color', 'bisque');
      if (type == 'skin') HUD.updateSkin(button.name);
      else if (type == 'weapon')
        Game.player.tank_data.weapon = button.getAttribute('name') as string;
    } else if (unlocked == 'false') {
      const costElement = button.parentElement?.childNodes[3] as HTMLDivElement;
      const cost = parseInt(costElement.textContent as string);
      const canUnlock = cost <= Game.player.tank_data.XP;
      if (canUnlock) {
        this.clearButtons(items);
        costElement.style.setProperty('visibility', 'hidden');
        Game.player.inc('XP', -cost);
        const folder = type == 'skin' ? 'tank-skins' : 'weapons';
        button.setAttribute(
          'src',
          'assets/hud-elements/' +
            folder +
            '/' +
            button.getAttribute('name') +
            '.png'
        );
        button.setAttribute('unlocked', 'true');
        button.style.setProperty('background-color', 'bisque');
        if (type == 'skin') HUD.updateSkin(button.name);
        else if (type == 'weapon')
          Game.player.tank_data.weapon = button.getAttribute('name') as string;
      }
    }
  }
  private static clearButtons(items: NodeListOf<ChildNode> | undefined) {
    items?.forEach((e) => {
      if (e.nodeName == 'DIV') {
        const i = e.childNodes[1];
        if (i.nodeName == 'INPUT') {
          const child = i as HTMLInputElement;
          child.style.setProperty('background-color', 'lightgray');
        }
      }
    });
  }
  private static updateSkin(skin: string) {
    Game.player.tank_data.skin = skin;
    Game.player.setTexture(skin);
    Game.player.anims.remove('moving_right');
    Game.player.anims.remove('moving_left');
    Game.player.anims.remove('idle');
    Game.player.createWheelAnimations();
    Game.player.tank_data.components.cannon_texture?.destroy();
    Game.player.createCannonEnd();
  }

  redrawAll() {
    this.drawHealthBar(
      Game.player?.get('HP') || 0,
      Game.player?.get('max_health') || 0
    );
    this.drawExpBar(Game.player?.get('XP') || 0, 1000);
    this.username_text?.destroy();
    this.username_text = this.add
      .text(
        Global.SCREEN_WIDTH / 2,
        Global.SCREEN_HEIGHT - bottom_margin - bar_height - 25,
        HUD.playerName,
        {
          fontSize: '18pt',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          color: 'rgba(255, 255, 255, .8)',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center'
        }
      )
      .setOrigin(0.5);
  }

  drawHealthBar(current_health: number, max_health: number) {
    const outline_color = 0xffa500,
      outline_alpha = 0.8;
    const fill_color = 0xffa500,
      fill_alpha = 0.5;

    this.health_bar_graphics?.clear();

    this.health_bar_graphics?.lineStyle(3, outline_color, outline_alpha);
    this.health_bar_graphics?.strokeRoundedRect(
      Global.SCREEN_WIDTH / 2 - bar_width - 10,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height,
      bar_width,
      bar_height,
      bar_height / 2
    );
    this.health_bar_graphics?.fillStyle(fill_color, fill_alpha);
    this.health_bar_graphics?.fillRoundedRect(
      Global.SCREEN_WIDTH / 2 - bar_width - 10,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height,
      bar_height +
        (bar_width - bar_height) *
          (current_health / (max_health || current_health || 1)),
      bar_height,
      bar_height / 2
    );

    if (current_health != 0)
      current_health = Math.max(1, Math.floor(current_health));
    max_health = Math.floor(max_health);
    if (!this.health_bar_text || this.health_bar_text.active == false) {
      this.health_bar_text = this.add
        .text(
          (Global.SCREEN_WIDTH - bar_width) / 2,
          Global.SCREEN_HEIGHT - bottom_margin - bar_height / 2,
          `Health`,
          {
            fontSize: '14pt',
            fontFamily: 'monospace',
            align: 'center',
            color: 'rgba(255, 255, 255, .8)',
            stroke: '#000000',
            strokeThickness: 2
          }
        )
        .setOrigin(0.5);
    }
    this.health_bar_text.setPosition(
      (Global.SCREEN_WIDTH - bar_width) / 2 - 10,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height / 2
    );
    this.health_bar_text.setText(`Health: ${current_health} / ${max_health}`);
  }

  drawExpBar(current_exp: number, max_exp: number) {
    const base_color = 0xff80cd;

    this.xp_bar_graphics?.clear();

    this.xp_bar_graphics?.lineStyle(3, base_color, 0.8);
    this.xp_bar_graphics?.strokeRoundedRect(
      Global.SCREEN_WIDTH / 2 + 10,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height,
      bar_width,
      bar_height,
      bar_height / 2
    );

    this.xp_bar_graphics?.fillStyle(base_color, 0.5);
    this.xp_bar_graphics?.fillRoundedRect(
      Global.SCREEN_WIDTH / 2 + 10,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height,
      bar_height +
        (bar_width - bar_height) *
          (current_exp / (max_exp || current_exp || 1)),
      bar_height,
      bar_height / 2
    );
    max_exp = Math.floor(max_exp);

    if (!this.xp_bar_text || this.xp_bar_text.active == false) {
      this.xp_bar_text = this.add
        .text(
          (Global.SCREEN_WIDTH + bar_width) / 2,
          Global.SCREEN_HEIGHT - bottom_margin - bar_height / 2,
          `Health`,
          {
            fontSize: '14pt',
            fontFamily: 'monospace',
            align: 'center',
            color: 'rgba(255, 255, 255, .8)',
            stroke: '#000000',
            strokeThickness: 2
          }
        )
        .setOrigin(0.5);
    }
    this.xp_bar_text.setPosition(
      (Global.SCREEN_WIDTH + bar_width) / 2 + 10,
      Global.SCREEN_HEIGHT - bottom_margin - bar_height / 2
    );
    this.xp_bar_text.setText(`EXP: ${current_exp} / ${max_exp}`);
  }
  public static inHUDBounds(x: number, y: number) {
    const main_bounds = {
      x1: HUD.upgradeBox.x - HUD.upgradeBox.width / 2,
      x2: HUD.upgradeBox.x + HUD.upgradeBox.width * 2,
      y1: HUD.upgradeBox.y - HUD.upgradeBox.height / 2,
      y2: HUD.upgradeBox.y + HUD.upgradeBox.height * 2
    };
    const tank_bounds = {
      x1: main_bounds.x2,
      x2: main_bounds.x2 + 285,
      y1: main_bounds.y1,
      y2: main_bounds.y1 + 398
    };
    const weapon_bounds = {
      x1: main_bounds.x2,
      x2: main_bounds.x2 + 175,
      y1: main_bounds.y1 + 50,
      y2: main_bounds.y1 + 50 + 250
    };
    const skin_bounds = {
      x1: main_bounds.x2,
      x2: main_bounds.x2 + 350,
      y1: main_bounds.y1 + 60,
      y2: main_bounds.y1 + 60 + 250
    };
    if (
      x > main_bounds.x1 &&
      x < main_bounds.x2 &&
      y > main_bounds.y1 &&
      y < main_bounds.y2
    )
      return true;
    else if (
      HUD.tank_box.style.visibility == 'visible' &&
      x > tank_bounds.x1 &&
      x < tank_bounds.x2 &&
      y > tank_bounds.y1 &&
      y < tank_bounds.y2
    )
      return true;
    else if (
      HUD.weapon_box.style.visibility == 'visible' &&
      x > weapon_bounds.x1 &&
      x < weapon_bounds.x2 &&
      y > weapon_bounds.y1 &&
      y < weapon_bounds.y2
    )
      return true;
    else if (
      HUD.skin_box.style.visibility == 'visible' &&
      x > skin_bounds.x1 &&
      x < skin_bounds.x2 &&
      y > skin_bounds.y1 &&
      y < skin_bounds.y2
    )
      return true;
    else return false;
  }
}
