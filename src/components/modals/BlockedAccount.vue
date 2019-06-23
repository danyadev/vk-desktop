<template>
  <div class="modal">
    <ModalHeader :closable="false">{{ l('ml_blocked_account_title', data) }}</ModalHeader>
    <div class="modal_content" v-html="l('ml_blocked_account_content', data)"></div>
    <div class="modal_footer">
      <Button class="right" @click="exit">{{ l('ml_blocked_account_logout') }}</Button>
      <Button v-if="data == 1" class="right" @click="closeApp">{{ l('ml_blocked_account_close_app') }}</Button>
    </div>
  </div>
</template>

<script>
  import { remote as electron } from 'electron';
  import { resetAppState } from 'js/store/';

  import ModalHeader from './ModalHeader.vue';
  import Button from '../UI/Button.vue';

  export default {
    props: ['data'],
    components: {
      ModalHeader,
      Button
    },
    methods: {
      closeApp() {
        electron.app.exit();
      },
      exit() {
        const { activeUser } = this.$store.state.users;

        this.$store.commit('users/setActiveUser', null);
        this.$store.commit('users/removeUser', activeUser);

        this.$modals.close(this.$attrs.name);
        resetAppState();
      }
    }
  }
</script>

<style>
  .modal[name=blocked-account] .modal_content {
    padding: 20px;
    max-width: 450px;
  }
</style>
