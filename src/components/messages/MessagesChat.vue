<template>
  <div class="chat_container">
    <ChatHeader :id="$route.params.id" @close="closeChat"/>
    <div class="chat_wrap">
      <ChatList/>
      <ChatInput/>
    </div>
  </div>
</template>

<script>
  import ChatHeader from './chat/Header.vue';
  import ChatInput from './chat/Input.vue';
  import ChatList from './chat/List.vue';

  export default {
    components: {
      ChatHeader,
      ChatInput,
      ChatList
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
