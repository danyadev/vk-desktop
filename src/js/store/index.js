import Vue from 'vue';
import Vuex from 'vuex';
import path from 'path';
import fs from 'fs';
import { settings, users } from './Storage';
import rootModule from './modules/index';

Vue.use(Vuex);

const modules = {};

fs.readdirSync(path.resolve(__dirname, './modules')).forEach((filename) => {
  const name = filename.slice(0, -3);

  if(name != 'index') {
    modules[name] = Object.assign(require(`./modules/${name}`).default, {
      namespaced: true
    });
  }
});

const store = new Vuex.Store({ ...rootModule, modules });

store.subscribe(({ type }, store) => {
  if(/^settings\//.test(type)) settings.update(store.settings);
  if(/^users\//.test(type)) users.update(store.users);
});

export default store;
