<template>
  <div class="modal">
    <modal-header>{{ l('multiaccount_header') }}</modal-header>
    <div class="modal_content multiaccount_confirm" v-html="l('multiaccount_confirm_set_acc')"></div>
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
      }
    }
  }
</script>
