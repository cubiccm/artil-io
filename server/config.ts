import 'phaser';

export default {
  type: Phaser.HEADLESS,
  parent: 'phaser-container',
  width: 800,
  height: 600,
  audio: {
    noAudio: true
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 100 },
      enableSleep: false
    }
  },
  autoFocus: false
};
