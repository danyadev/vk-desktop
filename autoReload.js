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
  let ignoredFiles = [
    '.git', 'core', 'vue-devtools', '.gitignore', 'autoReload.js',
    'index.js', 'LICENSE', 'package.json', 'README.md'
  ];

  let isIgnored = ignoredFiles.find((ignoredPath) => {
    let regexp = new RegExp(`${ignoredPath}/`),
        path = filename.replace(/\\/g, '/');

    return ignoredPath == path || path.match(regexp);
  });

  if(isIgnored) return;

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.reloadIgnoringCache();
  });
}

fs.watch('.', { recursive: true }, (event, filename) => {
  if(!filename) return;

  if(process.platform == 'darwin') reloadApp(filename);
  else onChange(filename);
});
