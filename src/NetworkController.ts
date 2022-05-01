import { io, Socket } from 'socket.io-client';

export default class NetworkController {
  socket: Socket;
  session_secret?: string;
  constructor() {
    this.socket = io();
  }

  send(action: string, data: any) {
    if (!this.session_secret) return;
    this.socket.emit('act', [this.session_secret, action, data]);
  }

  login(name: string) {
    this.socket.emit('login', name);
    this.socket.once('session_established', (ID) => {
      console.log(ID);
      this.session_secret = ID;
      this.socket.on('sync', (m) => {
        this.sync(m);
      });
    });
    return new Promise((resolve, reject) => {
      this.socket.on('login_success', resolve);
      this.socket.on('login_failed', reject);
    });
  }

  sync_callback?: any;
  sync(msg: any) {
    if (this.sync_callback) {
      this.sync_callback(msg);
    }
  }

  onSync(sync_callback: any) {
    this.sync_callback = sync_callback;
  }

  move(speed: number) {
    // console.log('Local: ' + [x, y, vx, vy, vang]);
    this.send('move', speed);
  }
}
