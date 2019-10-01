import Vue from 'vue';
import VueRouter from 'vue-router';

import Messages from '../components/messages/Messages.vue';
import MessagesChat from '../components/messages/MessagesChat.vue';
import MessagesChatEmpty from '../components/messages/MessagesChatEmpty.vue';
import Photos from '../components/photos/Photos.vue';

Vue.use(VueRouter);

export default new VueRouter({
  routes: [
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
      path: '/photos',
      component: Photos
    }
  ]
});
