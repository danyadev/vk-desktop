<template>
  <div class="modal">
    <modal-header>{{ data.title }}</modal-header>
    <div class="modal_content error">{{ data.text }}</div>
    <div class="modal_bottom">
      <button type="button" class="button right" @click="close">OK</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: {
      data: {
        type: Object,
        required: true
      }
    },
    methods: {
      close() {
        this.$modals.close();
      }
    }
  }
</script>
