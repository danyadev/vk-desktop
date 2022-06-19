<template>
  <div :class="['root', { isMacOS }, settingsClasses]" :theme="dark ? 'dark' : 'light'">
    <Titlebar />

    <div class="app">
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
import remoteElectron from '@electron/remote';
import { reactive, computed, watch } from 'vue';
import { isMacOS } from 'js/utils';
import { fields, concatProfiles } from 'js/api/utils';
import { addNotificationsTimer, parseMessage, parseConversation } from 'js/api/messages';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';
import longpoll from 'js/longpoll';

import 'css/shared.css';
import 'css/colors.css';
import 'css/colors_dark.css';

import Titlebar from './Titlebar.vue';
import ModalsWrapper from './ModalsWrapper.vue';
import ContextMenuWrapper from './ContextMenus/ContextMenuWrapper.vue';
import SnackbarsWrapper from './SnackbarsWrapper.vue';
import TooltipsWrapper from './TooltipsWrapper.vue';

export default {
  components: {
    Titlebar,
    ModalsWrapper,
    ContextMenuWrapper,
    SnackbarsWrapper,
    TooltipsWrapper
  },

  setup() {
    const state = reactive({
      isMacOS,
      activeUserID: computed(() => store.state.users.activeUserID),
      route: computed(() => router.currentRoute.value),
      dark: computed(() => state.settings.useDarkTheme),

      settings: computed(() => store.getters['settings/settings']),
      settingsClasses: computed(() => {
        const settingsClasses = ['showAvatarsAtBottom', 'useMoreSaturatedColors']
          .map((name) => state.settings && state.settings[name] && `st-${name}`);

        return [...settingsClasses, store.state.hasWindowFrame && 'st-useNativeTitlebar'];
      })
    });

    remoteElectron.nativeTheme.themeSource = state.dark
      ? 'dark'
      : 'light';

    async function initUser() {
      if (!state.activeUserID) {
        return;
      }

      router.replace('/messages');

      // Обнуляем счетчик, который может быть ненулевым после смены аккаунта
      store.dispatch('setBadgeCount');

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
      store.commit('addProfiles', concatProfiles(profiles, groups));

      store.commit('setCounters', {
        unread: counters.messages || 0,
        unreadUnmuted: counters.messages_unread_unmuted
      });
      store.dispatch('setBadgeCount');

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
    // Для переходов авторизация -> аккаунт и обратно
    // При смене аккаунта приложение перезагружается
    watch(() => state.activeUserID, initUser);

    return state;
  }
};
</script>
