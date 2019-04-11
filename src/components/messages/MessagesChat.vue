<template>
  <div class="chat_container">
    <ChatHeader :id="id" @close="closeChat"/>
    <div class="chat_wrap">
      <ChatList/>
      <ChatInput/>
    </div>
  </div>
</template>

<script>
  import { getLastOnlineDate } from 'js/date';

  import ChatHeader from './chat/Header.vue';
  import ChatInput from './chat/Input.vue';
  import ChatList from './chat/List.vue';

  export default {
    components: {
      ChatHeader,
      ChatInput,
      ChatList
    },
    computed: {
      id() {
        return this.$route.params.id;
      },
      peer() {
        const conversation = this.$store.state.messages.conversations[this.id];

        return conversation && conversation.peer;
      },
      owner() {
        return this.peer && this.$store.state.profiles[this.peer.owner];
      }
    },
    methods: {
      closeChat() {
        this.$router.replace('/messages');
      }
    }
  }
</script>

<style scoped>
  .chat_wrap {
    display: flex;
    flex-direction: column;
    height: calc(100% - 45px);
  }
</style>
