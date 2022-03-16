<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_delete_account_header') }}</ModalHeader>
    <div class="modal_content">{{ l('ml_delete_account_sure') }}</div>
    <div class="modal_footer">
      <Button class="right" @click="deleteAccount">{{ l('yes') }}</Button>
      <Button class="right" light @click="close">{{ l('cancel') }}</Button>
    </div>
  </div>
</template>

<script>
import { closeModal } from 'js/modals';
import store from 'js/store';

import ModalHeader from './ModalHeader.vue';
import Button from '../UI/Button.vue';

export default {
  props: ['id'],

  components: {
    ModalHeader,
    Button
  },

  setup(props) {
    function deleteAccount() {
      store.commit('users/removeUser', props.id);
      close();
    }

    function close() {
      closeModal('delete-account');
    }

    return {
      deleteAccount,
      close
    };
  }
};
</script>
