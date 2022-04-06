import Phaser from 'phaser';
import Global from '@/global';
import Game from './Game';
import DebugMessage from '@/components/DebugMessage';

export default class HUD extends Phaser.Scene {
  show_debug_info = false;

  health_bar_graphics!: Phaser.GameObjects.Graphics;
  health_bar_text!: Phaser.GameObjects.Text;
  xp_bar_graphics!: Phaser.GameObjects.Graphics;
  gamescene!: Game;
  debug_message?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HUDScene', active: true });
  }

  preload() {
    // Not used
  }

  create() {
    this.health_bar_graphics = this.add.graphics();
    this.xp_bar_graphics = this.add.graphics();
    this.gamescene = this.scene.get('Artilio') as Game;

    // Temporary initial value for demo
    this.drawHealthBar(160, 200);
    this.drawExpBar(30, 100);

    Global.event_bus.on(
      'player-health-update',
      () => {
        this.drawHealthBar(Game.player.get('HP'), 200);
      },
      this
    );

    Global.event_bus.on(
      'player-xp-update',
      () => {
        this.drawExpBar(Game.player.get('XP'), 100);
      },
      this
    );

    if (this.show_debug_info)
      this.debug_message = new DebugMessage(this, 16, 16);
  }

  update() {
    // Not used
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
    if (!this.health_bar_text) {
      this.health_bar_text = this.add
        .text(
          Global.SCREEN_WIDTH / 2,
          Global.SCREEN_HEIGHT - bottom_margin - bar_height / 2,
          `Health`,
          {
            fontSize: '14pt',
            fontFamily: 'consolas', // TODO: Select a font for the game
            // fontStyle: 'bold'
            align: 'center',
            color: 'rgba(255, 255, 255, 1)',
            stroke: '#000000',
            strokeThickness: 2
          }
        )
        .setOrigin(0.5);
    }
    this.health_bar_text.setText(`Health: ${current_health} / ${max_health}`);
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
