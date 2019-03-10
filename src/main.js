window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

import Vue from 'vue';
import App from './components/App.vue';

new Vue({
  el: '#app',
  render: (h) => h(App)
});
