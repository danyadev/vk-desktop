<template>
  <div class="modal">
    <modal-header>{{ l('delete_history_header') }}</modal-header>
    <div class="modal_content multiaccount_confirm" v-html="l('delete_history_text')"></div>
    <div class="modal_bottom">
      <button type="button" class="button right" @click="confirm">OK</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    methods: {
      confirm() {
        this.data.confirm();
        this.$modals.close(this.$attrs['data-key']);
      }
    }
  }
</script>
