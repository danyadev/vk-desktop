<template>
  <div class="messages_container">
    <MessagesPeers/>
  </div>
</template>

<script>
  import MessagesPeers from './MessagesPeers.vue';

  export default {
    components: { MessagesPeers }
  }
</script>

<style>
  .messages_container {
    display: flex;
    height: 100%;
  }

  @media screen and (max-width: 649px) {
    .peers_container { width: 100% }
    .peers_wrap { border-right: none }
    .messages_container.hasChat .peers_container { display: none }
  }

  @media screen and (min-width: 650px) and (max-width: 899px) {
    .peers_container { width: 43% }
  }

  @media screen and (min-width: 900px) {
    .peers_container { width: 387px }
  }
</style>
