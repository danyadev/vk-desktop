<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_auth_header') }}</ModalHeader>
    <div class="modal_content">
      <Auth :isModal="true"/>
    </div>
  </div>
</template>

<script>
  import Auth from '../auth/Auth.vue';
  import ModalHeader from './ModalHeader.vue';

  export default {
    components: {
      Auth,
      ModalHeader
    }
  }
</script>

<style scoped>
  .modal_content { padding: 25px }
</style>
