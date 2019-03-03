<template>
  <div class="modal">
    <modal-header :closable="false">{{ l('blocked_profile_title', data) }}</modal-header>
    <div class="modal_content blocked_profile" v-html="l('blocked_profile_content', data)"></div>
    <div class="modal_bottom">
      <button class="button right" @click="exit">{{ l('logout_account') }}</button>
      <button class="button right" @click="close" v-if="data == 1">{{ l('close_app') }}</button>
    </div>
  </div>
</template>

<script>
  const { app } = require('electron').remote;

  module.exports = {
    props: ['data'],
    methods: {
      close() {
        app.exit();
      },
      exit() {
        this.$store.commit('settings/removeUser', this.$root.user.id);
        location.reload();
      }
    }
  }
</script>
