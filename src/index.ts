import Phaser from 'phaser';
import config from './config';
import GameScene from './scenes/Game';
import HUDScene from './scenes/HUD';

new Phaser.Game(
  Object.assign(config, {
    scene: [GameScene, HUDScene]
  })
);
