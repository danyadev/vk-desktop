import { ipcRenderer } from 'electron';

const callbacks = [];

ipcRenderer.on('emitShortcut', (e, id) => callbacks[id]());

// При перезагрузке страницы или выходе из приложения
window.addEventListener('beforeunload', () => {
  ipcRenderer.send('removeAllShortcuts');
});

export default function(accelerator, callback) {
  callbacks.push(callback);

  ipcRenderer.send('addShortcut', { accelerator, id: callbacks.length-1 });
}
