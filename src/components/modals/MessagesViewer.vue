<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_msg_viewer_header') }}</ModalHeader>
    <Scrolly vclass="modal_content">
      <MessagesList :list="messages" :peer_id="peer_id" />
    </Scrolly>
    <div class="modal_footer">
      <Button class="right" @click="close">{{ l('close') }}</Button>
    </div>
  </div>
</template>

<script>
  import ModalHeader from './ModalHeader.vue';
  import MessagesList from '../messages/chat/MessagesList.vue';
  import Scrolly from '../UI/Scrolly.vue';
  import Button from '../UI/Button.vue';

  export default {
    props: ['messages', 'peer_id'],

    components: {
      ModalHeader,
      MessagesList,
      Scrolly,
      Button
    },

    methods: {
      close() {
        this.$modals.close(this.$attrs.name);
      }
    }
  }
</script>

<style>
  .modal[name=messages-viewer] .modal_content {
    min-width: 350px;
    padding: 10px 0 15px 0;
  }
</style>
