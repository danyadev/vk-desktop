<template>
  <div class="modal">
    <ModalHeader :closable="false">{{ l('ml_blocked_account_title', data) }}</ModalHeader>
    <div class="modal_content" v-html="l('ml_blocked_account_content', data)"></div>
    <div class="modal_footer">
      <button class="button right" @click="exit">{{ l('ml_blocked_account_logout') }}</button>
      <button class="button right" @click="closeApp" v-if="data == 1">{{ l('ml_blocked_account_close_app') }}</button>
    </div>
  </div>
</template>

<script>
  import { remote as electron } from 'electron';
  import { resetAppState } from 'js/store/';
  import ModalHeader from './ModalHeader.vue';

  export default {
    props: ['data'],
    components: {
      ModalHeader
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

<style scoped>
  .modal_content {
    padding: 20px;
    max-width: 450px;
  }
</style>
