<template>
  <img class="message_attach attach_sticker" :src="src">
</template>

<script>
  module.exports = {
    props: ['data'],
    computed: {
      src() {
        let index = devicePixelRatio >= 2 ? 2 : 1;
        return this.data.images[index].url;
      }
    }
  }
</script>
