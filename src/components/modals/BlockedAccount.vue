<template>
  <div class="modal">
    <ModalHeader unclosable>{{ l('ml_blocked_account_title', id) }}</ModalHeader>
    <div class="modal_content" v-html="l('ml_blocked_account_content', id)"></div>
    <div class="modal_footer">
      <Button v-if="fromAuth" right @click="close">{{ l('close') }}</Button>
      <template v-else>
        <Button class="right" @click="logout">{{ l('logout_account') }}</Button>
        <Button v-if="id === 1" class="right" @click="closeApp">
          {{ l('ml_blocked_account_close_app') }}
        </Button>
      </template>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { logout } from 'js/utils';
import { closeModal } from 'js/modals';

import ModalHeader from './ModalHeader.vue';
import Button from '../UI/Button.vue';

export default {
  props: ['id', 'fromAuth'],

  components: {
    ModalHeader,
    Button
  },

  setup() {
    function closeApp() {
      electron.remote.app.exit();
    }

    function close() {
      closeModal('blocked-account');
    }

    return {
      logout,
      closeApp,
      close
    };
  }
};
</script>

<style>
.modal[data-name=blocked-account] .modal_content {
  padding: 20px;
  max-width: 450px;
}
</style>
