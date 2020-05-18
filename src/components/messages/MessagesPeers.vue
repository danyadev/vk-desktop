<template>
  <div class="im_peers_container">
    <div class="header">
      <HeaderButton />
      <div class="header_name">
        {{ l(route.name === 'forward-to' ? 'im_forward_messages' : 'im_header_title') }}
      </div>

      <Icon
        name="search"
        color="var(--blue-background-text)"
        class="header_btn im_search_icon"
        @click="isSearch = true"
      />
      <MessagesListMenu />
    </div>
    <Scrolly
      class="im_peers_wrap"
      :vclass="{ loading }"
      :lock="lockScroll"
      @scroll="onScroll"
    >
      <div v-if="peersLists.pinned.length" class="im_pinned_peers">
        <MessagesPeer
          v-for="{ peer, msg } of peersLists.pinned"
          :key="peer.id"
          :peer="peer"
          :msg="msg"
          :activeChat="activeChat"
        />
      </div>

      <MessagesPeer
        v-for="{ peer, msg } of peersLists.unpinned"
        :key="peer.id"
        :peer="peer"
        :msg="msg"
        :activeChat="activeChat"
      />
    </Scrolly>
  </div>

  <Transition name="fade-out">
    <MessagesPeersSearch v-if="isSearch" @close="isSearch = false" />
  </Transition>
</template>

<script>
import { reactive, toRefs, computed, onMounted, nextTick } from 'vue';
import { fields, concatProfiles, timer, endScroll } from 'js/utils';
import { parseConversation, parseMessage } from 'js/messages';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';

import HeaderButton from '../HeaderButton.vue';
import Scrolly from '../UI/Scrolly.vue';
import Icon from '../UI/Icon.vue';
import MessagesPeer from './MessagesPeer.vue';
import MessagesPeersSearch from './MessagesPeersSearch.vue';
import MessagesListMenu from '../ActionMenus/MessagesListMenu.vue';

export default {
  props: ['activeChat'],

  components: {
    HeaderButton,
    Scrolly,
    Icon,
    MessagesPeer,
    MessagesPeersSearch,
    MessagesListMenu
  },

  setup() {
    const state = reactive({
      route: router.currentRoute,

      loading: true,
      loaded: computed({
        get: () => store.state.messages.isMessagesPeersLoaded,
        set: (value) => (store.state.messages.isMessagesPeersLoaded = value)
      }),

      lockScroll: false,
      isSearch: false,

      peerIds: computed(() => store.state.messages.peerIds),
      settings: computed(() => store.getters['settings/settings']),
      peersList: computed(() => store.getters['messages/peersList']),

      peersLists: computed(() => ({
        pinned: state.settings.pinnedPeers
          .map((id) => store.state.messages.conversations[id])
          .filter(Boolean),

        unpinned: state.peersList.filter(({ peer }) => {
          return !state.settings.pinnedPeers.includes(peer.id);
        })
      }))
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

    const onScroll = endScroll(() => {
      if (!state.loading && !state.loaded) {
        state.loading = true;
        load();
      }
    });

    onMounted(() => {
      load();
    });

    return {
      ...toRefs(state),
      onScroll
    };
  }
};
</script>

<style>
.im_peers_wrap {
  width: 100%;
  /* 50px - постоянная высота у .header */
  height: calc(100% - 50px);
  border-right: 1px solid var(--separator);
}

.im_peers_container .header_name {
  flex-grow: 1;
}

.im_pinned_peers {
  border-bottom: 6px solid var(--separator);
}
</style>
