<template>
  <Scrolly
    ref="list"
    class="messages_list_wrap"
    :vclass="['messages_list', { empty: !hasMessages }]"
    :lock="lockScroll"
    @scroll="onScroll"
  >
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
import { createQueueManager, concatProfiles, fields, endScroll } from 'js/utils';
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
      list: null,

      loadingUp: false,
      loadingDown: false,
      loadedUp: false,
      loadedDown: false,

      lockScroll: false,

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

      const list = state.list.viewport;
      const { scrollTop, scrollHeight } = list;

      await nextTick();
      setTimeout(() => (state.lockScroll = false));

      if (!config.isDown) {
        list.scrollTop = list.scrollHeight - scrollHeight + scrollTop;

        state.loadingUp = false;
        state.loadedUp = config.loadedUp || items.length < (config.isFirstLoad ? 20 : 40);
      }

      if (config.isDown || config.isFirstLoad) {
        state.loadingDown = false;
        state.loadedDown = config.loadedDown || !items[0] || items[0].id === peer.last_msg_id;
      }

      setPeerLoading(false);

      // checkReadMessages(list);
      // checkTopTime(list);

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
        const list = state.list.viewport;
        list.scrollTop = unreadMessages.offsetTop - list.clientHeight / 2;
        afterUpdateScrollTop(list);
      }
    }

    function afterUpdateScrollTop(list) {
      checkScrolling(list);
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

    function onScroll(scrollyEvent) {
      if (!scrollyEvent.scrollHeight) {
        return;
      }

      checkScrolling(scrollyEvent);
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
</style>
