'use strict';

class Storage {
  constructor(name, data, force) {
    this.data = JSON.parse(localStorage.getItem(name) || '{}');
    this.name = name;

    if(data) {
      if(force) this.data = Object.assign({}, data);
      else this.data = Object.assign(Object.assign({}, data), this.data);
    }

    this.save();
  }

  setData(data) {
    this.data = data;
    this.save();
  }

  set(key, value) {
    this.data[key] = value;
    this.save();

    return this.data;
  }

  get(key) {
    return key ? this.data[key] : this.data;
  }

  save() {
    localStorage.setItem(this.name, JSON.stringify(this.data));
  }

  clear() {
    this.data = {};
    this.save();
  }
}

class Users extends Storage {
  constructor() {
    super('users');
  }

  add(user) {
    this.data[user.id] = user;
    this.save();
  }

  remove(id) {
    delete this.data[id];
    this.save();
  }

  update(id, data) {
    if(!this.data[id]) return;
    this.data[id] = Object.assign({}, this.data[id], data);
    this.save();
  }
}

class Settings extends Storage {
  constructor() {
    super('settings');

    this.setData(Object.assign({}, this.defaults, this.data));
  }

  get defaults() {
    return {
      section: 'messages',
      lang: 'ru'
    }
  }
}

module.exports = {
  users: new Users(),
  settings: new Settings()
}
