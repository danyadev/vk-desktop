'use strict';

const { BrowserWindow } = require('electron');
const fs = require('fs');

let lastChangeTime;

fs.watch('.', { recursive: true }, (event, filename) => {
  let prevChangeTime = lastChangeTime;
  lastChangeTime = new Date().getTime();
  if(prevChangeTime < lastChangeTime - 250 || !filename) return;

  let ignoredFiles = [
    '.git', 'core', 'vue-devtools', '.gitignore',
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
});
