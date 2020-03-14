import { createRouter, createMemoryHistory } from 'vue-router';

import Auth from '../components/auth/Auth.vue';
import AuthConfirm from '../components/auth/AuthConfirm.vue';
import Messages from '../components/messages/Messages.vue';

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/auth',
      component: Auth
    },
    {
      path: '/auth/confirm',
      component: AuthConfirm
    },
    {
      path: '/messages',
      component: Messages
    }
  ]
});
