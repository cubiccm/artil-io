import Phaser from 'phaser';
import Global from './global';

export default {
  type: Phaser.AUTO,
  width: Global.SCREEN_WIDTH,
  height: Global.SCREEN_HEIGHT,
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 100 },
      enableSleep: false,
      debug: true
    }
  }
};
