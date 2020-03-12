import electron from 'electron';

const win = electron.remote.getCurrentWindow();

class Storage {
  constructor(name, defaults, beforeSave) {
    const storageData = JSON.parse(localStorage.getItem(name) || '{}');

    this.data = Object.assign(defaults, storageData);
    this.name = name;

    if(beforeSave) beforeSave(this.data);

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
  pinnedPeers: [],
  typing: true,
  notRead: true,
  devShowPeerId: false
};

export const usersStorage = new Storage('users', {
  activeUser: null,
  trustedHashes: {},
  users: {}
});

export const settingsStorage = new Storage('settings', {
  window: win.getBounds(),
  langName: 'ru',
  userSettings: {}
}, ({ userSettings }) => {
  for(const id in userSettings) {
    userSettings[id] = Object.assign({}, defaultUserSettings, userSettings[id]);
  }
});
