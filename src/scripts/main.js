// var config = {
//     type: Phaser.AUTO,
//     width: 1024,
//     height: 720,
//     backgroundColor: '#2d2d2d',
//     parent: 'phaser-example',
//     scene: {
//         create: create
//     }
// };

// var game = new Phaser.Game(config);

// function generator(last = 0) {
//   if (Math.random() < 0.5) return last;
//   if (Math.random() < 0.7) return Math.max(0, last + Math.floor(Math.random() * 3) - 1);
//   return Math.max(0, last + Math.floor(Math.random() * 7) - 3);
// }

// function create ()
// {
//     var graphics = this.add.graphics();

//     let arr = [];
//     last = 0;

    
//     for (let i = 0; i <= 30; i++) {
//       arr.push(new Phaser.Math.Vector2(50 + i * 30, 600 - (last = generator(last)) * 30));
//       // new Phaser.GameObjects.Ellipse(arr[arr.length])
//     }

//     graphics.lineStyle(1, 0xff0000, 1);
//     let spline = new Phaser.Curves.Spline(arr);
//     spline.draw(graphics, 8192);

//     graphics.lineStyle(1, 0x00ff00, 1);
//     for (let i = 1; i < 29; i++) {
//       let delta1 = new Phaser.Math.Vector2(arr[i+1].x - arr[i-1].x, arr[i+1].y - arr[i-1].y);
//       let delta2 = new Phaser.Math.Vector2(arr[i+2].x - arr[i].x, arr[i+2].y - arr[i].y);
//       delta1.normalize(); delta2.normalize(); 
//       let curve = new Phaser.Curves.CubicBezier(
//         arr[i], 
//         delta1.multiply(new Phaser.Math.Vector2(14, 14)).add(arr[i]), 
//         delta2.multiply(new Phaser.Math.Vector2(-14, -14)).add(arr[i+1]),
//         arr[i+1]
//       );
//       curve.draw(graphics, 256);
//     }
// }

var _w = window.innerWidth, _h = window.innerHeight;

var config = {
  type: Phaser.AUTO,
  width: _w,
  height: _h,
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

function preload() {
  this.load.svg("body", "assets/pacman.svg", {scale: 0.3});
}

function create() {
  this.cameras.main.scrollX = -_w / 2;
  this.cameras.main.scrollY = -_h / 2;
  this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;
  });
  generateTerrain(this);
  generateBody(this);
}

function update() {

} 

var generateTerrain = (t) => {
  for (let i = 0; i < 30; i++) {
    let rect = t.add.rectangle(Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(-1000, 1000), Phaser.Math.Between(150, 750), 20, 0xffffff);
    rect.setInteractive();
    t.input.setDraggable(rect);
    t.matter.add.gameObject(rect).setStatic(true);
  }
};

var body;
var generateBody = (t) => {
  body = t.matter.add.image(0, 0, "body", Phaser.Math.Between(0, 5));
  body.setCircle();
  body.setBounce(0.15);
  t.matter.world.setGravity();
  t.input.keyboard.on("keydown", (event) => {
    if (event.key == "A" || event.key == "a") {
      body.applyForce(new Phaser.Math.Vector2(-0.01, 0));
    } else if (event.key == "D" || event.key == "d") {
      body.applyForce(new Phaser.Math.Vector2(0.01, 0));
    }
  });
  t.cameras.main.startFollow(body);
};