<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_clear_history_header') }}</ModalHeader>
    <div class="modal_content">{{ l('ml_clear_history_text') }}</div>
    <div class="modal_footer">
      <button class="button right" @click="clear">{{ l('yes') }}</button>
      <button class="light_button right" @click="close">{{ l('cancel') }}</button>
    </div>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';
  import ModalHeader from './ModalHeader.vue';

  export default {
    props: ['data'],
    components: {
      ModalHeader
    },
    methods: {
      clear() {
        vkapi('messages.deleteConversation', {
          peer_id: this.data.peer_id
        }).then(this.close);
      },
      close() {
        this.$modals.close(this.$attrs.name);
      }
    }
  }
</script>

<style>
  .modal[name="clear-history"] .modal_content { padding: 25px }
</style>
