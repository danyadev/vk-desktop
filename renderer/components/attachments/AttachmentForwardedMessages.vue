<template>
  <attachment-default :data="text"/>
</template>

<script>
  module.exports = {
    props: ['data'],
    data() {
      let count = other.getWordEnding(this.data.length);
      return {
        text: this.l('fwd_msg', count, [this.data.length])
      }
    }
  }
</script>
