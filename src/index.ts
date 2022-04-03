import Phaser from 'phaser';
import config from './config';
import Global from './global';
import GameScene from './scenes/Game';

const index = new Phaser.Game(
  Object.assign(config, {
    scene: [GameScene]
  })
);

window.addEventListener(
  'resize',
  () => {
    console.log('resize');
    Global.SCREEN_WIDTH = window.innerWidth;
    Global.SCREEN_HEIGHT = window.innerHeight;
    index.scale.resize(window.innerWidth, window.innerHeight);
  },
  false
);

export { index };
