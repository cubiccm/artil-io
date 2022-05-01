import { createServer } from 'http';
const server = createServer();
import { Server, Socket } from 'socket.io';
const io = new Server(server, {});

// import './register';
import 'global-jsdom/register';

import config from './config';
import Core from '../src/scenes/Core';
import 'phaser';
import Global from '../src/global';
Global.disable_graphics = true;

const game = new Phaser.Game(config);
game.scene.add('Artilio-server', new Core());
game.scene.start('Artilio-server');

io.on('connection', (socket: Socket) => {
  if (Core.scene.initiated == false) {
    socket.emit('server_error');
    return;
  }

  socket.on('login', (msg) => {
    console.log('New user: ' + msg);
    const player = Core.scene.addPlayer(msg, socket);
    socket.emit('session_established', player.ID + player.secret);
    socket.emit('login_success', Core.scene.getRawData(player));
  });

  // Handle general updates like moving
  // @param msg [ID.concat(secret), action_name, data]
  socket.on('act', (msg) => {
    if (msg.length != 3) return;
    if (msg[0].length != 20) return;
    const player = Core.scene.getPlayer(
      msg[0].slice(0, 8),
      msg[0].slice(8, 20)
    );
    if (player === false) return;
    const data = msg[2] as any;
    switch (msg[1]) {
      case 'move':
        // player.tank.setMovingSpeed(data);
        // console.log(`Tank position: ${player.raw.x}, ${player.raw.y}`);
        player.tank.setPosition(data[0], data[1]);
        player.tank.setVelocity(data[2], data[3]);
        player.tank.setAngularVelocity(data[4]);
        break;
    }
  });

  console.log('A user connected');
});

server.listen(8964, () => {
  console.log('Listening on *:8964');
});
