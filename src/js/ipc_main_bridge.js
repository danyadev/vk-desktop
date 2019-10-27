const ipc = require('electron').ipcRenderer;

const CALL = 0;
const REPLY = 1;

class IPCMainBridge {
  constructor() {
    this.userListener = null;
    this.counter = 0;
    this.promises = {};
    this.key = 'updater_worker';

    ipc.on(this.key, this.listener.bind(this));
  }

  listen(listener) {
    this.userListener = listener;
  }

  listener(event, message) {
    if(message[0] == CALL) {
      if(this.userListener) {
        this.userListener(message[2], (payload) => {
          event.sender.send(this.key, [REPLY, message[1], payload]);
        });
      }
    }
  }
}

export default IPCMainBridge;
