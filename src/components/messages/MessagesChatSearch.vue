<template>
  <div class="im_chat_container im_search_container">
    <div class="header">
      <img src="~assets/im_back.svg" class="header_btn im_header_back" @click="$emit('close')">
      <input
        ref="input"
        v-model="text"
        class="im_search_input im_chat_search_input"
        :placeholder="l('search')"
      >
      <Icon
        name="cancel"
        color="var(--background-blue-text)"
        class="header_btn im_search_cancel"
        @click="$emit('close')"
      />
    </div>

    <div class="im_chat_wrap">
      <Scrolly
        ref="scrollyRef"
        class="messages_list_wrap"
        vclass="messages_list"
        :lock="lockScroll"
        @scroll="onScroll"
      >
        <div v-if="!text && !messages.length" class="im_search_placeholder">
          {{ l('im_search_messages_placeholder') }}
        </div>

        <div
          v-if="text && loaded && !messages.length"
          class="im_search_placeholder"
        >
          {{ l('im_search_nothing') }}
        </div>

        <div v-if="loading" class="loading"></div>

        <MessagesList
          v-if="messages.length"
          :peer_id="peer_id"
          :peer="peer"
          :list="messages"
          isCustomView="search"
        />
      </Scrolly>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, watch, onMounted, nextTick, computed } from 'vue';
import { debounce, endScroll, fields, concatProfiles, createQueueManager } from 'js/utils';
import { parseMessage } from 'js/messages';
import vkapi from 'js/vkapi';
import store from 'js/store';

import Icon from '../UI/Icon.vue';
import Scrolly from '../UI/Scrolly.vue';
import MessagesList from './chat/MessagesList.vue';

export default {
  props: ['peer_id', 'peer'],

  components: {
    Icon,
    Scrolly,
    MessagesList
  },

  setup(props) {
    const state = reactive({
      scrollyRef: null,
      list: computed(() => state.scrollyRef && state.scrollyRef.viewport),

      input: null,
      text: '',

      loading: false,
      loaded: false,
      lockScroll: false,

      offset: 0,
      messages: []
    });

    const load = createQueueManager(async ({ beforeLoad } = {}) => {
      if (beforeLoad) {
        beforeLoad();
      }

      if (!state.text) {
        return;
      }

      state.loading = true;

      const {
        items,
        profiles,
        groups
      } = await vkapi('messages.search', {
        peer_id: props.peer_id,
        q: state.text,
        count: 40,
        offset: state.offset,
        extended: 1,
        fields
      });

      store.commit('addProfiles', concatProfiles(profiles, groups));

      state.messages.unshift(...items.map(parseMessage).reverse());

      const { scrollTop, scrollHeight } = state.list;

      state.lockScroll = true;
      await nextTick();
      requestIdleCallback(() => (state.lockScroll = false));

      // Сохраняем старую позицию скролла
      state.list.scrollTop = state.list.scrollHeight - scrollHeight + scrollTop;

      state.loading = false;
      state.offset += items.length;

      if (items.length < 40) {
        state.loaded = true;
      }
    });

    watch(() => state.text, debounce(() => {
      load({
        beforeLoad() {
          state.loaded = false;
          state.offset = 0;
          state.messages = [];
        }
      });
    }, 500));

    onMounted(() => {
      state.input.focus();
    });

    const onScroll = endScroll(() => {
      if (!state.loading && !state.loaded) {
        load();
      }
    }, 1);

    return {
      ...toRefs(state),
      onScroll
    };
  }
};
</script>
