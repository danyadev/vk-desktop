<template>
  <div class="messages_container" :class="{ active_chat: !!$store.state.activeChat }">
    <conversations></conversations>
    <chat></chat>
  </div>
</template>
