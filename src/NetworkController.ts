import { io, Socket } from 'socket.io-client';
import { serializeRawTankData } from '@/types/RawData';
import Global from './global';
import Game from './scenes/Game';
import { createNewGame } from '.';
const client_report_rate = 50; // ms

export default class NetworkController {
  socket: Socket;
  session_secret?: string;
  constructor() {
    this.socket = io();
  }

  // Send tank action
  send(action: string, data?: any) {
    if (!this.session_secret) return;
    this.socket.emit('a', [this.session_secret, action, data]);
  }

  login(name: string) {
    this.socket.connect();
    this.socket.emit('login', name);
    this.socket.once('session_established', (ID) => {
      this.session_secret = ID;
      this.socket.on('sync', (m) => {
        this.serverSync(m);
      });
      this.socket.once('death', (killer) => {
        Global.console.recycling(
          `Congratulations! You've been killed by ${killer}!`
        );
        this.socket.removeListener('disconnect');
        Global.event_bus.removeAllListeners();
        Game.scene.sys.game.destroy(true);
        (Game.scene as any) = undefined;
        (Game.player as any) = undefined;
        createNewGame();
      });
      this.socket.once('disconnect', (m) => {
        Global.console.error('Disconnected');
      });
    });
    return new Promise((resolve, reject) => {
      this.socket.on('login_success', resolve);
      this.socket.on('login_failed', reject);
    });
  }

  init() {
    this.send('init');
  }

  sync_callback?: any;
  serverSync(msg: any) {
    if (this.sync_callback) {
      this.sync_callback(msg);
    }
  }

  onSync(sync_callback: any) {
    this.sync_callback = sync_callback;
  }

  last_sync = 0;
  pending_sync = false;
  // Sync local tank data to server
  sync(data: any, queued = false) {
    data = serializeRawTankData(data);
    const now = Date.now();
    if (this.last_sync == 0) this.last_sync = now;
    if (queued == true && now - this.last_sync < client_report_rate) {
      if (this.pending_sync) return;
      this.pending_sync = true;
      window.setTimeout(() => {
        this.send('sync', data);
        this.pending_sync = false;
      }, this.last_sync + client_report_rate);
    } else {
      this.last_sync = now;
      this.send('sync', data);
    }
  }

  fire(data: any[]) {
    data[1] = serializeRawTankData(data[1]);
    this.send('fire', data);
  }

  stopFire() {
    this.send('stopfire');
  }
}
