<template>
  <div class="messages_container" :class="{ active_chat: id, hideDialogs: $store.state.settings.hiddenDialogs }">
    <conversations></conversations>
    <keep-alive>
      <chat v-if="id" :key="id"></chat>
      <chat-empty v-else></chat-empty>
    </keep-alive>
  </div>
</template>

<script>
  module.exports = {
    computed: {
      id() {
        return this.$store.state.activeChat;
      }
    }
  }
</script>
