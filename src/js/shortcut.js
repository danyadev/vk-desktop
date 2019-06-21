import { remote as electron } from 'electron';

const { globalShortcut } = electron;
const win = electron.getCurrentWindow();

export default function(accelerator, callback) {
  if(typeof callback != 'function') return;

  globalShortcut.register(accelerator, () => {
    if(win.isFocused()) callback();
  });
}
