import Global from '@/global';
import Game from '@/scenes/Game';
import { current_game } from '..';
import PlayerTank from '@/components/Tank/PlayerTank';

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
    if (Game.scene.initiated == false) return '';
    const player = Game.player;
    return `
      x: ${Math.round(player?.x)}, y: ${Math.round(player?.y)}
      HP: ${player?.get('HP')}
      XP: ${player?.get('XP')}
      L: ${player?.data.values.sensors.left.blocked} R: ${
      player?.data.values.sensors.right.blocked
    } B: ${player?.data.values.sensors.bottom.blocked}
      FPS: ${current_game.loop.actualFps}
      `;
  }

  update(time: number, delta: number) {
    if (!this.active) return;
    this.setText(this.getDebugMessage());
  }
}
