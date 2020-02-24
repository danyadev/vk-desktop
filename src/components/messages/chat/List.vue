<template>
  <Scrolly class="messages_list_wrap"
           :vclass="['messages_list', { empty: !hasMessages }]"
           :lock="lockScroll"
           @scroll="onScroll"
           ref="scrolly"
  >
    <div :class="['im_top_time', { active: showTopTime }]">{{ topTime }}</div>
    <div v-if="hasMessages" class="messages_empty_block"></div>
    <div v-if="loadingUp" class="loading"></div>

    <MessagesList :peer_id="peer_id" :peer="peer"
                  :list="messagesWithLoading"
                  :showStartUnread="showStartUnread"
                  :startInRead="startInRead"
    />

    <div v-if="loadingDown" class="loading"></div>

    <div v-if="!hasMessages && !loadingUp && !loadingDown" class="messages_empty_dialog">
      <img src="~assets/placeholder_empty_messages.webp">
      {{ l('im_empty_dialog') }}
    </div>

    <div :class="['im_scroll_mention_btn', { hidden: !showEndBtn || !peer || !peer.mentions.length }]" @click="scrollToMention">
      <div>{{ peer && peer.mentions.length }}</div>
      <Icon name="mention" color="#828a99" width="24" height="30" />
    </div>

    <div :class="['im_scroll_end_btn', { hidden: !showEndBtn }]" @click="scrollToEnd">
      <div>{{ peer && convertCount(peer.unread) || '' }}</div>
      <img src="~assets/dropdown.webp">
    </div>
  </Scrolly>
</template>

<script>
  import {
    fields,
    concatProfiles,
    endScroll,
    eventBus,
    callWithDelay,
    timer,
    debounce,
    convertCount,
    createQueueManager
  } from 'js/utils';
  import { parseMessage, parseConversation } from 'js/messages';
  import vkapi from 'js/vkapi';
  import electron from 'electron';

  import Scrolly from '../../UI/Scrolly.vue';
  import Icon from '../../UI/Icon.vue';
  import MessagesList from './MessagesList.vue';

  function isFocused() {
    return electron.remote.getCurrentWindow().isFocused();
  }

  export default {
    props: ['peer_id', 'peer'],

    components: {
      Scrolly,
      Icon,
      MessagesList
    },

    data: () => ({
      loadingUp: false,
      loadingDown: false,
      loadedUp: false,
      loadedDown: false,

      scrollTop: null,
      lockScroll: false,

      showEndBtn: false,
      showTopTime: false,

      topTime: null,
      lastReadedMsg: null,
      lastViewedMention: null,
      replyHistory: [],

      hasOldUnread: false,
      startInRead: 0,
      showStartUnread: true
    }),

    computed: {
      messages() {
        return this.$store.state.messages.messages[this.peer_id] || [];
      },
      messagesWithLoading() {
        return this.messages.concat(this.loadedDown ? this.loadingMessages : []);
      },
      loadingMessages() {
        return this.$store.state.messages.loadingMessages[this.peer_id] || [];
      },
      hasMessages() {
        return !!this.messagesWithLoading.length;
      }
    },

    methods: {
      convertCount,

      load: createQueueManager(async function(
        params = {},
        { isDown, isFirstLoad, loadedUp, loadedDown, beforeLoad } = {}
      ) {
        const setPeerLoading = (loading) => {
          this.$store.commit('messages/updatePeerConfig', {
            peer_id: this.peer_id,
            loading
          });
        }

        setPeerLoading(true);
        beforeLoad && beforeLoad();

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
          this.loadedUp = loadedUp || items.length < (isFirstLoad ? 20 : 40);
        }

        if(isDown || isFirstLoad) {
          this.loadingDown = false;
          this.loadedDown = loadedDown || !items[0] || items[0].id == peer.last_msg_id;
        }

        setPeerLoading(false);

        this.checkReadMessages(list);
        this.checkTopTime(list);

        return items;
      }),

      onScroll(list) {
        if(!list.scrollHeight) return;

        this.showEndBtn = this.canShowScrollBtn(list) && (this.peer && this.peer.unread || list.dy > 0);
        this.checkReadMessages(list);
        this.checkScrolling(list);
        this.checkTopTime(list);
      },

      afterUpdateScrollTop(list) {
        this.showEndBtn = this.canShowScrollBtn(list);
        this.$refs.scrolly.refreshScrollLayout();
        this.checkScrolling(list);
        this.checkReadMessages(list);
        this.checkTopTime(list);
      },

      canShowScrollBtn(list) {
        return !(this.loadedDown && !(list.scrollTop + list.offsetHeight + 100 < list.scrollHeight));
      },

      async checkReadMessages(list) {
        if(!this.$store.getters['settings/settings'].notRead && isFocused()) {
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

      checkTopTime(list) {
        const dates = document.querySelectorAll('.message_date');
        let value;

        for(let i = 0; i < dates.length; i++) {
          const el = dates[i];
          const nextEl = dates[i+1];

          if(el.offsetTop <= list.scrollTop && (!nextEl || nextEl.offsetTop > list.scrollTop)) {
            value = el.innerText;
            break;
          }
        }

        if(value) {
          this.topTime = value;
          this.showTopTime = true;
          this.hideTopTime();
        } else {
          // Если прописать topTime = null, то при скрытии элемента будет виден пустой элемент
          this.showTopTime = false;
        }
      },

      hideTopTime: debounce(function() {
        this.showTopTime = false;
      }, 2000),

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

      jumpTo: createQueueManager(async function({ msg_id, mark = true, top, bottom }) {
        const onLoad = async () => {
          const list = this.$el.firstChild;

          if(top) {
            list.scrollTop = 0;
            return this.afterUpdateScrollTop(list);
          }

          const msg = document.querySelector(`.messages_list [id="${msg_id}"]`);

          if(msg) {
            if(msg.clientHeight > list.clientHeight) {
              // Сообщение начинается на расстоянии 1/4 от начала экрана
              list.scrollTop = msg.offsetTop - list.clientHeight / 4;
            } else {
              // Сообщение по центру экрана
              list.scrollTop = msg.offsetTop + msg.clientHeight / 2 - list.clientHeight / 2;
            }

            this.afterUpdateScrollTop(list);

            if(mark) {
              msg.setAttribute('active', '');
              await timer(2000);
              msg.removeAttribute('active');
            }
          }
        };

        const beforeLoad = () => {
          this.$store.commit('messages/removeConversationMessages', this.peer_id);
          this.loadedUp = this.loadedDown = false;
        };

        this.showEndBtn = false;
        this.showTopTime = false;

        if(top) {
          this.replyHistory.length = 0;

          if(this.loadedUp) {
            onLoad();
          } else {
            this.load({
              start_message_id: 0,
              offset: -40
            }, {
              loadedUp: true,
              beforeLoad
            }).then(onLoad);
          }
        } else if(bottom) {
          this.replyHistory.length = 0;

          if(this.loadedDown) {
            if(msg_id) {
              onLoad();
            } else {
              const lastLoadingMsg = this.loadingMessages[this.loadingMessages.length-1];
              const lastMsg = this.messages[this.messages.length-1];

              if(lastLoadingMsg) {
                msg_id = lastLoadingMsg.id;
                onLoad();
              } else if(lastMsg) {
                msg_id = lastMsg.id;
                onLoad();
              }
            }
          } else {
            const [lastMsg] = await this.load({}, {
              isDown: true,
              loadedDown: true,
              beforeLoad
            });

            msg_id = lastMsg.id;
            onLoad();
          }
        } else if(this.messages.find((msg) => msg.id == msg_id)) {
          onLoad();
        } else {
          this.load({
            start_message_id: msg_id,
            offset: -20,
            beforeLoad
          }).then(onLoad);
        }
      }),

      async jumpToStartUnread() {
        this.$store.commit('messages/removeConversationMessages', this.peer_id);
        this.loadedUp = this.loadedDown = false;
        this.showEndBtn = false;

        await this.load({
          start_message_id: -1,
          offset: -20
        }, { isFirstLoad: true });

        const unreadMessages = document.querySelector('.message_unreaded_messages');

        if(unreadMessages) {
          const list = this.$el.firstChild;

          list.scrollTop = unreadMessages.offsetTop - list.clientHeight / 2;
          this.afterUpdateScrollTop(list);
        }
      },

      scrollToEnd() {
        if(this.replyHistory.length) {
          // Возвращаемся на сообщение с ответом
          this.jumpTo({
            msg_id: this.replyHistory.pop()
          });
        } else if(this.peer && this.peer.unread) {
          const unread = document.querySelector('.message_unreaded_messages');

          if(unread) {
            const list = this.$el.firstChild;

            if(list.offsetHeight + list.scrollTop - unread.offsetHeight / 2 < unread.offsetTop) {
              list.scrollTop = unread.offsetTop - list.clientHeight / 2;
              this.afterUpdateScrollTop(list);
            } else {
              this.jumpTo({
                bottom: true,
                mark: false
              });
            }
          } else {
            this.jumpToStartUnread();
          }
        } else {
          // Переходим в самый низ диалога
          this.jumpTo({
            bottom: true,
            mark: false
          });
        }
      },

      scrollToMention() {
        this.lastViewedMention = this.peer.mentions.find((id) => id > this.lastViewedMention)
                              || this.peer.mentions[this.peer.mentions.length-1];

        this.jumpTo({
          msg_id: this.lastViewedMention
        });
      },

      async onMessageEvent(type, { peer_id, ...data }) {
        if(peer_id != this.peer_id) return;

        const list = this.$el.firstChild;
        const { scrollTop, clientHeight, scrollHeight } = list;
        const isScrolledDown = scrollHeight && scrollTop + clientHeight == scrollHeight;

        switch(type) {
          case 'closeChat':
            this.showStartUnread = true;
            this.scrollTop = scrollTop;
            this.isScrolledDown = isScrolledDown;
            this.hasOldUnread = this.peer.last_msg_id > this.peer.in_read;
            break;

          case 'checkScrolling':
            if(data.unlockUp) this.loadedUp = false;
            if(data.unlockDown) this.loadedDown = false;
            this.checkScrolling(list);
            break;

          case 'jump':
            if(data.reply_author) this.replyHistory.push(data.reply_author);
            this.jumpTo(data);
            break;

          case 'new':
            this.checkReadMessages(list);
            await this.$nextTick();

            if(this.loadingMessages.find((msg) => msg.random_id == data.random_id)) {
              this.$store.commit('messages/removeLoadingMessage', {
                peer_id,
                random_id: data.random_id
              });
            }

            if(
              isScrolledDown && // Доскроллено до конца
              data.isFirstMsg && // Первое сообщение в списке новых сообщений, пришедших из лп
              !(this.loadingUp || this.loadingDown) && // В данный момент не загружаются новые сообщения
              isFocused() && // Окно активно
              !this.$modals.hasModals // Нет открытых модалок
            ) {
              this.jumpTo({ bottom: true, mark: false });
            }
            break;
        }
      }
    },

    mounted() {
      eventBus.on('messages:event', this.onMessageEvent);
      this.jumpToStartUnread();
    },

    activated() {
      const list = this.$el.firstChild;

      this.startInRead = this.peer && this.peer.in_read;

      if(this.scrollTop != null) {
        const unread = document.querySelector('.message_unreaded_messages');

        if(this.isScrolledDown && !this.hasOldUnread && unread) {
          list.scrollTop = this.scrollTop + list.clientHeight / 2;
        } else {
          list.scrollTop = this.scrollTop;
        }

        this.checkReadMessages(list);
      } else {
        this.checkScrolling(list);
      }
    }

    // TODO: В будущем, когда будет производиться переход на Vue 3.0
    // и будет исправлена проблема с вызовом destroyed при превышении лимита
    // компонентов у KeepAlive, добавить removeListener для messages:event.
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

  .messages_list {
    padding-bottom: 25px;
  }

  .im_top_time {
    position: absolute;
    top: 5px;
    left: 0;
    right: 0;
    width: fit-content;
    margin: 0 auto;
    z-index: 2;
    background-color: #fff;
    border: solid 1px #cfd9e1;
    border-radius: 15px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .1);
    padding: 4px 14px;
    color: #828282;
    pointer-events: none;
    opacity: 0;
    transition: opacity .4s;
  }

  .im_top_time.active {
    opacity: 1;
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
    z-index: 1;
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
