import Global from '@/global';
import Game from '@/scenes/Game';
import { index } from '..';
import PlayerTank from './Tank/PlayerTank';

export default class debugMessage extends Phaser.GameObjects.Text {
  public player: PlayerTank;

  constructor(scene: Phaser.Scene, player: PlayerTank, x: number, y: number) {
    super(scene, x, y, '', {
      fontSize: '18px',
      padding: { x: 10, y: 5 },
      backgroundColor: '#000000'
    });

    scene.add.existing(this);

    this.player = player;
    this.setScrollFactor(0);
    this.setText(this.getDebugMessage());

    Game.scene.events.on(
      Phaser.Scenes.Events.UPDATE,
      (time: number, delta: number) => this.update(time, delta)
    );
  }

  getDebugMessage() {
    return `
      x: ${Math.round(this.player.x)}, y: ${Math.round(this.player.y)}
      HP: ${this.player.tank_data.HP}
      XP: ${this.player.tank_data.XP}
      L: ${this.player.data.values.sensors.left.blocked} R: ${
      this.player.data.values.sensors.right.blocked
    } B: ${this.player.data.values.sensors.bottom.blocked}
      FPS: ${index.loop.actualFps}
      `;
  }

  update(time: number, delta: number) {
    this.setText(this.getDebugMessage());
  }
}
