import Vue from 'vue';
import VueRouter from 'vue-router';

import Auth from '../components/auth/Auth.vue';
import Messages from '../components/messages/Messages.vue';
import MessagesChat from '../components/messages/MessagesChat.vue';
import MessagesChatEmpty from '../components/messages/MessagesChatEmpty.vue';
import EmptyPage from '../components/EmptyPage.vue';

Vue.use(VueRouter);

export default new VueRouter({
  routes: [
    {
      name: 'auth',
      path: '/auth',
      component: Auth
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
        }
      ]
    },
    {
      name: 'empty',
      path: '/empty',
      component: EmptyPage
    }
  ]
});
