import Vue from 'vue';
import VueRouter from 'vue-router';

import Auth from './../components/auth/Auth.vue';
import Messages from './../components/messages/Messages.vue';

Vue.use(VueRouter);

export default new VueRouter({
  routes: [
    {
      path: '/auth',
      component: Auth
    },
    {
      path: '/messages',
      component: Messages
    }
  ]
});
