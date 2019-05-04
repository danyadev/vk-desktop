<template>
  <div class="modal">
    <ModalHeader :closable="false">{{ l('modal_blocked_account_titles', data) }}</ModalHeader>
    <div class="modal_content" v-html="l('modal_blocked_account_contents', data)"></div>
    <div class="modal_footer">
      <button class="button right" @click="exit">{{ l('modal_blocked_account_logout') }}</button>
      <button class="button right" @click="closeApp" v-if="data == 1">{{ l('modal_blocked_account_close_app') }}</button>
    </div>
  </div>
</template>

<script>
  import { remote as electron } from 'electron';
  import { resetAppState } from 'js/store/';
  import ModalHeader from './ModalHeader.vue';

  const { app } = electron;

  export default {
    props: {
      data: {
        required: true,
        type: Number
      }
    },
    components: { ModalHeader },
    methods: {
      closeApp() {
        app.exit();
      },
      exit() {
        const { activeUser } = this.$store.state.users;

        this.$store.commit('users/setActiveUser', null);
        this.$store.commit('users/removeUser', activeUser);

        this.$modal.close(this.$attrs.name);
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
