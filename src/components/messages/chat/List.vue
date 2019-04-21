<template>
  <Scrolly class="messages_list">

  </Scrolly>
</template>

<script>
  import Scrolly from 'vue-scrolly';
  import Message from './Message.vue';

  export default {
    components: {
      Scrolly,
      Message
    }
  }
</script>

<style scoped>
  .messages_list {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>
