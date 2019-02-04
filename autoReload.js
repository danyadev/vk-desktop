'use strict';

const { BrowserWindow } = require('electron');
const fs = require('fs');

function throttle(fn, delay) {
  let lastCall = 0;

  return (...args) => {
    let now = new Date().getTime();
    if(now - lastCall < delay) return;
    lastCall = now;
    return fn(...args);
  }
}

let onChange = throttle(reloadApp, 200);

function reloadApp(filename) {
  if(!/^renderer/.test(filename)) return;

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.reloadIgnoringCache();
  });
}

fs.watch('.', { recursive: true }, (event, filename) => {
  if(!filename) return;

  if(process.platform == 'darwin') reloadApp(filename);
  else onChange(filename);
});
