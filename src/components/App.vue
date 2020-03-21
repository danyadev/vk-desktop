<template>
  <div :class="['root', { mac }]">
    <Titlebar />

    <div class="app">
      <MainMenu v-if="activeUser" />
      <RouterView />
      <ModalsWrapper />
    </div>
  </div>
</template>

<script>
import { computed, onMounted, watch } from 'vue';
import router from 'js/router';
import store from 'js/store';
import vkapi from 'js/vkapi';
import { fields } from 'js/utils';

import 'src/css/shared.css';
import 'src/css/colors.css';

import Titlebar from './Titlebar.vue';
import MainMenu from './MainMenu.vue';
import ModalsWrapper from './ModalsWrapper.vue';

// for debug
window.vkapi = vkapi;

export default {
  components: {
    Titlebar,
    MainMenu,
    ModalsWrapper
  },

  setup() {
    const activeUser = computed(() => store.state.users.activeUser);

    async function initUser() {
      if (!activeUser.value) {
        return router.replace('/auth');
      }

      router.replace('/messages');

      const {
        user,
        counters
        // pinnedPeers,
        // profiles,
        // groups,
        // lp,
        // temporarilyDisabledNotifications
      } = await vkapi('execute.init', {
        // pinnedPeers: this.settings.pinnedPeers.join(','),
        // lp_version: longpoll.version,
        fields
      });

      store.commit('users/updateUser', user);
      store.commit('setMenuCounters', counters);
      // store.commit('addProfiles', concatProfiles(profiles, groups));

      // for(const { peer, msg } of pinnedPeers) {
      //   store.commit('messages/updateConversation', {
      //     peer: parseConversation(peer),
      //     msg: msg.id ? parseMessage(msg) : {}
      //   });
      // }

      // longpoll.start(lp);

      // for(const peer of temporarilyDisabledNotifications) {
      //   addNotificationsTimer(peer);
      // }
    }

    onMounted(initUser);
    watch(activeUser, initUser);

    return {
      activeUser,
      mac: process.platform === 'darwin'
    };
  }
};
</script>
