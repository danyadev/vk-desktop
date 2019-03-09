<template>
  <div class="messages_container" :class="{ hasChat: !!chat, hiddenDialogs }">
    <conversations></conversations>
    <keep-alive>
      <chat v-if="chat" :key="chat"></chat>
      <chat-empty v-else></chat-empty>
    </keep-alive>
  </div>
</template>

<script>
  const { mapState } = Vuex;

  module.exports = {
    computed: {
      ...mapState('messages', ['chat']),
      ...mapState('settings', ['hiddenDialogs'])
    }
  }
</script>
