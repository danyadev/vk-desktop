<template>
  <div class="messages_container" tabindex="-1">
    <MessagesPeers />
    <RouterView />
  </div>
</template>

<script>
import MessagesPeers from './MessagesPeers.vue';

export default {
  components: {
    MessagesPeers
  }
}
</script>

<style>
.messages_container {
  display: flex;
  height: 100%;
}

@media screen and (max-width: 649px) {
  .im_peers_container { width: 100% }
  .im_peers_wrap { border-right: none }

  .messages_container:not(.hasChat) .im_chat_container { display: none }
  .messages_container.hasChat .im_chat_container { width: 100% }

  .messages_container.hasChat .im_peers_container { display: none }
  .messages_container.hasChat .im_header_back { display: block }
}

@media screen and (min-width: 650px) and (max-width: 899px) {
  .im_peers_container { width: 42% }
  .im_chat_container { width: 58% }
}

@media screen and (min-width: 900px) {
  .im_peers_container { width: 378px }
  .im_chat_container { width: calc(100% - 378px) }
}
</style>
