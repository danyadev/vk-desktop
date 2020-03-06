'use strict';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const { app, BrowserWindow, shell } = require('electron');
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

  if(process.platform == 'darwin') require('./menu')(win);
  else win.removeMenu();

  win.loadURL(
    process.argv.includes('dev-mode')
      ? 'http://localhost:8080/dist/index.html'
      : `file://${__dirname}/dist/index.html`
  );
});

app.on('window-all-closed', app.exit);
