<template>
  <div class="modal_header">
    <div class="modal_header_title"><slot></slot></div>
    <div v-if="closable" @click.stop="close" class="modal_header_close"></div>
  </div>
</template>

<script>
  module.exports = {
    props: {
      closable: {
        type: Boolean,
        default: true
      }
    },
    methods: {
      close() {
        this.$modals.close(this.$parent.$attrs.name);
      }
    }
  }
</script>
