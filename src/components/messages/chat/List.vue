<template>
  <Scrolly
    ref="scrollyRef"
    class="messages_list_wrap"
    :vclass="['messages_list', { empty: !hasMessages }]"
    :lock="lockScroll"
    @scroll="onScroll"
  >
    <div :class="['im_top_time', { active: showTopTime }]">{{ topTime }}</div>

    <div v-if="hasMessages" class="messages_empty_block"></div>
    <div v-if="loadingUp" class="loading"></div>

    <MessagesList
      :peer_id="peer_id"
      :peer="peer"
      :list="messagesWithLoading"
    />

    <div v-if="loadingDown" class="loading"></div>

    <div v-if="!hasMessages && !loadingUp && !loadingDown" class="messages_empty_dialog">
      <img src="~assets/placeholder_empty_messages.webp">
      {{ l('im_empty_dialog') }}
    </div>
  </Scrolly>
</template>

<script>
import { reactive, computed, onMounted, nextTick, toRefs } from 'vue';
import { createQueueManager, concatProfiles, fields, endScroll, debounce } from 'js/utils';
import { parseMessage, parseConversation } from 'js/messages';
import store from 'js/store';
import vkapi from 'js/vkapi';

import Scrolly from '../../UI/Scrolly.vue';
import MessagesList from './MessagesList.vue';

export default {
  props: ['peer_id', 'peer'],

  components: {
    Scrolly,
    MessagesList
  },

  setup(props) {
    const state = reactive({
      scrollyRef: null,
      list: computed(() => state.scrollyRef && state.scrollyRef.viewport),

      loadingUp: false,
      loadingDown: false,
      loadedUp: false,
      loadedDown: false,

      // scrollTop: null,
      lockScroll: false,

      topTime: null,
      showTopTime: false,

      messages: computed(() => store.state.messages.messages[props.peer_id] || []),
      loadingMessages: computed(() => store.state.messages.loadingMessages[props.peer_id] || []),
      messagesWithLoading: computed(() => {
        return state.messages.concat(state.loadedDown ? state.loadingMessages : []);
      }),
      hasMessages: computed(() => state.messagesWithLoading.length)
    });

    onMounted(() => {
      jumpToStartUnread();
    });

    const load = createQueueManager(async ({ params = {}, config = {} } = {}) => {
      const setPeerLoading = (loading) => {
        store.commit('messages/updatePeerConfig', {
          peer_id: props.peer_id,
          loading
        });
      };

      setPeerLoading(true);
      config.beforeLoad && config.beforeLoad();

      if (config.isDown) {
        state.loadingDown = true;
      } else {
        state.loadingUp = true;
      }

      const { items, conversations, profiles, groups } = await vkapi('messages.getHistory', {
        peer_id: props.peer_id,
        count: 40,
        extended: 1,
        fields,
        ...params
      });

      const peer = parseConversation(conversations[0]);

      state.lockScroll = true;

      store.commit('messages/updateConversation', { peer });
      store.commit('addProfiles', concatProfiles(profiles, groups));
      store.commit('messages/addMessages', {
        peer_id: props.peer_id,
        messages: items.map(parseMessage).reverse(),
        addNew: config.isDown
      });

      const { scrollTop, scrollHeight } = state.list;

      await nextTick();
      requestIdleCallback(() => (state.lockScroll = false));

      if (!config.isDown) {
        state.list.scrollTop = state.list.scrollHeight - scrollHeight + scrollTop;

        state.loadingUp = false;
        state.loadedUp = config.loadedUp || items.length < (config.isFirstLoad ? 20 : 40);
      }

      if (config.isDown || config.isFirstLoad) {
        state.loadingDown = false;
        state.loadedDown = config.loadedDown || !items[0] || items[0].id === peer.last_msg_id;
      }

      setPeerLoading(false);

      // checkReadMessages();
      checkTopTime();

      return items;
    });

    async function jumpToStartUnread() {
      store.commit('messages/removeConversationMessages', props.peer_id);
      state.loadedUp = false;
      state.loadedDown = false;
      state.showEndBtn = false;

      await load({
        params: {
          start_message_id: -1,
          offset: -20
        },
        config: {
          isFirstLoad: true
        }
      });

      const unreadMessages = document.querySelector('.message_unreaded_messages');

      if (unreadMessages) {
        state.list.scrollTop = unreadMessages.offsetTop - state.list.clientHeight / 2;
        afterUpdateScrollTop();
      }
    }

    function afterUpdateScrollTop() {
      checkScrolling(state.list);
    }

    const checkScrolling = endScroll(({ isUp, isDown }) => {
      if (isUp && !state.loadingUp && !state.loadedUp) {
        const [msg] = state.messages;
        state.loadingUp = true;
        load({
          params: {
            start_message_id: msg ? msg.id : -1
          }
        });
      }

      if (isDown && !state.loadingUp && !state.loadingDown && !state.loadedDown) {
        state.loadingDown = true;
        load({
          params: {
            start_message_id: state.messages[state.messages.length - 1].id,
            offset: -40
          },
          config: {
            isDown: true
          }
        });
      }
    }, -1);

    function checkTopTime() {
      const dates = state.list.querySelectorAll('.message_date');
      let value;

      for (let i = 0; i < dates.length; i++) {
        const el = dates[i];
        const nextEl = dates[i + 1];

        if (el.offsetTop <= state.list.scrollTop && (!nextEl || nextEl.offsetTop > state.list.scrollTop)) {
          value = el.innerText;
          break;
        }
      }

      if (value) {
        state.topTime = value;
        state.showTopTime = true;
        hideTopTime();
      } else {
        // Если прописать topTime = null, то при скрытии элемента будет виден пустой элемент
        state.showTopTime = false;
      }
    }

    const hideTopTime = debounce(() => {
      state.showTopTime = false;
    }, 1000);

    function onScroll(scrollyEvent) {
      if (!scrollyEvent.scrollHeight) {
        return;
      }

      checkScrolling(scrollyEvent);
      checkTopTime();
    }

    return {
      ...toRefs(state),
      onScroll
    };
  }
};
</script>

<style>
.messages_list_wrap, .messages_list {
  display: flex;
  flex-direction: column;
}

.messages_list_wrap {
  height: 100%;
}

.messages_list {
  padding-bottom: 25px;
}

.messages_list.empty {
  align-items: center;
  justify-content: center;
}

.messages_empty_block {
  flex-grow: 1;
}

.messages_empty_dialog {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: var(--text-dark-steel-gray);
}

.messages_empty_dialog img {
  height: 160px;
}

.im_top_time {
  position: absolute;
  top: 5px;
  left: 0;
  right: 0;
  width: fit-content;
  margin: 0 auto;
  z-index: 2;
  background-color: var(--background);
  border: solid 1px var(--separator-dark);
  border-radius: 15px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .1);
  padding: 4px 14px;
  color: var(--text-dark-steel-gray);
  line-height: 18px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .4s;
}

.im_top_time.active {
  opacity: 1;
}
</style>
