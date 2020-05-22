<template>
  <div class="im_peers_container im_search_container">
    <div class="header">
      <HeaderButton />
      <input
        ref="input"
        v-model="text"
        class="im_search_input"
        placeholder="Введите запрос..."
      >
      <Icon
        name="cancel"
        color="var(--blue-background-text)"
        class="header_btn im_search_cancel"
        @click="$emit('close')"
      />
    </div>

    <Scrolly
      class="im_peers_wrap"
      :vclass="{ loading }"
      :lock="lockScroll"
      @scroll="onScroll"
    >
      <div v-if="!text && !conversations.length && !messages.length" class="im_search_placeholder">
        {{ l('im_search_placeholder') }}
      </div>

      <div
        v-if="text && loaded && !conversations.length && !messages.length"
        class="im_search_placeholder"
      >
        {{ l('im_search_nothing') }}
      </div>

      <div v-if="conversations.length">
        <div class="im_search_subheader">{{ l('im_search_dialogs') }}</div>
        <MessagesProfile
          v-for="peer of conversations"
          :key="peer.id"
          :peer="peer"
          @close="$emit('close')"
        />
      </div>

      <div v-if="conversations.length && messages.length" class="im_search_separator"></div>

      <div v-if="messages.length">
        <div class="im_search_subheader">{{ l('im_header_title') }}</div>
        <MessagesPeer
          v-for="{ msg, peer } of messages"
          :key="msg.id"
          :msg="msg"
          :peer="peer"
          :fromSearch="true"
        />
      </div>
    </Scrolly>
  </div>
</template>

<script>
import { reactive, toRefs, watch, nextTick, onMounted } from 'vue';
import { debounce, endScroll, fields, concatProfiles, createQueueManager } from 'js/utils';
import { parseConversation, parseMessage } from 'js/messages';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';

import HeaderButton from '../HeaderButton.vue';
import Icon from '../UI/Icon.vue';
import Scrolly from '../UI/Scrolly.vue';
import MessagesPeer from './MessagesPeer.vue';
import MessagesProfile from './MessagesProfile.vue';

export default {
  components: {
    HeaderButton,
    Icon,
    Scrolly,
    MessagesPeer,
    MessagesProfile
  },

  setup() {
    const state = reactive({
      input: null,
      text: '',

      loading: false,
      loaded: false,
      lockScroll: false,

      offset: 0,
      conversations: [],
      messages: []
    });

    const searchPeersAndMessages = createQueueManager(async (beforeLoad) => {
      if (beforeLoad) {
        beforeLoad();
      }

      if (!state.text) {
        return;
      }

      state.loading = true;

      const {
        conversations,
        messages,
        next_offset,
        stop
      } = await vkapi('execute.searchConversations', {
        q: state.text,
        offset: state.offset,
        fields
      });

      store.commit('addProfiles', [
        ...(
          conversations
            ? concatProfiles(conversations.profiles, conversations.groups)
            : []
        ),
        ...concatProfiles(messages.profiles, messages.groups)
      ]);

      if (conversations) {
        state.conversations = [
          ...state.conversations,
          ...conversations.items.map(parseConversation)
        ];
      }

      const messagesPeers = messages.conversations.reduce((all, cur) => {
        all[cur.peer.id] = parseConversation(cur);
        return all;
      }, {});

      state.messages = [
        ...state.messages,
        ...messages.items.map((msg) => ({
          msg: parseMessage(msg),
          peer: messagesPeers[msg.peer_id]
        }))
      ];

      state.lockScroll = true;
      await nextTick();
      requestIdleCallback(() => (state.lockScroll = false));

      state.loading = false;
      state.offset += next_offset;

      if (stop) {
        state.loaded = true;
      }
    });

    const searchOnlyPeers = createQueueManager(async (beforeLoad) => {
      if (beforeLoad) {
        beforeLoad();
      }

      if (!state.text) {
        return;
      }

      state.loading = true;

      const { items, profiles, groups } = await vkapi('messages.searchConversations', {
        q: state.text,
        count: 50,
        extended: 1,
        fields
      });

      store.commit('addProfiles', concatProfiles(profiles, groups));
      state.conversations = items.map(parseConversation).filter((peer) => peer.isWriteAllowed);
      state.loading = false;
      state.loaded = true;
    });

    const search = router.currentRoute.value.name === 'forward-to'
      ? searchOnlyPeers
      : searchPeersAndMessages;

    watch(() => state.text, debounce(() => {
      search(() => {
        state.loaded = false;
        state.offset = 0;
        state.conversations = [];
        state.messages = [];
      });
    }, 500));

    onMounted(() => {
      state.input.focus();
    });

    const onScroll = endScroll(() => {
      if (!state.loading && !state.loaded) {
        search();
      }
    });

    return {
      ...toRefs(state),
      onScroll
    };
  }
};
</script>

<style>
.im_search_subheader {
  margin: 15px 15px 10px 15px;
  color: var(--text-dark-steel-gray);
}

.im_search_separator {
  border-bottom: 6px solid var(--separator);
  margin-top: 8px;
}
</style>
