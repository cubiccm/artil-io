import Global from '../global/js';
import Game from '../scenes/Game.js';
import { index } from '..';
import PlayerTank from './Tank/PlayerTank.js';

export default class debugMessage extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '', {
      fontSize: '18px',
      padding: { x: 10, y: 5 },
      backgroundColor: '#000000'
    });

    scene.add.existing(this);

    this.setScrollFactor(0);
    this.setText(this.getDebugMessage());

    Game.scene.events.on(
      Phaser.Scenes.Events.UPDATE,
      (time: number, delta: number) => this.update(time, delta)
    );
  }

  getDebugMessage() {
    const player = Game.player;
    return `
      x: ${Math.round(player?.x)}, y: ${Math.round(player?.y)}
      HP: ${player?.get('HP')}
      XP: ${player?.get('XP')}
      L: ${player?.data.values.sensors.left.blocked} R: ${
      player?.data.values.sensors.right.blocked
    } B: ${player?.data.values.sensors.bottom.blocked}
      FPS: ${index.loop.actualFps}
      `;
  }

  update(time: number, delta: number) {
    this.setText(this.getDebugMessage());
  }
}
