<template>
  <div class="modal">
    <ModalHeader>{{ l('modal_auth_header') }}</ModalHeader>
    <div class="modal_content">
      <Auth :isModal="data.isModal"/>
    </div>
  </div>
</template>

<script>
  import Auth from '../auth/Auth.vue';
  import ModalHeader from './ModalHeader.vue';

  export default {
    props: ['data'],
    components: { Auth, ModalHeader }
  }
</script>

<style scoped>
  .modal_content { padding: 25px }
</style>
