const Phaser = (window as any).Phaser as typeof import('phaser');
import config from '@/config';
import Global from '@/global';
import GameScene from '@/scenes/Game';
import HUDScene from '@/scenes/HUD';
import LoginScene from '@/scenes/Login';

let current_game: Phaser.Game;

export const createNewGame = () => {
  current_game = new Phaser.Game(
    Object.assign(config, {
      scene: [LoginScene, GameScene, HUDScene]
    })
  );
  return current_game;
};

createNewGame();

window.addEventListener(
  'resize',
  () => {
    Global.SCREEN_WIDTH = window.innerWidth;
    Global.SCREEN_HEIGHT = window.innerHeight;
    current_game.scale.resize(window.innerWidth, window.innerHeight);
  },
  false
);

export { current_game };
