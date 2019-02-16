<template>
  <attachment-default :data="text"/>
</template>

<script>
  module.exports = {
    props: ['data'],
    data() {
      return {
        text: this.l('fwd_msg', [this.data.length], this.data.length)
      }
    }
  }
</script>
