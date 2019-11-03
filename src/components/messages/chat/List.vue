<template>
  <Scrolly class="messages_list_wrap"
           :vclass="['messages_list', { empty: !hasMessages }]"
           :lock="lockScroll"
           @scroll="onScroll"
           ref="scrolly"
  >
    <div v-if="hasMessages" class="messages_empty_block"></div>
    <div v-if="loadingUp" class="loading"></div>

    <MessagesList :peer_id="id" :list="messagesWithLoading" />

    <div v-if="loadingDown" class="loading"></div>

    <div v-if="!hasMessages && !loadingUp" class="messages_empty_dialog">
      <img src="~assets/placeholder_empty_messages.webp">
      {{ l('im_empty_dialog') }}
    </div>
    <div v-else-if="hasMessages" class="messages_typing" ref="typing">
      <Typing v-if="hasTyping" :peer_id="id" :full="true"/>
    </div>

    <div :class="['im_scroll_end_btn', { hidden: !showEndBtn }]" @click="scrollToEnd">
      <img src="~assets/arrow_bottom.webp">
    </div>
  </Scrolly>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { fields, concatProfiles, endScroll, eventBus, callWithDelay, timer } from 'js/utils';
  import { parseMessage, parseConversation } from 'js/messages';
  import longpoll from 'js/longpoll';

  import Scrolly from '../../UI/Scrolly.vue';
  import MessagesList from './MessagesList.vue';
  import Typing from '../Typing.vue';

  export default {
    props: ['id'],
    components: {
      Scrolly,
      MessagesList,
      Typing
    },
    data: () => ({
      loadingUp: false,
      loadedUp: false,

      loadingDown: false,
      loadedDown: false,

      scrollTop: null,
      lockScroll: false,

      showEndBtn: false,
      showTopTime: false
    }),
    computed: {
      messages() {
        return this.$store.state.messages.messages[this.id] || [];
      },
      messagesWithLoading() {
        return this.messages.concat(this.loadingMessages);
      },
      hasMessages() {
        return this.messagesWithLoading.length;
      },
      hasTyping() {
        const typing = this.$store.state.messages.typing[this.id] || {};

        return Object.keys(typing).length;
      },
      loadingMessages() {
        return this.$store.state.messages.loadingMessages[this.id] || [];
      }
    },
    methods: {
      async load(params = {}, { isDown, isFirstLoad } = {}) {
        if(isDown) this.loadingDown = true;
        else this.loadingUp = true;

        const hasMessages = this.hasMessages;
        const { items, conversations, profiles, groups } = await vkapi('messages.getHistory', {
          peer_id: this.id,
          extended: 1,
          fields: fields,
          ...params
        });
        const peer = parseConversation(conversations[0]);

        this.lockScroll = true;

        this.$store.commit('messages/updateConversation', { peer });
        this.$store.commit('addProfiles', concatProfiles(profiles, groups));
        this.$store.commit('messages/addMessages', {
          peer_id: this.id,
          messages: items.map(parseMessage).reverse(),
          addNew: isDown
        });

        const messagesList = this.$el.firstChild;
        const { scrollTop, scrollHeight } = messagesList;

        await this.$nextTick();
        setTimeout(() => this.lockScroll = false, 0);

        if(!hasMessages) {
          this.scrollToEnd();
        } else if(!isDown) {
          // Остаемся на месте при добавлении контента сверху
          messagesList.scrollTop = messagesList.scrollHeight - scrollHeight + scrollTop;
        }

        if(isDown || isFirstLoad) {
          this.loadingDown = false;
          this.loadedDown = !items[0] || items[0].id == peer.last_msg_id;
        }

        if(!isDown) {
          this.loadingUp = false;
          this.loadedUp = !isFirstLoad && items.length < 20;
        }

        this.checkReadMessages(messagesList);
        this.checkScrolling(messagesList);

        return items;
      },

      scrollToEnd() {
        if(this.$refs.typing) {
          this.showEndBtn = false;
          this.$refs.typing.scrollIntoView(false);
          this.$refs.scrolly.refreshScrollLayout();
        }
      },

      onScroll(e) {
        if(!e.scrollHeight) return;

        const isBottom = e.scrollTop + e.offsetHeight + 250 >= e.scrollHeight;

        this.showEndBtn = !isBottom && e.dy > 0;

        this.checkReadMessages(e);
        this.checkScrolling(e);
      },

      async checkReadMessages(wrap) {
        if(!this.$store.state.settings.messagesSettings.notRead) {
          await timer(0);

          const messages = [].slice.call(document.querySelectorAll('.service_message.isUnread, .message_wrap.isUnread:not(.out)'));

          let lastReadedMsg;

          for(const el of messages) {
            if(wrap.offsetHeight + wrap.scrollTop - el.offsetHeight >= el.offsetTop) {
              lastReadedMsg = +el.id;
            } else {
              break;
            }
          }

          if(lastReadedMsg) this.readMessages(lastReadedMsg);
        }
      },

      readMessages: callWithDelay(function(msg_id) {
        vkapi('messages.markAsRead', {
          start_message_id: msg_id,
          peer_id: this.id
        });
      }, 500),

      checkScrolling: endScroll(function({ isUp, isDown }) {
        if(isUp && !this.loadingUp && !this.loadedUp) {
          const [msg] = this.messages;

          this.loadingUp = true;

          this.load({
            start_message_id: msg ? msg.id : -1
          });
        }

        if(isDown && !this.loadingUp && !this.loadingDown && !this.loadedDown) {
          this.loadingDown = true;

          this.load({
            start_message_id: this.messages[this.messages.length-1].id,
            offset: -20
          }, { isDown: true });
        }
      }, -1)
    },
    activated() {
      const el = this.$el.firstChild;

      if(this.scrollTop != null) {
        el.scrollTop = this.scrollTop;
      } else {
        this.checkScrolling(el);
      }
    },
    mounted() {
      this.load({
        start_message_id: -1,
        offset: -10
      }, { isFirstLoad: true }).then((items) => {
        const unreadMessages = document.querySelector('.message_unreaded_messages');

        if(unreadMessages) {
          const el = this.$el.firstChild;

          el.scrollTop = unreadMessages.offsetTop - el.clientHeight / 2;
        }
      });

      eventBus.on('messages:closeChat', (peer_id) => {
        if(this.id == peer_id) {
          this.scrollTop = this.$el.firstChild.scrollTop;
        }
      });

      eventBus.on('messages:load', (peer_id, { unlockUp, unlockDown } = {}) => {
        if(this.id == peer_id) {
          if(unlockUp) this.loadedUp = false;
          if(unlockDown) this.loadedDown = false;

          this.checkScrolling(this.$el.firstChild);
        }
      });

      eventBus.on('messages:jumpTo', (peer_id, { msg_id }) => {
        async function onLoad() {
          const msg = document.querySelector(`.message_wrap[id="${msg_id}"]`);

          if(msg) {
            const el = this.$el.firstChild;
            el.scrollTop = msg.offsetTop - el.clientHeight / 2;

            this.$refs.scrolly.refreshScrollLayout();
            this.checkScrolling(el);

            msg.setAttribute('active', '');

            setTimeout(() => {
              msg.removeAttribute('active');
            }, 2000);
          }
        }

        if(this.messages.find((msg) => msg.id == msg_id)) {
          onLoad.call(this);
        } else {
          this.$store.commit('messages/removeConversationMessages', peer_id);

          this.loadedUp = this.loadedDown = false;

          this.load({
            start_message_id: msg_id,
            offset: -10
          }).then(onLoad.bind(this));
        }
      });

      longpoll.on('new_message', async ({ random_id }, peer_id) => {
        if(peer_id != this.id) return;

        const el = this.$el.firstChild;
        const { scrollTop, clientHeight, scrollHeight } = el;

        this.checkReadMessages(el);
        await this.$nextTick();

        if(this.loadingMessages.find((msg) => msg.random_id == random_id)) {
          // Пришло мое сообщение
          this.$store.commit('messages/removeLoadingMessage', {
            peer_id: this.id,
            random_id: random_id
          });

          this.scrollToEnd();
        } else if(scrollTop + clientHeight == scrollHeight) {
          // Пришло сообщение, когда ты был в конце беседы
          this.scrollToEnd();
        }
      });
    }
  }
</script>

<style>
  .messages_list_wrap, .messages_list {
    display: flex;
    flex-direction: column;
  }

  .messages_list_wrap {
    height: 100%;
  }

  .messages_typing {
    display: flex;
    align-items: center;
    flex: none;
    min-height: 35px;
    padding: 8px 20px;
  }

  .messages_typing .typing_text {
    margin-left: 15px;
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
    font-size: 16px;
    color: #47474a;
  }

  .messages_empty_dialog img {
    height: 160px;
  }

  .im_scroll_end_btn {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 25px;
    bottom: 30px;
    width: 40px;
    height: 40px;
    background: #fff;
    border: solid 1px #cfd9e1;
    border-radius: 50%;
    opacity: 1;
    cursor: pointer;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .2);
    transition: background-color .3s, transform .2s, opacity .2s, visibility .2s;
  }

  .im_scroll_end_btn img {
    width: 24px;
    height: 24px;
  }

  .im_scroll_end_btn:hover {
    background: #f6f8fb;
  }

  .im_scroll_end_btn.hidden {
    transform: translateY(20px);
    opacity: 0;
    visibility: hidden;
  }
</style>
