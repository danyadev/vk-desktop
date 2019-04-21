<template>
  <div :class="['messages_container', { hasChat }]" @keydown.esc="closeChat" tabindex="0">
    <MessagesPeers/>
    <keep-alive><router-view :key="$route.params.id"/></keep-alive>
  </div>
</template>

<script>
  import MessagesPeers from './MessagesPeers.vue';

  export default {
    components: { MessagesPeers },
    computed: {
      hasChat() {
        return this.$route.name == 'chat';
      }
    },
    methods: {
      closeChat() {
        if(this.hasChat) this.$router.replace('/messages');
      }
    }
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

    .messages_container:not(.hasChat) .chat_container { display: none }
    .messages_container.hasChat .chat_container { width: 100% }

    .messages_container.hasChat .peers_container { display: none }
    .messages_container.hasChat .header_back { display: block }
  }

  @media screen and (min-width: 650px) and (max-width: 899px) {
    .peers_container { width: 43% }
    .chat_container { width: 57% }
  }

  @media screen and (min-width: 900px) {
    .peers_container { width: 387px }
    .chat_container { width: calc(100% - 387px) }
  }
</style>
