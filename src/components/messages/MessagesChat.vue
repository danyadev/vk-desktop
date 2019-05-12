<template>
  <div class="chat_container">
    <ChatHeader :id="id" :peer="peer" @close="closeChat"/>
    <div class="chat_wrap">
      <ChatList :id="id"/>
      <ChatInput :peer="peer"/>
    </div>
  </div>
</template>

<script>
  import { loadConversation } from 'js/utils';
  
  import ChatHeader from './chat/Header.vue';
  import ChatList from './chat/List.vue';
  import ChatInput from './chat/Input.vue';

  export default {
    components: {
      ChatHeader,
      ChatList,
      ChatInput
    },
    data() {
      return {
        id: this.$route.params.id
      };
    },
    computed: {
      peer() {
        const conversation = this.$store.state.messages.conversations[this.id];

        return conversation && conversation.peer;
      }
    },
    methods: {
      closeChat() {
        this.$router.replace('/messages');
      }
    },
    mounted() {
      if(!this.peer) loadConversation(this.id);
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
