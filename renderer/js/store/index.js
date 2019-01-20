'use strict';

const fs = require('fs');

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

module.exports = new Vuex.Store({ ...rootModule, modules });
