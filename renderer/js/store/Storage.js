'use strict';

class Settings {
  constructor() {
    let storageData = JSON.parse(localStorage.getItem('settings') || '{}');
    this.data = Object.assign({}, this.defaults, storageData);
    this.save();
  }

  save() {
    localStorage.setItem('settings', JSON.stringify(this.data));
  }

  get defaults() {
    return {
      window: getCurrentWindow().getBounds(),
      users: {},
      section: 'messages',
      langName: 'ru',
      counters: {},
      recentEmojies: {},
      hiddenDialogs: false,
      stickers: []
    }
  }

  update(data) {
    this.data = data;
    this.save();
  }
}

module.exports = new Settings();
