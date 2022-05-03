import Phaser from 'phaser';
import config from '@/config';
import Global from '@/global';
import GameScene from '@/scenes/Game';
import HUDScene from '@/scenes/HUD';
import LoginScene from '@/scenes/Login';

export const createNewGame = () => {
  return new Phaser.Game(
    Object.assign(config, {
      scene: [LoginScene, GameScene, HUDScene]
    })
  );
};
const index = createNewGame();

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
