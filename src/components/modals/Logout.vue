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
  import { logout } from 'js/utils';

  import ModalHeader from './ModalHeader.vue';
  import Button from '../UI/Button.vue';

  export default {
    components: {
      ModalHeader,
      Button
    },

    methods: {
      logout,

      closeModal() {
        this.$modals.close(this.$attrs.name);
      }
    }
  }
</script>

<style>
  .modal[name=logout] .modal_content { padding: 25px }
</style>
