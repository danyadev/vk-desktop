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
import { closeModal } from 'js/modals';
import vkapi from 'js/vkapi';

import ModalHeader from './ModalHeader.vue';
import Button from '@/UI/Button.vue';

export default {
  props: ['peer_id'],

  components: {
    ModalHeader,
    Button
  },

  setup(props) {
    function clear() {
      vkapi('messages.deleteConversation', {
        peer_id: props.peer_id
      }).then(close);
    }

    function close() {
      closeModal('clear-history');
    }

    return {
      clear,
      close
    };
  }
};
</script>
