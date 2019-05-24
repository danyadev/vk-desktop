<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_auth_header') }}</ModalHeader>
    <div class="modal_content">
      <Auth :isModal="true"/>
    </div>
  </div>
</template>

<script>
  import ModalHeader from './ModalHeader.vue';
  import Auth from '../auth/Auth.vue';

  export default {
    components: {
      ModalHeader,
      Auth
    }
  }
</script>

<style scoped>
  .modal_content { padding: 25px }
</style>
