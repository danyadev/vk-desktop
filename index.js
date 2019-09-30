'use strict';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const fs = require('fs');

require('update-electron-app')({
  repo: 'danyadev/vk-desktop'
});

app.once('ready', () => {
  const { screen } = require('electron');

  try {
    BrowserWindow.addDevToolsExtension(require('@danyadev/vue-devtools'));
  } catch(e) {}

  const win = new BrowserWindow({
    minWidth: 400,
    minHeight: 480,
    show: false,
    frame: false,
    titleBarStyle: 'hidden'
  });

  ipcMain.on('addShortcut', (event, data) => {
    globalShortcut.register(data.accelerator, () => {
      if(win.isFocused()) {
        event.sender.send('emitShortcut', data.id);
      }
    });
  });

  ipcMain.on('removeAllShortcuts', () => {
    globalShortcut.unregisterAll();
  });

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

  if(process.platform == 'darwin') require('./menu')(win);
  else win.setMenu(null);

  win.loadURL(
    process.argv.includes('dev-mode')
      ? 'http://localhost:8080/dist/'
      : `file://${__dirname}/dist/index.html`
  );
});

app.on('window-all-closed', app.exit);
