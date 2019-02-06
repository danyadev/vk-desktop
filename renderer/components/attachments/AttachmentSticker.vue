<template>
  <img class="message_attach attach_sticker" :src="data.images[devicePixelRatio >= 2 ? 2 : 1].url">
</template>

<script>
  module.exports = {
    props: ['data']
  }
</script>
