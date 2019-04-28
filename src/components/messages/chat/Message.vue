<template>
  <div class="message" v-emoji="msg.text"></div>
</template>

<script>
  export default {
    props: ['msg']
  }
</script>

<style scoped>
  .message {
    margin: 20px;
  }
</style>
