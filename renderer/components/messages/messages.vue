<template>
  <div class="messages_container"
       :class="{ active_chat: !!$store.state.activeChat, hideDialogs: $store.state.settings.hiddenDialogs }">
    <conversations></conversations>
    <chat></chat>
  </div>
</template>
