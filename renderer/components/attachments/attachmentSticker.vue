<template>
  <img class="message_attach attach_sticker" :src="data.images[1].url">
</template>

<script>
  module.exports = {
    props: ['data']
  }
</script>
