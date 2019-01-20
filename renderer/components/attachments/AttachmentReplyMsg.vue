<template>
  <attachment-default :data="text"/>
</template>

<script>
  module.exports = {
    props: ['data'],
    data() {
      return {
        text: this.l('reply_msg')
      }
    }
  }
</script>
