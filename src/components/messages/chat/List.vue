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
      :startInRead="startInRead"
    />

    <div v-if="loadingDown" class="loading"></div>

    <div v-if="!hasMessages && !loadingUp && !loadingDown" class="messages_empty_dialog">
      <img src="~assets/placeholder_empty_messages.webp">
      {{ l('im_empty_dialog') }}
    </div>

    <div
      :class="['im_scroll_mention_btn', { hidden: !showEndBtn || !peer || !peer.mentions.length }]"
      @click="scrollToMention"
    >
      <div>{{ peer && peer.mentions.length }}</div>
      <Icon name="mention" color="var(--icon-dark-gray)" width="24" height="30" />
    </div>

    <div :class="['im_scroll_end_btn', { hidden: !showEndBtn }]" @click="scrollToEnd">
      <div>{{ peer && convertCount(peer.unread) || '' }}</div>
      <img src="~assets/dropdown.webp">
    </div>
  </Scrolly>
</template>

<script>
import { reactive, computed, onMounted, nextTick, toRefs } from 'vue';
import { createQueueManager, concatProfiles, fields, endScroll, debounce, convertCount, timer } from 'js/utils';
import { parseMessage, parseConversation } from 'js/messages';
import store from 'js/store';
import vkapi from 'js/vkapi';

import Icon from '../../UI/Icon.vue';
import Scrolly from '../../UI/Scrolly.vue';
import MessagesList from './MessagesList.vue';

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

      loadingUp: false,
      loadingDown: false,
      loadedUp: false,
      loadedDown: false,

      // scrollTop: null,
      lockScroll: false,

      topTime: null,
      showTopTime: false,

      showEndBtn: true,
      replyHistory: [],
      lastViewedMention: null,

      startInRead: 0,

      messages: computed(() => store.state.messages.messages[props.peer_id] || []),
      loadingMessages: computed(() => store.state.messages.loadingMessages[props.peer_id] || []),
      messagesWithLoading: computed(() => {
        return state.messages.concat(state.loadedDown ? state.loadingMessages : []);
      }),
      hasMessages: computed(() => state.messagesWithLoading.length)
    });

    onMounted(() => {
      jumpToStartUnread();

      // TODO onActivated
      state.startInRead = props.peer && props.peer.in_read;
    });

    // Base methods ==========================================

    const load = createQueueManager(async ({ params = {}, config = {} } = {}) => {
      function setPeerLoading(loading) {
        store.commit('messages/updatePeerConfig', {
          peer_id: props.peer_id,
          loading
        });
      }

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
        // Сохраняем старую позицию скролла
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

    const jumpTo = createQueueManager(async ({ msg_id, mark = true, top, bottom }) => {
      function setScrollTop(scrollTop, afterLoad) {
        if (afterLoad) {
          state.list.scrollTop = scrollTop;
        } else {
          state.list.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      }

      async function onLoad(afterLoad) {
        if (top) {
          setScrollTop(0, afterLoad);

          return afterUpdateScrollTop();
        }

        const msg = state.list.querySelector(`#id${msg_id}`);

        if (msg) {
          if (msg.clientHeight > state.list.clientHeight) {
            // Расстояние в 1/4 от начала viewport
            const quarterFromViewport = msg.offsetTop - state.list.clientHeight / 4;

            // Из-за возможных небольших несоответствий в размерах
            // было добавлено в запас 5 пикселей.
            setScrollTop(
              state.list.scrollTop >= quarterFromViewport - 5
                ? state.list.scrollHeight
                : quarterFromViewport,
              afterLoad
            );
          } else {
            // Сообщение по центру экрана
            setScrollTop(
              msg.offsetTop + msg.clientHeight / 2 - state.list.clientHeight / 2,
              afterLoad
            );
          }

          afterUpdateScrollTop();

          if (mark) {
            msg.setAttribute('active', '');
            await timer(2000);
            requestIdleCallback(() => msg.removeAttribute('active'));
          }
        }
      }

      function beforeLoad() {
        store.commit('messages/removeConversationMessages', props.peer_id);
        state.loadedUp = state.loadedDown = false;
      }

      state.showEndBtn = false;
      state.showTopTime = false;

      if (top) {
        state.replyHistory.length = 0;

        if (state.loadedUp) {
          onLoad();
        } else {
          load({
            params: { start_message_id: 0, offset: -40 },
            config: { loadedUp: true, beforeLoad }
          }).then(onLoad);
        }
      } else if (bottom) {
        state.replyHistory.length = 0;

        if (state.loadedDown) {
          if (msg_id) {
            onLoad();
          } else {
            const lastLoadingMsg = state.loadingMessages[state.loadingMessages.length - 1];
            const lastMsg = state.messages[state.messages.length - 1];

            if (lastLoadingMsg) {
              msg_id = lastLoadingMsg.id;
              onLoad();
            } else if (lastMsg) {
              msg_id = lastMsg.id;
              onLoad();
            }
          }
        } else {
          const [lastMsg] = await load({
            config: {
              isDown: true,
              loadedDown: true,
              beforeLoad
            }
          });

          msg_id = lastMsg.id;
          onLoad(true);
        }
      } else if (state.messages.find((msg) => msg.id === msg_id)) {
        onLoad();
      } else {
        load({
          params: { start_message_id: msg_id, offset: -20 },
          config: { beforeLoad }
        }).then(onLoad);
      }
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

      const unreadMessages = state.list.querySelector('.message_unreaded_messages');

      if (unreadMessages) {
        state.list.scrollTop = unreadMessages.offsetTop - state.list.clientHeight / 2;
        afterUpdateScrollTop();
      }
    }

    // Scroll actions =====================================

    function onScroll(scrollyEvent) {
      if (!scrollyEvent.viewport.scrollHeight) {
        return;
      }

      state.showEndBtn =
        canShowScrollBtn() && (state.peer && state.peer.unread || scrollyEvent.dy > 0);

      checkScrolling(scrollyEvent);
      checkTopTime();
    }

    const checkScrolling = endScroll(({ isUp, isDown }) => {
      if (state.loadingUp || state.loadingDown) {
        return;
      }

      if (isUp && !state.loadedUp) {
        const [msg] = state.messages;
        state.loadingUp = true;

        load({
          params: {
            start_message_id: msg ? msg.id : -1
          }
        });
      }

      if (isDown && !state.loadedDown) {
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

    function afterUpdateScrollTop() {
      state.showEndBtn = canShowScrollBtn();
      checkScrolling({ viewport: state.list });
    }

    // Time bubble ===================================

    function checkTopTime() {
      const dates = state.list.querySelectorAll('.message_date');
      let value;

      for (let i = 0; i < dates.length; i++) {
        const el = dates[i];
        const nextEl = dates[i + 1];

        if (
          el.offsetTop <= state.list.scrollTop &&
          (!nextEl || nextEl.offsetTop > state.list.scrollTop)
        ) {
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

    // Scroll to end & mention buttons =========================

    function canShowScrollBtn() {
      return !(
        state.loadedDown &&
        !(state.list.scrollTop + state.list.offsetHeight + 100 < state.list.scrollHeight)
      );
    }

    function scrollToEnd() {
      if (state.replyHistory.length) {
        // Возвращаемся на сообщение с ответом
        jumpTo({
          msg_id: state.replyHistory.pop()
        });
      } else if (state.peer && state.peer.unread) {
        const unread = state.list.querySelector('.message_unreaded_messages');

        if (unread) {
          if (
            state.list.offsetHeight + state.list.scrollTop - unread.offsetHeight / 2
            < unread.offsetTop
          ) {
            state.list.scrollTo({
              top: unread.offsetTop - state.list.clientHeight / 2,
              behavior: 'smooth'
            });

            afterUpdateScrollTop();
          } else {
            jumpTo({
              bottom: true,
              mark: false
            });
          }
        } else {
          jumpToStartUnread();
        }
      } else {
        // Переходим в самый низ диалога
        jumpTo({
          bottom: true,
          mark: false
        });
      }
    }

    function scrollToMention() {
      state.lastViewedMention =
        state.peer.mentions.find((id) => id > state.lastViewedMention) ||
        state.peer.mentions[state.peer.mentions.length - 1];

      jumpTo({
        msg_id: state.lastViewedMention
      });
    }

    return {
      ...toRefs(state),

      convertCount,
      onScroll,

      scrollToEnd,
      scrollToMention
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

.im_scroll_end_btn,
.im_scroll_mention_btn {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 25px;
  bottom: 30px;
  width: 40px;
  height: 40px;
  background: var(--background);
  border: solid 1px var(--separator-dark);
  border-radius: 50%;
  opacity: 1;
  cursor: pointer;
  z-index: 1;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .2);
  transition: background-color .3s, transform .2s, opacity .2s, visibility .2s;
}

.im_scroll_end_btn img {
  width: 24px;
  height: 24px;
}

.im_scroll_end_btn.hidden,
.im_scroll_mention_btn.hidden {
  transform: translateY(20px);
  opacity: 0;
  visibility: hidden;
}

.im_scroll_end_btn div:not(:empty),
.im_scroll_mention_btn div:not(:empty) {
  position: absolute;
  top: -5px;
  right: -3px;
  background-color: var(--blue-background);
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
  padding: 2px 5px 1px 5px;
}

.im_scroll_mention_btn {
  bottom: 80px;
}

.im_scroll_mention_btn svg {
  margin-top: -2px;
}
</style>
