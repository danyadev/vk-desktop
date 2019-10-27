<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_update_available') }} {{ data.name }}</ModalHeader>
    <Scrolly vclass="modal_content">{{ data.notes }}</Scrolly>
    <div class="modal_footer">
      <Button class="left" @click="update">{{ l('ml_update_now') }}</Button>
      <Button class="left" light @click="close">{{ l('ml_update_later') }}</Button>
    </div>
  </div>
</template>

<script>
  import ModalHeader from './ModalHeader.vue';
  import Button from '../UI/Button.vue';
  import Scrolly from '../UI/Scrolly.vue';

  export default {
    props: ['data'],
    components: {
      ModalHeader,
      Button,
      Scrolly
    },
    methods: {
      update() {
        this.data.quitAndInstall();
      },
      close() {
        this.$modals.close(this.$attrs.name);
      }
    }
  }
</script>

<style>
  .modal[name=update-available] .modal_content {
    padding: 20px;
    white-space: pre-wrap;
  }
</style>
