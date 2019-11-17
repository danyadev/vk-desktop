import electron from 'electron';
import { deepAssign } from 'js/utils';

const win = electron.remote.getCurrentWindow();

class Storage {
  constructor(name, defaults) {
    const storageData = JSON.parse(localStorage.getItem(name) || '{}');

    this.data = deepAssign(defaults, storageData);
    this.name = name;
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

export const users = new Storage('users', {
  activeUser: null,
  trustedHashes: {},
  users: {}
});

export const settings = new Storage('settings', {
  window: win.getBounds(),
  langName: 'ru',
  messagesSettings: {
    typing: true,
    notRead: true,
    hiddenPinnedMessages: {}
  }
});
