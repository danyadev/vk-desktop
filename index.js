'use strict';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const fs = require('fs');
const isDev = process.argv.includes('dev-mode');

app.once('ready', () => {
  const { screen } = require('electron');

  if(isDev) {
    BrowserWindow.addDevToolsExtension(require('vue-devtools'));
  }

  const win = new BrowserWindow({
    minWidth: 400,
    minHeight: 480,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true
    }
  });

  require('./main/win').setWindow(win);

  ipcMain.on('addShortcut', (event, data) => {
    globalShortcut.registerAll(data.accelerators, () => {
      if(win.isFocused()) {
        event.sender.send('emitShortcut', data.id);
      }
    });
  });

  ipcMain.on('removeAllShortcuts', () => {
    globalShortcut.unregisterAll();
  });

  require('./main/updater').init();

  win.webContents.once('dom-ready', async () => {
    const data = await win.webContents.executeJavaScript('localStorage.getItem("settings")');
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    if(data) {
      const { window } = JSON.parse(data);
      const maximized = window.width >= width && window.height >= height;

      win.setBounds({
        x: window.x,
        y: window.y,
        width: maximized ? width : window.width,
        height: maximized ? height : window.height
      });

      if(maximized) win.maximize();
    }

    win.show();
  });

  if(process.platform == 'darwin') require('./main/menu')(win);
  else win.removeMenu();

  win.loadURL(
    isDev
      ? 'http://localhost:8080/dist/'
      : `file://${__dirname}/dist/index.html`
  );
});

app.on('window-all-closed', app.exit);
