<template>
  <div class="im_loading_messages">
    <Message v-for="msg of messages" :key="msg.random_id" :peer_id="id" :list="list" :msg="msg"/>
  </div>
</template>

<script>
  import Message from './Message.vue';

  export default {
    props: ['id', 'list', 'loadingMessages'],
    components: {
      Message
    },
    computed: {
      messages() {
        return this.loadingMessages.map((msg, index) => ({
          text: msg.text,
          date: msg.date,
          from: this.$store.getters['users/user'].id,
          random_id: msg.random_id,
          out: true,
          fake: true,
          isFirstFake: !index,
          error: msg.error
        }));
      }
    }
  }
</script>
