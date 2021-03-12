<template>
  <div :theme="dark ? 'dark' : 'light'" :class="['root', { mac }]">
    <Titlebar />

    <div class="app">
      <LeftMenu v-if="!isAuth" />

      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" :key="route.path.split('/')[1]" />
        </KeepAlive>
      </RouterView>

      <ModalsWrapper />
      <ContextMenuWrapper />
      <SnackbarsWrapper />
      <TooltipsWrapper />
    </div>
  </div>
</template>

<script>
import { reactive, computed, watch } from 'vue';
import { fields, concatProfiles } from 'js/utils';
import { addNotificationsTimer, parseMessage, parseConversation } from 'js/messages';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';
import request from 'js/request';
import longpoll from 'js/longpoll';
import * as dateUtils from 'js/date/utils';
import * as auth from './auth';
import * as emoji from 'js/emoji';

import 'css/shared.css';
import 'css/colors.css';
import 'css/colors_dark.css';

import Titlebar from './Titlebar.vue';
import LeftMenu from './menu/LeftMenu.vue';
import ModalsWrapper from './ModalsWrapper.vue';
import ContextMenuWrapper from './ContextMenus/ContextMenuWrapper.vue';
import SnackbarsWrapper from './SnackbarsWrapper.vue';
import TooltipsWrapper from './TooltipsWrapper.vue';

// Для разработки / дебага
window.vkapi = vkapi;
window.store = store;
window.router = router;
window.request = request;
window.longpoll = longpoll;
window.dateUtils = dateUtils;
window.auth = auth;
window.emoji = emoji;

export default {
  components: {
    Titlebar,
    LeftMenu,
    ModalsWrapper,
    ContextMenuWrapper,
    SnackbarsWrapper,
    TooltipsWrapper
  },

  setup() {
    const state = reactive({
      mac: process.platform === 'darwin',
      activeUserID: computed(() => store.state.users.activeUserID),
      route: computed(() => router.currentRoute.value),
      isAuth: computed(() => ['/', '/auth'].includes(state.route.path)),
      dark: computed(() => store.getters['settings/settings'].useDarkTheme)
    });

    async function initUser() {
      if (!state.activeUserID) {
        return;
      }

      router.replace('/messages');

      const {
        user,
        counters,
        pinnedPeers,
        profiles,
        groups,
        lp,
        temporarilyDisabledNotifications,
        firstConversations
      } = await vkapi('execute.init', {
        lp_version: longpoll.version,
        fields
      });

      store.commit('users/updateUser', user);
      store.commit('setMenuCounters', counters);
      store.commit('addProfiles', concatProfiles(profiles, groups));

      for (const { peer, msg } of pinnedPeers) {
        store.commit('messages/updateConversation', {
          peer: parseConversation(peer),
          msg: msg.id ? parseMessage(msg) : {}
        });
      }

      store.commit('messages/addConversations', firstConversations.map((conversation) => ({
        peer: parseConversation(conversation.conversation),
        msg: conversation.last_message ? parseMessage(conversation.last_message) : {}
      })));

      store.state.messages.pinnedPeers = pinnedPeers.map(({ peer }) => peer.peer.id);

      longpoll.start(lp);

      for (const peer of temporarilyDisabledNotifications) {
        addNotificationsTimer(peer);
      }
    }

    initUser();
    watch(() => state.activeUserID, initUser);

    return state;
  }
};
</script>
