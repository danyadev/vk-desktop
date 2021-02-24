<template>
  <div class="im_peers_container">
    <div :class="['header', { isScrolled }]">
      <AccountManager />
      <SearchInput />
      <Icon name="write_square" color="var(--icon-blue)" class="im_create_chat_btn" />
      <MessagesListMenu />
    </div>
    <Scrolly
      ref="scrolly"
      class="im_peers_wrap"
      :vclass="{ loading }"
      :lock="lockScroll"
      @scroll="onScroll"
    >
      <MessagesPeer
        v-for="{ peer, msg } of peersList"
        :key="peer.id"
        :peer="peer"
        :msg="msg"
        :activeChat="activeChat"
        :nowDate="nowDate"
      />
    </Scrolly>

    <BottomMenu />
  </div>
</template>

<script>
import { reactive, toRefs, computed, onMounted, nextTick, watch } from 'vue';
import { fields, concatProfiles, timer, endScroll } from 'js/utils';
import { parseConversation, parseMessage } from 'js/messages';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';

import Scrolly from '../UI/Scrolly.vue';
import Icon from '../UI/Icon.vue';
import SearchInput from '../UI/SearchInput.vue';
import AccountManager from '../menu/AccountManager.vue';
import BottomMenu from '../menu/BottomMenu.vue';
import MessagesPeer from './MessagesPeer.vue';
import MessagesListMenu from '../ActionMenus/MessagesListMenu.vue';

export default {
  props: ['activeChat'],

  components: {
    Scrolly,
    Icon,
    SearchInput,
    AccountManager,
    BottomMenu,
    MessagesPeer,
    MessagesListMenu
  },

  setup() {
    const state = reactive({
      scrolly: null,

      route: router.currentRoute,
      isForwardTo: computed(() => state.route.name === 'forward-to'),

      loading: true,
      loaded: computed({
        get: () => store.state.messages.isMessagesPeersLoaded,
        set: (value) => (store.state.messages.isMessagesPeersLoaded = value)
      }),

      lockScroll: false,
      isScrolled: false,

      nowDate: new Date(),

      peerIds: computed(() => store.state.messages.peerIds),
      settings: computed(() => store.getters['settings/settings']),

      peersList: computed(() => {
        const pinnedPeers = store.state.messages.pinnedPeers.map((id) => (
          store.state.messages.conversations[id]
        ));

        const unpinnedPeers = store.getters['messages/peersList'].filter(({ peer }) => (
          !store.state.messages.pinnedPeers.includes(peer.id)
        ));

        return pinnedPeers
          .concat(unpinnedPeers)
          .filter(({ peer }) => !(state.isForwardTo && !peer.isWriteAllowed));
      })
    });

    async function load() {
      const { items, profiles, groups } = await vkapi('messages.getConversations', {
        offset: state.peerIds.length,
        count: 40,
        fields,
        extended: true
      });

      const conversations = items.map((item) => ({
        peer: parseConversation(item.conversation),
        msg: item.last_message ? parseMessage(item.last_message) : {}
      }));

      state.lockScroll = true;

      store.commit('addProfiles', concatProfiles(profiles, groups));
      store.commit('messages/addConversations', conversations);

      await nextTick();
      await timer(0);

      state.lockScroll = false;
      state.loading = false;

      if (items.length < 40) {
        state.loaded = true;
      }
    }

    function onScroll(scrollyEvent) {
      state.isScrolled = !!scrollyEvent.viewport.scrollTop;
      checkScroll(scrollyEvent);
    }

    const checkScroll = endScroll(() => {
      if (!state.loading && !state.loaded) {
        state.loading = true;
        load();
      }
    });

    onMounted(() => {
      // Обнаруживаем первую загрузку
      // До этого момента LongPoll не запустится, так что проблем не будет
      const stop = watch(() => state.peersList, async () => {
        state.loading = false;
        stop();
        await nextTick();
        onScroll(state.scrolly);
      });

      setInterval(() => {
        state.nowDate = new Date();
      }, 10 * 1000);
    });

    return {
      ...toRefs(state),
      onScroll
    };
  }
};
</script>

<style>
.im_peers_container {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--separator);
}

.im_peers_container .header {
  /* Необходимо для смещения border-bottom, чтобы он совпадал с бордером в беседе */
  box-sizing: content-box;
  border-bottom: 1px solid transparent;
}

.im_peers_container .header.isScrolled {
  position: relative;
  border-bottom-color: var(--separator);
}

.im_peers_container .account_manager {
  margin: 0 -8px 0 0;
  padding-left: 8px;
}

.im_peers_container .account_manager .account_users_list {
  top: -3px;
  left: -6px;
  z-index: 5;
}

.im_create_chat_btn {
  flex: none;
  margin-right: 4px;
}

.im_peers_wrap {
  width: 100%;
  overflow-y: auto;
  flex-grow: 1;
}
</style>
