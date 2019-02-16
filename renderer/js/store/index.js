'use strict';

const fs = require('fs');
const settings = require('./Storage');

Vue.use(Vuex);

let rootModule = require('./modules/index'),
    modules = {};

fs.readdirSync(__dirname + '/modules').forEach((file) => {
  let name = file.slice(0, -3);

  if(name != 'index') {
    modules[name] = Object.assign(require(`./modules/${name}`), {
      namespaced: true
    });
  }
});

let store = new Vuex.Store({ ...rootModule, modules });

store.subscribe(({ type }, store) => {
  if(/^settings\//.test(type)) settings.update(store.settings);
});

module.exports = store;
