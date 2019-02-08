<template>
  <div class="modal">
    <modal-header :closable="closable">{{ l('delete_history_header') }}</modal-header>
    <div class="modal_content multiaccount_confirm">
      <span v-if="closable" v-html="l('delete_history_text')"></span>
      <div v-else class="loading"></div>
    </div>
    <div class="modal_bottom">
      <button v-if="closable" class="button right" type="button" @click="confirm">OK</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    data: () => ({
      closable: true
    }),
    methods: {
      async confirm() {
        this.closable = false;

        await vkapi('messages.deleteConversation', {
          peer_id: this.data
        });

        this.$modals.close(this.$attrs['data-key']);
      }
    }
  }
</script>
