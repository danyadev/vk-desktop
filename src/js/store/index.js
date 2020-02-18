import Vue from 'vue';
import Vuex from 'vuex';
import { settingsStorage, usersStorage } from './Storage';
import rootModule from './modules/index';

Vue.use(Vuex);

const modules = {};
const moduleNames = [
  'messages',
  'settings',
  'users'
];

for(const name of moduleNames) {
  modules[name] = Object.assign(require(`./modules/${name}`).default, {
    namespaced: true
  });
}

const store = new Vuex.Store({ ...rootModule, modules });

store.subscribe(({ type }, store) => {
  if(/^settings\//.test(type)) settingsStorage.update(store.settings);
  if(/^users\//.test(type)) usersStorage.update(store.users);
});

export default store;
