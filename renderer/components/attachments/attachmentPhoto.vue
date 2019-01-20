<template>
  <div class="message_attach attach_photo">
    <img :src="url">
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    data() {
      let type = this.data.isServiceMsg ? 'm' : 'x';

      return {
        url: this.data.sizes.find((size) => size.type == type).url
      }
    }
  }
</script>
