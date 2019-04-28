'use strict';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs');

app.on('ready', () => {
  const { screen } = require('electron');

  try {
    BrowserWindow.addDevToolsExtension(require('vue-devtools'));
  } catch(e) {}

  const win = new BrowserWindow({
    minWidth: 360,
    minHeight: 480,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
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

    // Для того, чтобы не видеть скачков окна при открытии приложения,
    // я открываю его после события dom-ready и executeJavaScript, что дает
    // гарантию того, что приложение уже установлено на нужное положение.
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
