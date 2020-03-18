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

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

:focus {
  outline: none;
}

@font-face {
  font-family: Roboto;
  font-weight: 400;
  font-display: block;
  src: url('~assets/Roboto.ttf');
}

@font-face {
  font-family: Roboto;
  font-weight: 500;
  font-display: block;
  src: url('~assets/RobotoMedium.ttf');
}

body {
  font-family: BlinkMacSystemFont, Roboto;
  font-size: 15px;
  margin: 0;
  overflow: hidden;
  height: 100vh;
  -webkit-rtl-ordering: visual;
  text-rendering: optimizeSpeed;
  background: #fff;
  user-select: none;
}

img:not(.emoji) {
  -webkit-user-drag: none;
  user-select: none;
}

.app {
  height: calc(100vh - var(--titlebar-height));
  position: relative;
}

.root {
  --titlebar-height: 32px;
}

.root.mac {
  --titlebar-height: 22px;
}

.text-overflow {
  /* .keyboard_button div, */
  /* .im_peer_message_wrap > div:first-child, */
  /* .attach_photo_type { */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.link {
  color: #306aab;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}

.input {
  width: 250px;
  outline: none;
  border: 1px solid #d2d8de;
  border-radius: 5px;
  font-size: 15px;
  color: #3c3c3c;
  line-height: 32px;
  height: 34px;
  padding: 0 9px;
  transition: border-color .3s;
}

.input:disabled {
  color: #999;
}

.input:hover {
  border: 1px solid #a2a5a8;
}

.input:focus {
  border: 1px solid #7e7f7f;
}

.input::-webkit-input-placeholder {
  color: #a0a0a0;
}

.header {
  display: flex;
  align-items: center;
  background: #5281b9;
  width: 100%;
  height: 45px;
}

.header_name {
  color: #fff;
  padding-left: 10px;
}
</style>
