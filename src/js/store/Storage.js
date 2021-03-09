import electron from 'electron';

// Здесь нельзя импортировать currentWindow из js/utils, потому что
// в том файле импортируется этот файл
const currentWindow = electron.remote.getCurrentWindow();

class Storage {
  constructor({ name, defaults, beforeSave }) {
    const storageData = JSON.parse(localStorage.getItem(name) || '{}');

    this.name = name;
    this.data = {
      ...defaults,
      ...storageData
    };

    beforeSave && beforeSave(this.data);
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

export const defaultUserSettings = {
  hiddenPinnedMessages: {},
  typing: true,
  notRead: true,
  deleteForAll: false,

  showAvatarAtBottom: false,
  useLightMessageColors: false,
  animateStickersOnFirstAppear: true,
  useNativeEmoji: false,

  showObjectIds: false
};

export const usersStorage = new Storage({
  name: 'users',

  defaults: {
    activeUserID: null,
    trustedHashes: {},
    users: {}
  }
});

export const settingsStorage = new Storage({
  name: 'settings',

  defaults: {
    window: currentWindow.getBounds(),
    langName: 'ru',
    userSettings: {}
  },

  beforeSave({ userSettings }) {
    for (const id in usersStorage.data.users) {
      userSettings[id] = {
        ...defaultUserSettings,
        ...userSettings[id]
      };
    }
  }
});
