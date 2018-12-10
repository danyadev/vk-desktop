<template>
  <div class="modal_header">
    <div class="modal_header_title"><slot></slot></div>
    <div v-if="closable" @click="close" class="modal_header_close"></div>
  </div>
</template>

<script>
  module.exports = {
    props: {
      closable: { default: true }
    },
    methods: {
      close() {
        this.$modals.close();
      }
    }
  }
</script>
