import electron, { ipcRenderer } from 'electron';
import IPCMainBridge from './ipc_main_bridge';
import { eventBus } from './utils';
import request from './request';
import fs from 'fs';

const bridge = new IPCMainBridge();
const updater = electron.remote.require('./main/updater');
let isUpdateAvailable = false;

ipcRenderer.on('update', (event, data) => {
  switch(data.status) {
    case 'checking':
      // Проверка обновлений
      break;

    case 'not-available':
      isUpdateAvailable = false;
      break;

    case 'available':
      isUpdateAvailable = true;
      break;

    case 'downloaded':
      eventBus.emit('modal:open', 'update-available', {
        quitAndInstall: updater.quitAndInstall,
        name: data.update.name,
        notes: data.update.notes
      });

      break;
  }
});

bridge.listen(async (data, resolve) => {
  if(data.name == 'check') {
    const res = await request(data.url);

    if(res.data) {
      const platform = updater.getPlatform();
      const [, version, filename] = res.data.url.match(/.+\/(.+)\/(.+)/);

      res.data.url = res.data.url.replace(filename, `VK-Desktop-${platform}.zip`);
    }

    resolve(res.data);
  }

  if(data.name == 'download') {
    const { headers } = await request(data.src);
    const stream = fs.createWriteStream(data.dst);

    await request({
      url: headers.location,
      pipe: stream,
      progress({ progress }) {
        // Что-то делать с прогрессом
      }
    });

    resolve();
  }
});

if(1||electron.remote.app.isPackaged) {
  updater.check();

  setInterval(() => {
    if(!isUpdateAvailable) updater.check();
  }, 5 * 60 * 1000);
}
