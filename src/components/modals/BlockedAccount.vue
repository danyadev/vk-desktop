<template>
  <div class="modal">
    <ModalHeader :closable="false">{{ l('ml_blocked_account_title', id) }}</ModalHeader>
    <div class="modal_content" v-html="l('ml_blocked_account_content', id)"></div>
    <div class="modal_footer">
      <Button class="right" @click="logout">{{ l('ml_blocked_account_logout') }}</Button>
      <Button v-if="id == 1" class="right" @click="closeApp">
        {{ l('ml_blocked_account_close_app') }}
      </Button>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { logout } from 'js/utils';

import ModalHeader from './ModalHeader.vue';
import Button from '../UI/Button.vue';

export default {
  props: ['id'],

  components: {
    ModalHeader,
    Button
  },

  methods: {
    logout,

    closeApp() {
      electron.remote.app.exit();
    }
  }
};
</script>

<style>
.modal[data-name=blocked-account] .modal_content {
  padding: 20px;
  max-width: 450px;
}
</style>
