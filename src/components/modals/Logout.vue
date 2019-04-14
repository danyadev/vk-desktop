<template>
  <div class="modal">
    <ModalHeader>{{ l('modal_logout_header') }}</ModalHeader>
    <div class="modal_content">{{ l('modal_logout_sure') }}</div>
    <div class="modal_footer">
      <button class="button right" @click="logout">{{ l('yes') }}</button>
      <button class="light_button right" @click="closeModal">{{ l('cancel') }}</button>
    </div>
  </div>
</template>

<script>
  import ModalHeader from './ModalHeader.vue';
  import { resetAppState } from 'js/store/';

  export default {
    components: { ModalHeader },
    methods: {
      logout() {
        let { activeUser } = this.$store.state.users;

        this.$store.commit('users/setActiveUser', null);
        this.$store.commit('users/removeUser', activeUser);

        this.closeModal();
        resetAppState();
      },
      closeModal() {
        this.$modal.close(this.$attrs.name);
      }
    }
  }
</script>

<style scoped>
  .modal_content { padding: 25px }
</style>
