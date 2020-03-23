<template>
  <div class="im_peers_container">
    <div class="header">
      <HeaderButton />
      <div class="header_name">{{ l('im_header_title') }}</div>
      <!-- <MessagesListMenu /> -->
    </div>
    <Scrolly
      class="im_peers_wrap"
      :vclass="{ loading }"
      :lock="lockScroll"
      @scroll="onScroll"
    >
      <template v-if="peersLists.pinned.length && peersLists.pinned[0]">
        <div>
          <MessagesPeer
            v-for="{ peer, msg } of peersLists.pinned"
            :key="peer.id"
            :peer="peer"
            :msg="msg"
            :activeChat="$props.activeChat"
          />
        </div>
        <div class="im_peers_delimiter"></div>
      </template>

      <MessagesPeer
        v-for="{ peer, msg } of peersLists.unpinned"
        :key="peer.id"
        :peer="peer"
        :msg="msg"
        :activeChat="$props.activeChat"
      />
    </Scrolly>
  </div>
</template>

<script>
import { reactive, toRefs, computed, onMounted, nextTick } from 'vue';
import { fields, concatProfiles, timer } from 'js/utils';
import { parseConversation, parseMessage } from 'js/messages';
import vkapi from 'js/vkapi';
import store from 'js/store';

import HeaderButton from '../HeaderButton.vue';
// import MessagesListMenu from '../ActionMenus/MessagesListMenu.vue';
import Scrolly from '../UI/Scrolly.vue';
import MessagesPeer from './MessagesPeer.vue';

export default {
  props: ['activeChat'],

  components: {
    HeaderButton,
    // MessagesListMenu,
    Scrolly,
    MessagesPeer
  },

  setup() {
    const state = reactive({
      loading: true,
      loaded: false,
      lockScroll: false
    });

    const peerIds = computed(() => store.state.messages.peerIds);

    const settings = computed(() => store.getters['settings/settings']);
    const peersList = computed(() => store.getters['messages/peersList']);

    const peersLists = computed(() => ({
      pinned: settings.value.pinnedPeers.map((id) => {
        return store.state.messages.conversations[id];
      }),

      unpinned: peersList.value.filter(({ peer }) => {
        return !settings.value.pinnedPeers.includes(peer.id);
      })
    }));

    async function load() {
      const { items, profiles, groups } = await vkapi('messages.getConversations', {
        offset: peerIds.value.length,
        count: 40,
        fields,
        extended: true
      });

      const conversations = items.map((item) => ({
        peer: parseConversation(item.conversation),
        msg: parseMessage(item.last_message)
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

    function onScroll() {
      // TODO
    }

    onMounted(() => {
      load();
    });

    return {
      ...toRefs(state),

      onScroll,
      peersLists
    };
  }
};
</script>

<style>
.im_peers_wrap {
  width: 100%;
  /* 45px - постоянная высота у .header */
  height: calc(100% - 45px);
  border-right: 1px solid var(--separator);
}

.im_peers_container .header_name {
  flex-grow: 1;
}

.im_peers_delimiter {
  width: 100%;
  height: 6px;
  background: /* #e7e8ec */ var(--separator); /* -dark ? */
}
</style>
