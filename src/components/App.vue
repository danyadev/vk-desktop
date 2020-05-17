<template>
  <div :class="['root', { mac }]">
    <Titlebar />

    <div class="app">
      <MainMenu v-if="activeUser" />
      <RouterView />

      <ModalsWrapper />
      <ContextMenuWrapper />
      <SnackbarsWrapper />
      <TooltipsWrapper />
    </div>
  </div>
</template>

<script>
import { reactive, computed, onMounted, watch } from 'vue';
import router from 'js/router';
import store from 'js/store';
import vkapi from 'js/vkapi';
import request from 'js/request';
import { fields, concatProfiles } from 'js/utils';
import { addNotificationsTimer, parseMessage, parseConversation } from 'js/messages';
import longpoll from 'js/longpoll';
import * as auth from './auth/';

import 'css/shared.css';
import 'css/colors.css';

import Titlebar from './Titlebar.vue';
import MainMenu from './MainMenu.vue';
import ModalsWrapper from './ModalsWrapper.vue';
import ContextMenuWrapper from './ContextMenus/ContextMenuWrapper.vue';
import SnackbarsWrapper from './SnackbarsWrapper.vue';
import TooltipsWrapper from './TooltipsWrapper.vue';

// для разработки / дебага
window.vkapi = vkapi;
window.store = store;
window.router = router;
window.longpoll = longpoll;
window.request = request;
window.auth = auth;

export default {
  components: {
    Titlebar,
    MainMenu,
    ModalsWrapper,
    ContextMenuWrapper,
    SnackbarsWrapper,
    TooltipsWrapper
  },

  setup() {
    const state = reactive({
      mac: process.platform === 'darwin',
      activeUser: computed(() => store.state.users.activeUser)
    });

    async function initUser() {
      if (!state.activeUser) {
        return router.replace('/auth');
      }

      router.replace('/messages');

      const {
        user,
        counters,
        pinnedPeers,
        profiles,
        groups,
        lp,
        temporarilyDisabledNotifications
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

      store.commit('settings/updateUserSettings', {
        pinnedPeers: pinnedPeers.map(({ peer }) => peer.peer.id)
      });

      longpoll.start(lp);

      for (const peer of temporarilyDisabledNotifications) {
        addNotificationsTimer(peer);
      }
    }

    onMounted(() => router.isReady().then(initUser));
    watch(() => state.activeUser, initUser);

    return state;
  }
};
</script>
