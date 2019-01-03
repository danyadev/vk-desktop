'use strict';

Vue.use(Vuex);

module.exports = new Vuex.Store({
  state: require('./state')(),
  mutations: require('./mutations'),
  getters: require('./getters')
});
