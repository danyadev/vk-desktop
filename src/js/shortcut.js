import { ipcRenderer } from 'electron';

const callbacks = [];
const buttons = [];

ipcRenderer.on('emitShortcut', (e, id) => callbacks[id]());

// При перезагрузке страницы или выходе из приложения
window.addEventListener('beforeunload', () => {
  ipcRenderer.send('removeAllShortcuts');
});

window.addEventListener('keydown', (e) => {
  for(const button of buttons) {
    if(button.key == e.key) callbacks[button.id]();
  }
});

export default function(accelerators, callback) {
  callbacks.push(callback);

  if(!Array.isArray(accelerators)) accelerators = [accelerators];

  for(const accelerator of accelerators) {
    const id = callbacks.length-1;

    if(/\+/.test(accelerator)) {
      ipcRenderer.send('addShortcut', { accelerator, id });
    } else {
      buttons.push({ key: accelerator, id });
    }
  }
}
