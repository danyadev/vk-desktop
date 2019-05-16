<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_logout_header') }}</ModalHeader>
    <div class="modal_content">{{ l('ml_logout_sure') }}</div>
    <div class="modal_footer">
      <button class="button right" @click="logout">{{ l('yes') }}</button>
      <button class="light_button right" @click="closeModal">{{ l('cancel') }}</button>
    </div>
  </div>
</template>

<script>
  import { resetAppState } from 'js/store/';
  import ModalHeader from './ModalHeader.vue';

  export default {
    components: {
      ModalHeader
    },
    methods: {
      logout() {
        const { activeUser } = this.$store.state.users;

        this.$store.commit('users/setActiveUser', null);
        this.$store.commit('users/removeUser', activeUser);

        this.closeModal();
        resetAppState();
      },
      closeModal() {
        this.$modals.close(this.$attrs.name);
      }
    }
  }
</script>

<style scoped>
  .modal_content { padding: 25px }
</style>
