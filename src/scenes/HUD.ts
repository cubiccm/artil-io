import Phaser from 'phaser';
import Global from '@/global';
import Game from './Game';
import Login from './Login';

const _w = Global.SCREEN_WIDTH,
  _h = Global.SCREEN_HEIGHT;

export default class HUD extends Phaser.Scene {
  graphics!: Phaser.GameObjects.Graphics;
  gamescene!: Game;

  constructor() {
    super({ key: 'HUDScene', active: true });
  }

  preload() {
    // Not used
  }

  create() {
    this.graphics = this.add.graphics();
    this.gamescene = this.scene.get('Artilio') as Game;
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
          fontFamily: 'consolas', // TODO: Select a font for the game
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
