var config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 720,
    backgroundColor: '#2d2d2d',
    parent: 'phaser-example',
    scene: {
        create: create
    }
};

var game = new Phaser.Game(config);

function generator(last = 0) {
  if (Math.random() < 0.5) return last;
  if (Math.random() < 0.7) return Math.max(0, last + Math.floor(Math.random() * 3) - 1);
  return Math.max(0, last + Math.floor(Math.random() * 7) - 3);
}

function create ()
{
  var graphics = this.add.graphics();

  let arr = [];
  last = 0;

  
  for (let i = 0; i <= 30; i++) {
    arr.push(new Phaser.Math.Vector2(50 + i * 30, 600 - (last = generator(last)) * 30));
    // new Phaser.GameObjects.Ellipse(arr[arr.length])
  }

  graphics.lineStyle(1, 0xff0000, 1);
  let spline = new Phaser.Curves.Spline(arr);
  spline.draw(graphics, 8192);

  graphics.lineStyle(1, 0x00ff00, 1);
  for (let i = 1; i < 29; i++) {
    let delta1 = new Phaser.Math.Vector2(arr[i+1].x - arr[i-1].x, arr[i+1].y - arr[i-1].y);
    let delta2 = new Phaser.Math.Vector2(arr[i+2].x - arr[i].x, arr[i+2].y - arr[i].y);
    delta1.normalize(); delta2.normalize(); 
    let curve = new Phaser.Curves.CubicBezier(
      arr[i], 
      delta1.multiply(new Phaser.Math.Vector2(14, 14)).add(arr[i]), 
      delta2.multiply(new Phaser.Math.Vector2(-14, -14)).add(arr[i+1]),
      arr[i+1]
    );
    curve.draw(graphics, 256);
  }
}