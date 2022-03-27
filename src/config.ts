import Phaser from 'phaser';

var _w = window.innerWidth, _h = window.innerHeight;

export default {
  type: Phaser.AUTO,
  width: _w,
  height: _h,
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 100 },
      enableSleep: false,
      debug: true
    }
  },
};
