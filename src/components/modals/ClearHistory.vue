<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_clear_history_header') }}</ModalHeader>
    <div class="modal_content">{{ l('ml_clear_history_text') }}</div>
    <div class="modal_footer">
      <Button class="right" @click="clear">{{ l('yes') }}</Button>
      <Button class="right" light @click="close">{{ l('cancel') }}</Button>
    </div>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';

  import ModalHeader from './ModalHeader.vue';
  import Button from '../UI/Button.vue';

  export default {
    props: ['peer_id'],

    components: {
      ModalHeader,
      Button
    },

    methods: {
      clear() {
        vkapi('messages.deleteConversation', {
          peer_id: this.peer_id
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
