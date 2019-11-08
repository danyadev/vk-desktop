<template>
  <Scrolly class="messages_list_wrap"
           :vclass="['messages_list', { empty: !hasMessages }]"
           :lock="lockScroll"
           @scroll="onScroll"
           ref="scrolly"
  >
    <div v-if="hasMessages" class="messages_empty_block"></div>
    <div v-if="loadingUp" class="loading"></div>

    <MessagesList :peer_id="peer_id" :peer="peer" :list="messagesWithLoading" />

    <div v-if="loadingDown" class="loading"></div>

    <div v-if="!hasMessages && !loadingUp" class="messages_empty_dialog">
      <img src="~assets/placeholder_empty_messages.webp">
      {{ l('im_empty_dialog') }}
    </div>
    <div v-else-if="hasMessages" class="messages_typing" ref="typing">
      <Typing v-if="hasTyping" :peer_id="peer_id" :full="true" />
    </div>

    <div :class="['im_scroll_mention_btn', { hidden: !showEndBtn || !peer || !peer.mentions.length }]" @click="scrollToMention">
      <div>{{ peer && peer.mentions.length }}</div>
      <Icon name="mention" color="#828a99" width="24" height="30" />
    </div>

    <div :class="['im_scroll_end_btn', { hidden: !showEndBtn }]" @click="scrollToEnd">
      <div>{{ peer && peer.unread || '' }}</div>
      <img src="~assets/dropdown.webp">
    </div>
  </Scrolly>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { fields, concatProfiles, endScroll, eventBus, callWithDelay, timer } from 'js/utils';
  import { parseMessage, parseConversation } from 'js/messages';
  import longpoll from 'js/longpoll';

  import Scrolly from '../../UI/Scrolly.vue';
  import Icon from '../../UI/Icon.vue';
  import MessagesList from './MessagesList.vue';
  import Typing from '../Typing.vue';

  export default {
    props: ['peer_id', 'peer'],
    components: {
      Scrolly,
      Icon,
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
      showTopTime: false,

      lastReadedMsg: null,
      lastViewedMention: null,
      replyHistory: []
    }),
    computed: {
      messages() {
        return this.$store.state.messages.messages[this.peer_id] || [];
      },
      messagesWithLoading() {
        return this.messages.concat(this.loadingMessages);
      },
      hasMessages() {
        return this.messagesWithLoading.length;
      },
      hasTyping() {
        const typing = this.$store.state.messages.typing[this.peer_id] || {};

        return Object.keys(typing).length;
      },
      loadingMessages() {
        return this.$store.state.messages.loadingMessages[this.peer_id] || [];
      }
    },
    methods: {
      async load(params = {}, { isDown, isFirstLoad, loadedUp } = {}) {
        if(isDown) this.loadingDown = true;
        else this.loadingUp = true;

        const { items, conversations, profiles, groups } = await vkapi('messages.getHistory', {
          peer_id: this.peer_id,
          count: 40,
          extended: 1,
          fields,
          ...params
        });
        const peer = parseConversation(conversations[0]);

        this.lockScroll = true;

        this.$store.commit('messages/updateConversation', { peer });
        this.$store.commit('addProfiles', concatProfiles(profiles, groups));
        this.$store.commit('messages/addMessages', {
          peer_id: this.peer_id,
          messages: items.map(parseMessage).reverse(),
          addNew: isDown
        });

        const list = this.$el.firstChild;
        const { scrollTop, scrollHeight } = list;

        await this.$nextTick();
        setTimeout(() => this.lockScroll = false, 0);

        if(!isDown) {
          list.scrollTop = list.scrollHeight - scrollHeight + scrollTop;

          this.loadingUp = false;
          this.loadedUp = loadedUp || !isFirstLoad && items.length < 40;
        }

        if(isDown || isFirstLoad) {
          this.loadingDown = false;
          this.loadedDown = !items[0] || items[0].id == peer.last_msg_id;
        }

        this.checkReadMessages(list);

        return items;
      },

      canShowScrollBtn(list) {
        return !(this.loadedDown && !(list.scrollTop + list.offsetHeight + 100 < list.scrollHeight));
      },

      onScroll(list) {
        if(!list.scrollHeight) return;

        this.showEndBtn = this.canShowScrollBtn(list) && (this.peer && this.peer.unread || list.dy > 0);

        this.checkReadMessages(list);
        this.checkScrolling(list);
      },

      async checkReadMessages(list) {
        if(!this.$store.state.settings.messagesSettings.notRead) {
          // Ждем, пока Vue.js отрендерит новое сообщение
          await timer(0);

          const messages = document.querySelectorAll('.service_message.isUnread, .message_wrap.isUnread:not(.out)');

          let lastReadedMsg;

          for(const msg of messages) {
            if(list.offsetHeight + list.scrollTop - msg.offsetHeight >= msg.offsetTop) {
              lastReadedMsg = +msg.id;
            } else {
              break;
            }
          }

          if(lastReadedMsg) this.readMessages(lastReadedMsg);
        }
      },

      readMessages: callWithDelay(function(msg_id) {
        if(this.lastReadedMsg >= msg_id) return;
        this.lastReadedMsg = msg_id;

        vkapi('messages.markAsRead', {
          start_message_id: msg_id,
          peer_id: this.peer_id
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
            offset: -40
          }, { isDown: true });
        }
      }, -1),

      async jumpTo({ msg_id, mark = true, top, bottom }) {
        async function onLoad(sdasd) {
          const list = this.$el.firstChild;

          if(top) {
            list.scrollTop = 0;

            this.$refs.scrolly.refreshScrollLayout();
            this.checkReadMessages(list);

            return;
          }

          const msg = document.querySelector(`.message_wrap[id="${msg_id}"]`);

          if(msg) {
            if(msg.clientHeight > list.clientHeight) {
              list.scrollTop = msg.offsetTop - list.clientHeight / 4;
            } else {
              list.scrollTop = msg.offsetTop + msg.clientHeight / 2 - list.clientHeight / 2;
            }

            this.$refs.scrolly.refreshScrollLayout();
            this.checkScrolling(list);
            this.checkReadMessages(list);

            this.showEndBtn = this.canShowScrollBtn(list);

            if(mark) {
              msg.setAttribute('active', '');
              await timer(2000);
              msg.removeAttribute('active');
            }
          }
        }

        this.showEndBtn = false;

        if(top) {
          this.replyHistory.length = 0;

          if(this.loadedUp) {
            onLoad.call(this);
          } else {
            this.$store.commit('messages/removeConversationMessages', this.peer_id);
            this.loadedUp = true;
            this.loadedDown = false;

            this.load({
              start_message_id: 0,
              offset: -40
            }, { loadedUp: true }).then(onLoad.bind(this));
          }
        } else if(bottom) {
          this.replyHistory.length = 0;

          if(this.loadedDown) {
            const lastMsg = this.messages[this.messages.length-1];

            if(lastMsg) {
              msg_id = lastMsg.id;
              onLoad.call(this);
            }
          } else {
            this.$store.commit('messages/removeConversationMessages', this.peer_id);
            this.loadedUp = false;
            this.loadedDown = true;

            const [lastMsg] = await this.load();

            msg_id = lastMsg.id;
            onLoad.call(this);
          }
        } else if(this.messages.find((msg) => msg.id == msg_id)) {
          onLoad.call(this);
        } else {
          this.$store.commit('messages/removeConversationMessages', this.peer_id);
          this.loadedUp = this.loadedDown = false;

          this.load({
            start_message_id: msg_id,
            offset: -20
          }).then(onLoad.bind(this));
        }
      },

      scrollToEnd() {
        if(this.replyHistory.length) {
          // Возвращаемся на сообщение с ответом
          this.jumpTo({
            msg_id: this.replyHistory[this.replyHistory.length-1]
          });

          this.replyHistory.pop();
        } else {
          // Переходим в самый низ диалога
          this.jumpTo({
            bottom: true,
            mark: false
          });
        }
      },

      scrollToMention() {
        const lastMention = this.peer.mentions[this.peer.mentions.length-1];

        this.lastViewedMention = this.peer.mentions.find((id) => id > this.lastViewedMention) || lastMention;

        this.jumpTo({
          msg_id: this.lastViewedMention
        });
      }
    },
    activated() {
      const list = this.$el.firstChild;

      if(this.scrollTop != null) {
        list.scrollTop = this.scrollTop;
        this.checkReadMessages(list);
      } else {
        this.checkScrolling(list);
      }
    },
    mounted() {
      this.load({
        start_message_id: -1,
        offset: -20
      }, { isFirstLoad: true }).then((items) => {
        const unreadMessages = document.querySelector('.message_unreaded_messages');
        const list = this.$el.firstChild;

        this.showEndBtn = this.canShowScrollBtn(list);

        if(unreadMessages) {
          list.scrollTop = unreadMessages.offsetTop - list.clientHeight / 2;
        }
      });

      eventBus.on('messages:closeChat', (peer_id) => {
        if(this.peer_id == peer_id) {
          this.scrollTop = this.$el.firstChild.scrollTop;
        }
      });

      eventBus.on('messages:load', (peer_id, { unlockUp, unlockDown } = {}) => {
        if(this.peer_id == peer_id) {
          if(unlockUp) this.loadedUp = false;
          if(unlockDown) this.loadedDown = false;

          this.checkScrolling(this.$el.firstChild);
        }
      });

      eventBus.on('messages:jumpTo', ({ peer_id, reply_author, ...params }) => {
        if(peer_id != this.peer_id) return;
        if(reply_author) this.replyHistory.push(reply_author);

        this.jumpTo(params);
      });

      longpoll.on('new_message', async ({ random_id }, peer_id) => {
        if(peer_id != this.peer_id) return;

        const list = this.$el.firstChild;
        const { scrollTop, clientHeight, scrollHeight } = list;

        this.checkReadMessages(list);
        await this.$nextTick();

        if(this.loadingMessages.find((msg) => msg.random_id == random_id)) {
          // Пришло мое сообщение
          this.$store.commit('messages/removeLoadingMessage', {
            peer_id: this.peer_id,
            random_id: random_id
          });

          this.jumpTo({
            bottom: true,
            mark: false
          });
        } else if(scrollTop + clientHeight == scrollHeight) {
          // Пришло сообщение, когда ты был в конце беседы
          this.jumpTo({
            bottom: true,
            mark: false
          });
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

  .im_scroll_end_btn:hover,
  .im_scroll_mention_btn:hover {
    background: #f6f8fb;
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
    background-color: #5281b9;
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
