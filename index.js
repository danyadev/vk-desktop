'use strict';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const { app, BrowserWindow, ipcMain, globalShortcut, shell } = require('electron');
const fs = require('fs');

app.once('ready', () => {
  const { screen } = require('electron');

  const win = new BrowserWindow({
    minWidth: 400,
    minHeight: 480,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      webgl: false
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

  // Автообновление на macOS трубует подпись у приложения
  if(process.platform != 'darwin') {
    require('./main/updater').init();
  }

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

  win.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  if(process.platform == 'darwin') require('./main/menu')(win);
  else win.removeMenu();

  win.loadURL(
    process.argv.includes('dev-mode')
      ? 'http://localhost:8080/dist/index-dev.html'
      : `file://${__dirname}/dist/index.html`
  );
});

app.on('window-all-closed', app.exit);
