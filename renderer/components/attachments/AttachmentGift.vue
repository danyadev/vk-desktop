<template>
  <div class="message_attach attach_gift">
    <img :src="url">
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    data() {
      return {
        url: this.data.thumb_256
      }
    }
  }
</script>
