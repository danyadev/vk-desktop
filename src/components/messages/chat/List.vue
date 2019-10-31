<template>
  <Scrolly class="messages_list_wrap"
           :vclass="['messages_list', { empty: !hasMessages }]"
           :lock="lockScroll"
           @scroll="onScroll"
  >
    <div v-if="hasMessages" class="messages_empty_block"></div>
    <div v-if="loading" class="loading"></div>

    <Message v-for="msg of messages" :key="msg.id" :msg="msg" :peer_id="id" :list="messages"/>

    <div v-if="!hasMessages && !loading" class="messages_empty_dialog">
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
  import { fields, concatProfiles, endScroll } from 'js/utils';
  import { parseMessage } from 'js/messages';
  import longpoll from 'js/longpoll';

  import Scrolly from '../../UI/Scrolly.vue';
  import Message from './Message.vue';
  import Typing from '../Typing.vue';

  export default {
    props: ['id'],
    components: {
      Scrolly,
      Message,
      Typing
    },
    data: () => ({
      loading: false,
      loaded: false,

      scrollTop: null,
      lockScroll: false,

      showEndBtn: false,
      showTopTime: false
    }),
    computed: {
      messages() {
        return this.$store.state.messages.messages[this.id] || [];
      },
      hasMessages() {
        return this.messages.length;
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
      async load() {
        this.loading = true;

        const hasMessages = this.hasMessages;
        const { items, profiles, groups } = await vkapi('messages.getHistory', {
          peer_id: this.id,
          offset: this.messages.length,
          extended: 1,
          fields: fields
        });

        this.lockScroll = true;

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));
        this.$store.commit('messages/addMessages', {
          peer_id: this.id,
          messages: items.map(parseMessage).reverse()
        });

        const messagesList = this.$el.firstChild;
        const { scrollTop, scrollHeight } = messagesList;

        await this.$nextTick();
        setTimeout(() => this.lockScroll = false, 0);

        if(!hasMessages) {
          this.scrollToEnd();
        } else {
          // Отнимаем от общей текущей высоты скролла прошлую высоту
          // и прибавляем прошлый остаток до вершины скролла
          // чтобы при добавлении контента остаться на своем месте
          messagesList.scrollTop = messagesList.scrollHeight - scrollHeight + scrollTop;
        }

        this.loading = false;
        if(items.length < 20) this.loaded = true;
      },

      scrollToEnd() {
        if(this.$refs.typing) {
          this.showEndBtn = false;
          this.$refs.typing.scrollIntoView(false);
        }
      },

      onScroll(e) {
        if(!e.scrollHeight) return;

        const isBottom = e.scrollTop + e.offsetHeight + 250 >= e.scrollHeight;

        this.scrollTop = e.scrollTop;
        this.showEndBtn = !isBottom && e.dy > 0;

        this.checkScrolling(e);
      },

      checkScrolling: endScroll(function() {
        if(!this.loading && !this.loaded) {
          this.loading = true;
          this.load();
        }
      }, true)
    },
    activated() {
      if(this.scrollTop != null) {
        this.$el.firstChild.scrollTop = this.scrollTop;
      } else {
        this.scrollToEnd();
        this.checkScrolling(this.$el.firstChild);
      }
    },
    async mounted() {
      if(!this.messages.length) {
        this.load();
      } else {
        await this.$nextTick();

        this.scrollToEnd();
        this.checkScrolling(this.$el.firstChild);
      }

      longpoll.on('new_message', async ({ random_id }, peer_id) => {
        if(peer_id != this.id) return;

        const { scrollTop, clientHeight, scrollHeight } = this.$el.firstChild;

        await this.$nextTick();

        if(this.loadingMessages.find((msg) => msg.random_id == random_id)) {
          this.$store.commit('messages/removeLoadingMessage', {
            peer_id: this.id,
            random_id: random_id
          });

          this.scrollToEnd();
        } else if(scrollTop + clientHeight == scrollHeight) {
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
