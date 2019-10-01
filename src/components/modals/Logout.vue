<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_logout_header') }}</ModalHeader>
    <div class="modal_content">{{ l('ml_logout_sure') }}</div>
    <div class="modal_footer">
      <Button class="right" @click="logout">{{ l('yes') }}</Button>
      <Button class="right" light @click="closeModal">{{ l('cancel') }}</Button>
    </div>
  </div>
</template>

<script>
  import { clearUserSession } from 'js/utils';

  import ModalHeader from './ModalHeader.vue';
  import Button from '../UI/Button.vue';

  export default {
    components: {
      ModalHeader,
      Button
    },
    methods: {
      logout() {
        const { activeUser } = this.$store.state.users;

        this.$store.commit('users/setActiveUser', null);
        this.$store.commit('users/removeUser', activeUser);

        this.closeModal();
        clearUserSession();
      },
      closeModal() {
        this.$modals.close(this.$attrs.name);
      }
    }
  }
</script>

<style>
  .modal[name=logout] .modal_content { padding: 25px }
</style>
