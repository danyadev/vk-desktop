import Vue from 'vue';
import Vuex from 'vuex';
import path from 'path';
import { settings, users } from './Storage';
import rootModule from './modules/index';

Vue.use(Vuex);

const modules = {};
const moduleNames = [
  'messages',
  'settings',
  'users'
];

moduleNames.forEach((name) => {
  modules[name] = Object.assign(require(`./modules/${name}`).default, {
    namespaced: true
  });
});

const store = new Vuex.Store({ ...rootModule, modules });

store.subscribe(({ type }, store) => {
  if(/^settings\//.test(type)) settings.update(store.settings);
  if(/^users\//.test(type)) users.update(store.users);
});

export function resetAppState() {
  store.commit('resetState');
  
  for(let name of moduleNames) {
    const mod = modules[name];

    if(mod.mutations && mod.mutations.resetState) {
      store.commit(`${name}/resetState`);
    }
  }
}

export default store;
