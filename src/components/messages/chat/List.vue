<template>
  <Scrolly class="messages_list_wrap" :vclass="['messages_list', { empty: !hasMessages }]" @scroll="onScroll">
    <div v-if="hasMessages" class="messages_empty_block"></div>
    <div v-if="loading" class="loading"></div>

    <div v-if="!hasMessages && !loading" class="messages_empty_dialog">
      <img src="~assets/placeholder_empty_messages.png">
      {{ l('im_empty_dialog') }}
    </div>

    <Message v-for="msg of messages" :key="msg.id" :msg="msg" :peer_id="id" :list="messages"/>
  </Scrolly>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { fields, concatProfiles, endScroll } from 'js/utils';
  import { parseConversation, parseMessage } from 'js/messages';
  import Scrolly from '../../UI/Scrolly.vue';
  import Message from './Message.vue';

  export default {
    props: ['id'],
    components: {
      Scrolly,
      Message
    },
    data() {
      return {
        loading: false,
        loaded: false,

        scrollTop: null,
        isFirstLoad: true
      }
    },
    computed: {
      messages() {
        return this.$store.state.messages.messages[this.id] || [];
      },
      hasMessages() {
        return !!this.messages.length;
      }
    },
    methods: {
      scrollToEnd() {
        const messagesList = this.$el.firstChild;

        messagesList.scrollTop = messagesList.scrollHeight;
      },
      async load() {
        this.loading = true;

        const { items, conversations, profiles, groups } = await vkapi('messages.getHistory', {
          peer_id: this.id,
          offset: this.messages.length,
          extended: 1,
          fields: fields
        });

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));

        const conversation = parseConversation(conversations[0]);
        const messages = [];

        for(let item of items) {
          messages.push(parseMessage(item, conversation));
        }

        this.$store.commit('messages/addMessages', {
          peer_id: this.id,
          messages: messages
        });

        const messagesList = this.$el.firstChild;
        const { scrollTop, scrollHeight } = messagesList;

        this.$nextTick().then(() => {
          if(this.isFirstLoad) {
            this.isFirstLoad = false;
            this.scrollToEnd();
          } else {
            // Отнимаем от общей текущей высоты скролла прошлую высоту
            // и прибавляем прошлый остаток до вершины скролла
            // чтобы при добавлении контента остаться на своем месте
            messagesList.scrollTop = messagesList.scrollHeight - scrollHeight + scrollTop;
          }

          this.loading = false;
          if(items.length < 20) this.loaded = true;
        });
      },
      onScroll(e) {
        this.scrollTop = this.$el.firstChild.scrollTop;

        this.checkScrolling(e);
      },
      checkScrolling: endScroll(function() {
        if(!this.loading && !this.loaded) {
          this.loading = true;
          this.load();
        }
      }, true)
    },
    mounted() {
      this.load();
    },
    activated() {
      if(this.scrollTop != null) {
        const messagesList = this.$el.firstChild;

        messagesList.scrollTop = this.scrollTop;
      } else this.scrollToEnd();

      // Обновление данных юзера при каждом открытии чата
      if(this.id > 0 && this.id < 2e9) {
        // *Получить юзера и обработать данные*
      }
    }
  }
</script>

<style>
  .messages_list_wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .messages_list {
    display: flex;
    flex-direction: column;
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
    color: #282829;
  }

  .messages_empty_dialog img {
    height: 160px;
  }
</style>
