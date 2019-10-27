'use strict';

// За основу был взят модуль
// https://github.com/gch1p/electron-windows-updater

const { app } = require('electron');
const temp = require('temp');
const fs = require('fs-extra');
const path = require('path');
const { EventEmitter } = require('events');
const child_process = require('child_process');
const extractZip = require('extract-zip');
const win = require('./win');
const winutils = require('winutils');

let noAsarValue = false;

function asarOff() {
  noAsarValue = process.noAsar;
  process.noAsar = true;
}

function asarBack() {
  process.noAsar = noAsarValue;
}

class Updater extends EventEmitter {
  constructor() {
    super();

    this.feedURL = null;
    this.bridge = null;
    this.downloadPath = null;
    this.updateUrl = null;
    this.unpackDir = null;
  }

  setFeedURL(url) {
    this.feedURL = url;
  }

  setBridge(bridge) {
    this.bridge = bridge;
  }

  async checkForUpdates() {
    win.send('update', { status: 'checking' });

    const update = await this.bridge.call({
      name: 'check',
      url: this.feedURL
    });

    if(!update) {
      return win.send('update', { status: 'not-available' });
    }

    win.send('update', { status: 'available' });

    this.updateUrl = update.url;
    this.downloadPath = temp.path({ suffix: '.zip' });

    this.bridge.call({
      name: 'download',
      src: this.updateUrl,
      dst: this.downloadPath
    }).then(() => {
      return mkTempDir().then((dir) => {
        this.unpackDir = dir;

        return pExtractZip(this.downloadPath, dir);
      });
    }).then(() => punlink(this.downloadPath)).then(() => {
      win.send('update', { status: 'downloaded', update });
    }).catch((err) => {
      this.downloadPath = null;
      this.updateUrl = null;
      this.unpackDir = null;

      win.send('update', { status: 'not-available' });
    });
  }
}

class WindowsUpdater extends Updater {
  async quitAndInstall() {
    const exeName = 'VK Desktop.exe';
    const installDstDir = path.dirname(process.execPath);
    const writable = await isWritable(path.join(path.dirname(installDstDir), randstr()));
    const cmd = path.join(this.unpackDir, exeName);
    const args = [
      '--disable-gpu',
      '--ewu-install',
      installDstDir,
      exeName,
      winutils.isUserAdmin() ? 1 : 0,
      process.argv.includes('--disable-gpu') ? 1 : 0,
      writable ? 0 : 1
    ];

    if(writable) run(cmd, args);
    else runElevated(cmd, args);

    app.exit();
  }
}

class LinuxUpdater extends Updater {
  quitAndInstall() {
    const args = [
      '--ewu-install',
      this.unpackDir,
      process.argv.includes('--disable-gpu') ? 1 : 0
    ];

    child_process.spawn(process.execPath, args, {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    }).unref();

    app.exit();
  }
}

function pExtractZip(src, dst) {
  return new Promise((resolve, reject) => {
    asarOff();

    extractZip(src, { dir: dst }, (err) => {
      asarBack();

      if(err) reject(err);
      else resolve();
    });
  });
}

function mkTempDir() {
  return new Promise((resolve, reject) => {
    temp.mkdir(null, (err, path) => {
      if(err) reject(err);
      else resolve(path);
    });
  });
}

function punlink(path) {
  return new Promise((resolve) => {
    asarOff();

    fs.unlink(path, () => {
      asarBack();
      resolve();
    });
  });
}

function isWritable(path) {
  return new Promise((resolve, reject) => {
    asarOff();

    fs.access(path, fs.W_OK, (err) => {
      asarBack();
      resolve(!!err);
    });
  });
}

function run(path, args) {
  child_process.spawn(path, args, {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore']
  }).unref();
}

function runElevated(path, args) {
  const cmdLine = args.map((arg) => winutils.escapeShellArg(String(arg))).join(' ');

  if(!winutils.elevate(path, cmdLine)) {
    run(path, args);
  }
}

function randstr() {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for(let i = 0; i < 10; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

module.exports = process.platform == 'win32'
  ? new WindowsUpdater()
  : new LinuxUpdater();
