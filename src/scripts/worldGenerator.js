function generateWorldBoundaries(t) {
}

function generateTerrain(t) {
    for (let i = 0; i < 30; i++) {
      let rect = t.add.rectangle(Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(150, 750), 20, 0xffffff);
      rect.setInteractive();
      t.input.setDraggable(rect);
      t.matter.add.gameObject(rect).setStatic(true).setFriction(0, 0, 0);
    }
  };

function generateWorld(t) {
  generateWorldBoundaries(t);
  generateTerrain(t);
}


export default generateWorld;