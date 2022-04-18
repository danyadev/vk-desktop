import { createRouter, createMemoryHistory } from 'vue-router';

import Auth from '@/auth/Auth.vue';
import AuthConfirm from '@/auth/AuthConfirm.vue';

import Messages from '@/messages/Messages.vue';
import MessagesChat from '@/messages/MessagesChat.vue';
import MessagesChatEmpty from '@/messages/MessagesChatEmpty.vue';
import MessagesChatForward from '@/messages/MessagesChatForward.vue';

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
