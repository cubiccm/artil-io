import Phaser from 'phaser';
import Global from '@/global';
import Game from './Game';
import { groupBy, max } from 'lodash';
import Login from './Login';
import PlayerTank from '@/components/Tank/PlayerTank';

const _w = Global.SCREEN_WIDTH,
  _h = Global.SCREEN_HEIGHT;
const bar_width = 300,
  bar_height = 30;
const bottom_margin = 30;
export default class HUD extends Phaser.Scene {
  graphics!: Phaser.GameObjects.Graphics;
  gamescene!: Game;

  public static playerName: string;
  public static upgradeBox: Phaser.GameObjects.DOMElement;
  constructor() {
    super({ key: 'HUDScene', active: true });
  }

  init(data: any) {
    HUD.playerName = data.playerName;
    console.log(HUD.playerName);
  }

  preload() {
    this.load.html('upgrade_box', 'assets/hud-elements/hud.html');
  }

  create() {
    this.graphics = this.add.graphics();
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
        .dom(50, _h - _h / 3)
        .createFromCache('upgrade_box');

      const tank_options = upgradeBox.getChildByID(
        'tank-options'
      ) as HTMLDivElement;
      const weapon_options = upgradeBox.getChildByID(
        'weapon-options'
      ) as HTMLDivElement;
      const skin_options = upgradeBox.getChildByID(
        'skin-options'
      ) as HTMLDivElement;

      HUD.upgradeBox = upgradeBox;
      upgradeBox.addListener('click');
      upgradeBox.on('click', function (event: any) {
        // Clicking Tank, Weapon, Skin upgrades:
        if (event.target.className == 'select-buttons') {
          let element = event.target as HTMLDivElement;
          let open = upgradeBox.getChildByID(
            element.getAttribute('open') as string
          ) as HTMLInputElement;
          if (open.style.visibility == 'visible') {
            open.style.setProperty('visibility', 'hidden');
          } else {
            tank_options.style.visibility = 'hidden';
            weapon_options.style.visibility = 'hidden';
            skin_options.style.visibility = 'hidden';
            open.style.setProperty('visibility', 'visible');
          }
        }

        // Clicking to upgrade tank:
        else if (event.target.className == 'add') {
          let button = upgradeBox.getChildByName(
            event.target.name
          ) as HTMLButtonElement;
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
            const player_data = Game.player.data.values;
            switch (event.target.id) {
              case 'health-regen': {
                player_data.regen_factor += 1;
              }
              case 'body-damage': {
              }
              case 'bullet-damage': {
              }
              case 'body-speed': {
                player_data.speed.run += 1;
              }
              case 'bullet-speed': {
              }
              case 'jump': {
                player_data.speed.jump += 1;
              }
              case 'reload': {
                player_data.reload -= 30;
              }
            }
            // TODO: only increment if enough EXP
          }
        }
        // Clicking to unlock skins
        else if (event.target.className == 'skin-item') {
          let button = event.target as HTMLInputElement;
          let items = button.parentElement?.childNodes;
          let unlocked = button.getAttribute('unlocked');
          if (unlocked == 'true') {
            // Set player tank texture accordingly
            items?.forEach((e) => {
              if (e.nodeName == 'INPUT') {
                let child = e as HTMLInputElement;
                child.style.setProperty('background-color', 'lightgray');
              }
            });
            button.style.setProperty('background-color', 'bisque');
          } else if (unlocked == 'false') {
            button.setAttribute(
              'src',
              'assets/hud-elements/tank-skins/' +
                button.getAttribute('name') +
                '.png'
            );
            button.setAttribute('unlocked', 'true');
            button.style.setProperty('background-color', 'bisque');
          }
        }
      });
    });
  }

  update() {
    this.graphics.clear();

    if (Game.player) {
      this.drawHealthBar(
        Game.player.tank_data.HP,
        200 // this.gamescene.player.tank_data.Max_HP
      );
      this.drawExpBar(
        Game.player.tank_data.XP + 20, // +20 only for showcase
        100 // this.gamescene.player.tank_data.Max_XP
      );
      // Draw upgrade box
      var exp = Game.player.tank_data.XP;
    }
  }

  drawUpgradeBox() {}

  drawHealthBar(current_health: number, max_health: number) {
    const bar_width = 300,
      bar_height = 30;
    const bottom_margin = 30;
    const outline_color = 0xff0000,
      outline_alpha = 0.8;
    const fill_color = 0xff5050,
      fill_alpha = 0.5;

    this.graphics.lineStyle(3, outline_color, outline_alpha);
    this.graphics.strokeRoundedRect(
      (_w - bar_width) / 2,
      _h - bottom_margin - bar_height,
      bar_width,
      bar_height,
      bar_height / 2
    );
    this.graphics.fillStyle(fill_color, fill_alpha);
    this.graphics.fillRoundedRect(
      (_w - bar_width) / 2,
      _h - bottom_margin - bar_height,
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

    this.graphics.fillStyle(base_color, 0.5);
    this.graphics.fillRoundedRect(
      (_w - bar_width) / 2,
      _h - bottom_margin - bar_height,
      bar_width,
      bar_height,
      bar_height / 2
    );

    this.graphics.fillStyle(base_color, 0.8);
    this.graphics.fillRoundedRect(
      (_w - bar_width) / 2,
      _h - bottom_margin - bar_height,
      bar_height + (bar_width - bar_height) * (current_exp / max_exp),
      bar_height,
      bar_height / 2
    );
  }
}
