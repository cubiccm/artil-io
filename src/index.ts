import Phaser from 'phaser';
import config from './config.js';
import Global from './global.js';
import GameScene from './scenes/Game.js';
import HUDScene from './scenes/HUD.js';
import LoginScene from './scenes/Login.js';
const index = new Phaser.Game(
  Object.assign(config, {
    scene: [LoginScene, GameScene, HUDScene]
  })
);

window.addEventListener(
  'resize',
  () => {
    Global.SCREEN_WIDTH = window.innerWidth;
    Global.SCREEN_HEIGHT = window.innerHeight;
    index.scale.resize(window.innerWidth, window.innerHeight);
  },
  false
);

export { index };
