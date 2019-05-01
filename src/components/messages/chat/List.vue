<template>
  <Scrolly class="messages_list_wrap" :vclass="['messages_list', { empty: !hasMessages }]">
    <div v-if="hasMessages" class="messages_empty_block"></div>
    <div v-if="loading" class="loading"></div>

    <div v-if="!hasMessages && !loading" class="messages_empty_dialog">
      <img src="~assets/placeholder_empty_messages.png">
      {{ l('im_empty_dialog') }}
    </div>

    <Message v-for="msg of messages" :key="msg.id" :msg="msg" :id="id"/>
  </Scrolly>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { fields, concatProfiles, endScroll } from 'js/utils';
  import { parseConversation, parseMessage } from 'js/messages';

  import Scrolly from 'vue-scrolly';
  import Message from './Message.vue';

  export default {
    props: ['id'],
    components: {
      Scrolly,
      Message
    },
    data() {
      return {
        isChat: this.id > 2e9,
        loading: false,
        loaded: false
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
      async load() {
        this.loading = true;

        const { items, conversations, profiles, groups } = await vkapi('messages.getHistory', {
          peer_id: this.id,
          offset: 0,
          extended: 1,
          fields: fields,
          count: 50
        });

        const conversation = parseConversation(conversations[0]);

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));

        for(let item of items) {
          const msg = parseMessage(item, conversation);

          this.$store.commit('messages/addMessage', {
            peer_id: this.id,
            msg: msg
          });
        }

        this.loading = false;
      }
    },
    mounted() {
      this.load();
    },
    activated() {
      // Обновление данных юзера при каждом открытии чата
      if(!this.isChat && this.id > 0) {
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

  .messages_list.empty {
    display: flex;
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
  }

  .messages_empty_dialog img {
    height: 160px;
  }
</style>
