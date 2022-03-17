import path from 'path';
import fs from 'fs';
import electron from 'electron';

// Здесь нельзя импортировать currentWindow из js/utils, потому что
// в том файле импортируется этот файл
const currentWindow = electron.remote.getCurrentWindow();

class RendererStorage {
  constructor({ name, defaults, init }) {
    const storageData = JSON.parse(localStorage.getItem(name) || '{}');

    this.name = name;
    this.data = {
      ...defaults,
      ...storageData
    };

    init && init(this.data);
    this.save();
  }

  update(data) {
    this.data = data;
    this.save();
  }

  save() {
    localStorage.setItem(this.name, JSON.stringify(this.data));
  }
}

class MainStorage {
  constructor(defaults) {
    this.path = path.join(electron.remote.app.getPath('appData'), 'vk-desktop', 'store.json');

    let storageData = {};
    try {
      storageData = JSON.parse(fs.readFileSync(this.path));
    } catch {
      // Файлик криво записался и перезапишется при следующем сохранении
      // или при запуске приложения в main процессе
    }

    this.data = {
      ...defaults,
      ...storageData
    };
  }

  update(data) {
    this.data = data;
    this.save();
  }

  save() {
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

export const defaultUserSettings = {
  hiddenPinnedMessages: {},
  typing: true,
  notRead: false,
  deleteForAll: false
};

export const usersStorage = new RendererStorage({
  name: 'users',

  defaults: {
    activeUserID: null,
    trustedHashes: {},
    users: {}
  }
});

export const settingsStorage = new RendererStorage({
  name: 'settings',

  defaults: {
    window: currentWindow.getBounds(),
    langName: 'ru',

    userSettings: {},
    commonSettings: {
      showAvatarsAtBottom: false,
      animateStickersOnFirstAppear: true,
      useMoreSaturatedColors: process.platform === 'darwin',
      useNativeEmoji: false,
      useDarkTheme: false,

      showObjectIds: false
    }
  },

  init({ userSettings }) {
    for (const id in usersStorage.data.users) {
      userSettings[id] = {
        ...defaultUserSettings,
        ...userSettings[id]
      };
    }
  }
});

export const mainSettingsStorage = new MainStorage({
  useNativeTitlebar: false
});
