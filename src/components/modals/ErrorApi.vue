<template>
  <div class="modal">
    <ModalHeader unclosable>{{ l('ml_error_api_header') }}</ModalHeader>
    <div class="modal_content">
      {{ l('ml_error_api', [method]) }}

      <div class="ml_error_warn">
        {{ l('ml_error_cancel_warn') }}
      </div>

      {{ error.error_msg }}
    </div>
    <div class="modal_footer">
      <Button class="right" @click="cancel">{{ l('cancel') }}</Button>
      <Button class="right" @click="retryCall">{{ l('retry') }}</Button>
    </div>
  </div>
</template>

<script>
import { closeModal } from 'js/modals';

import ModalHeader from './ModalHeader.vue';
import Button from '@/UI/Button.vue';

export default {
  props: ['method', 'error', 'retry'],

  components: {
    ModalHeader,
    Button
  },

  setup(props) {
    function cancel() {
      props.retry(props.error);
      closeModal('error-api');
    }

    function retryCall() {
      props.retry();
      closeModal('error-api');
    }

    return {
      cancel,
      retryCall
    };
  }
};
</script>

<style>
.modal[data-name=error-api] .modal_content {
  max-width: 480px;
  word-break: break-word;
}

.ml_error_warn {
  margin: 15px 0;
  font-weight: 500;
}
</style>
