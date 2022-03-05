import { createRouter, createMemoryHistory } from 'vue-router';

import Auth from '../components/auth/Auth.vue';
import AuthConfirm from '../components/auth/AuthConfirm.vue';

import Messages from '../components/messages/Messages.vue';
import MessagesChat from '../components/messages/MessagesChat.vue';
import MessagesChatEmpty from '../components/messages/MessagesChatEmpty.vue';
import MessagesChatForward from '../components/messages/MessagesChatForward.vue';

export default createRouter({
  history: createMemoryHistory(),

  routes: [
    {
      path: '/auth',
      // По умолчанию будет открываться /auth
      alias: '',
      component: Auth
    },
    {
      path: '/auth/confirm',
      component: AuthConfirm
    },

    {
      path: '/messages',
      component: Messages,
      children: [
        {
          name: 'messages',
          path: '',
          component: MessagesChatEmpty
        },
        {
          name: 'chat',
          path: ':id',
          component: MessagesChat
        },
        {
          name: 'forward-to',
          path: 'forward-to',
          component: MessagesChatForward
        }
      ]
    }
  ]
});
