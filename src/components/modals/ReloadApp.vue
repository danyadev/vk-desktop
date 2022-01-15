<template>
  <div class="modal">
    <ModalHeader unclosable>{{ l('ml_reload_app_header') }}</ModalHeader>

    <div class="modal_content">
      {{ l('ml_reload_app_text') }}
    </div>

    <div class="modal_footer">
      <Button class="right" @click="reload">{{ l('ml_reload_app_button') }}</Button>
      <Button class="right" light @click="close">{{ l('later') }}</Button>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { closeModal } from 'js/modals';

import ModalHeader from './ModalHeader.vue';
import Button from '../UI/Button.vue';

const { app } = electron.remote;

export default {
  components: {
    ModalHeader,
    Button
  },

  setup() {
    function reload() {
      app.relaunch();
      app.quit();
    }

    function close() {
      closeModal('reload-app');
    }

    return {
      reload,
      close
    };
  }
};
</script>
