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

  get(id) {
    if(id) return this.data[id];
    else {
      let uid = Object.keys(this.data).find((id) => id == settings.get('activeUser'));
      return this.data[uid];
    }
  }

  getAll() {
    return this.data;
  }

  add(user) {
    this.data[user.id] = user;
    this.save();
  }

  remove(id) {
    this.data[id] = undefined;
    this.save();
  }

  update(id, key, value) {
    let user = this.data[id];

    if(user) {
      this.data[id][key] = value;
      this.save();
    }
  }
}

class Settings extends Storage {
  constructor() {
    super('settings');
  }

  // TODO: defaults
}

module.exports = {
  Storage,
  users: new Users(),
  settings: new Settings()
}
