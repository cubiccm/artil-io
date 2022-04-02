import Phaser from 'phaser';
import config from './config';
import GameScene from './scenes/Game';

const index = new Phaser.Game(
  Object.assign(config, {
    scene: [GameScene]
  })
);

export { index };
