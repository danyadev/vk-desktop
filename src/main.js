import { remote as electron } from 'electron';
import { debounce } from 'js/utils';
import app from 'js/app';

const win = electron.getCurrentWindow();
const { Menu } = electron;

document.addEventListener('contextmenu', (event) => {
  Menu.buildFromTemplate([
    {
      label: app.l('open_console'),
      click: win.openDevTools
    },
    {
      label: app.l('open_in_devtools'),
      click(temp, win) {
        win.inspectElement(event.x, event.y);
      }
    }
  ]).popup();
});

window.addEventListener('resize', debounce(() => {
  app.$store.commit('settings/setWindowBounds', win.getBounds());
}, 2000));
