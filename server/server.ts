import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const server = createServer();
const io = new Server(server, {});

import './register';

import config from './config';
import Core from '@/scenes/Core';
import Phaser from 'phaser';
import Global from '@/global';
import { deserializeRawTankData } from '@/types/RawData';
Global.disable_graphics = true;

const game = new Phaser.Game(config);
game.scene.add('Artilio-server', new Core());
game.scene.start('Artilio-server');

io.on('connection', (socket: Socket) => {
  if (Core.scene.initiated == false) {
    console.log('Game not initiated');
    socket.emit('server_error');
    return;
  }

  socket.on('disconnect', (msg) => {
    console.log('Player left: ' + msg);
    Core.scene.onPlayerLeave(socket);
  });

  socket.on('login', (msg) => {
    console.log('New user: ' + msg);
    const player = Core.scene.onPlayerJoin(msg, socket);
    socket.emit('session_established', player.ID + player.secret);
    socket.emit('login_success', Core.scene.getRawData(player));
  });

  // Handle general updates like moving
  // @param msg [ID.concat(secret), action_name, data]
  socket.on('a', (msg) => {
    if (msg.length != 3) return;
    if (msg[0].length != 20) return;
    const player = Core.scene.getPlayer(
      msg[0].slice(0, 8),
      msg[0].slice(8, 20)
    );
    if (player === false) return;
    if (msg[1] == 'sync') {
      const data = deserializeRawTankData(msg[2]);
      player.tank.setThrustSpeed(data.thrust);
      player.tank.setCannonAngle(data.c_ang);
    } else if (msg[1] == 'fire') {
      if (msg[2]?.length != 2) return;
      const weapon = msg[2][0];
      // Check weapon availability
      const data = deserializeRawTankData(msg[2][1]);
      player.tank.set('weapon', weapon);
      player.tank.setThrustSpeed(data.thrust);
      player.tank.setCannonAngle(data.c_ang);
      player.tank.setFireStatus(true);
    } else if (msg[1] == 'stopfire') {
      player.tank.setFireStatus(false);
    }
  });

  console.log('A user connected');
});

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
