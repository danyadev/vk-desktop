<template>
  <div class="modal">
    <ModalHeader unclosable>{{ l('ml_blocked_account_title', type) }}</ModalHeader>
    <div class="modal_content" v-html="l('ml_blocked_account_content', type)"></div>
    <div class="modal_footer">
      <Button v-if="fromAuth" right @click="closeModal">{{ l('close') }}</Button>
      <template v-else>
        <Button class="right" @click="logout">{{ l('logout_account') }}</Button>
        <Button v-if="type === 1" class="right" @click="closeApp">
          {{ l('ml_blocked_account_close_app') }}
        </Button>
      </template>
    </div>
  </div>
</template>

<script>
import remoteElectron from '@electron/remote';
import { closeModal } from 'js/modals';
import store from 'js/store';

import ModalHeader from './ModalHeader.vue';
import Button from '../UI/Button.vue';

export default {
  // type:
  // 0 - Сессия завершена
  // 1 - Страница удалена
  // 2 - Страница заблокирована
  props: ['type', 'fromAuth'],

  components: {
    ModalHeader,
    Button
  },

  setup: (props) => ({
    closeModal() {
      closeModal('blocked-account');
    },

    closeApp() {
      remoteElectron.app.quit();
    },

    logout() {
      const needRemoveUser = props.type === 0;
      store.dispatch('users/logout', needRemoveUser);
    }
  })
};
</script>

<style>
.modal[data-name=blocked-account] .modal_content {
  max-width: 500px;
}
</style>
