import Vue from 'vue';
import router from './router';
import store from './store/';

import App from './../components/App.vue';

Vue.config.productionTip = false;

Vue.prototype.l = function(name, key, replaces, number) {
  if(Array.isArray(key)) {
    number = replaces;
    replaces = key;
    key = null;
  }

  if(typeof key == 'boolean') key = key ? 1 : 0;
  if(number != undefined) key = getWordEnding(number);

  let data = this.$store.getters['settings/lang'][name];
  if(![null, undefined].includes(key)) data = data[key];

  if(Array.isArray(replaces)) {
    for(let i in replaces) {
      let regexp = new RegExp(`\\{${i}\\}`, 'g');

      data = String(data).replace(regexp, replaces[i]);
    }
  }

  return data;
}

export default new Vue({
  el: '#app',
  store,
  router,
  render: (h) => h(App)
});
