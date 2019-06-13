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
      <Typing v-if="hasTyping" :peer_id="id"/>
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
    data() {
      return {
        loading: false,
        loaded: false,

        scrollTop: null,
        lockScroll: false
      }
    },
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
      }
    },
    methods: {
      scrollToEnd() {
        if(this.$refs.typing) this.$refs.typing.scrollIntoView(false);
      },
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
      onScroll(e) {
        if(!e.scrollHeight) return;

        this.scrollTop = e.scrollTop;
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

      longpoll.on('new_message', async (random_id) => {
        const loadingMessages = this.$store.state.messages.loadingMessages[this.id] || [];
        const { scrollTop, clientHeight, scrollHeight } = this.$el.firstChild;

        await this.$nextTick();

        if(loadingMessages.includes(random_id)) {
          this.$store.commit('messages/removeLoadingMessage', random_id);

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

  .messages_list_wrap { height: 100% }

  .messages_typing {
    display: flex;
    align-items: center;
    flex: none;
    height: 35px;
    margin: 0 20px;
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
</style>
