<template>
  <div class="modal">
    <modal-header>{{ l('logout_account') }}</modal-header>
    <div class="modal_content logout">{{ l('logout_sure') }}</div>
    <div class="modal_bottom">
      <button type="button" class="button right" @click="logout">{{ l('yes') }}</button>
      <button type="button" class="light_button right" @click="closeModal">{{ l('cancel') }}</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    methods: {
      logout() {
        let { activeUser } = this.$store.state.settings;

        this.$store.commit('settings/setActiveUser', null);
        this.$store.commit('settings/removeUser', activeUser);
        this.$store.dispatch('settings/clear');

        getCurrentWindow().reload();
      },
      closeModal() {
        this.$modals.close(this.$attrs['data-key']);
      }
    }
  }
</script>
