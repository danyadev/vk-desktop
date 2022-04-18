<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_mark_as_spam_header') }}</ModalHeader>

    <div class="modal_content">
      {{ l('ml_mark_as_spam_text', [l('im_messages_count', [count], count)]) }}
    </div>

    <div class="modal_footer">
      <Button class="right" @click="markAsSpam">{{ l('spam') }}</Button>
      <Button class="right" light @click="close">{{ l('cancel') }}</Button>
    </div>
  </div>
</template>

<script>
import { closeModal } from 'js/modals';

import ModalHeader from './ModalHeader.vue';
import Button from '@/UI/Button.vue';

export default {
  props: ['count', 'submit'],

  components: {
    ModalHeader,
    Button
  },

  setup(props) {
    function markAsSpam() {
      props.submit();
      close();
    }

    function close() {
      closeModal('mark-as-spam');
    }

    return {
      markAsSpam,
      close
    };
  }
};
</script>
