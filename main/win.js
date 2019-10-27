'use strict';

let mainWindow;

module.exports = {
  setWindow(win) {
    mainWindow = win;
  },

  getWindow() {
    return mainWindow;
  },

  send(...args) {
    mainWindow.webContents.send(...args);
  }
}
