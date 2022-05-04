import { divide } from 'lodash';
// import Phaser, { DOM } from 'phaser';
import Global from './global';

export default {
  type: Phaser.CANVAS,
  width: Global.SCREEN_WIDTH,
  height: Global.SCREEN_HEIGHT,
  parent: 'phaser-container',
  dom: {
    createContainer: true
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 100 },
      enableSleep: false,
      debug: true
    }
  }
};
