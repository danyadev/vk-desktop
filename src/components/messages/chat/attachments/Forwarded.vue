<template>
  <div v-if="msg.fwdCount" class="attach_unknown">
    (forwarded)
  </div>
</template>

<script>
  export default {
    props: ['msg']
  }
</script>

<style scoped>
  .attach_unknown {
    color: #696969;
  }
</style>
