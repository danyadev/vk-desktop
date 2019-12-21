<template>
  <div class="im_chat_container">
    <Header :peer_id="peer_id" :peer="peer" @close="closeChat" />
    <div :class="['im_chat_wrap', { pinnedMsg }]">
      <List :peer_id="peer_id" :peer="peer" />
      <Input :peer_id="peer_id" :peer="peer" />
    </div>
  </div>
</template>

<script>
  import { loadConversation, loadConversationMembers } from 'js/messages';
  import { eventBus } from 'js/utils';

  import Header from './chat/Header.vue';
  import List from './chat/List.vue';
  import Input from './chat/Input.vue';

  export default {
    components: {
      Header,
      List,
      Input
    },
    data() {
      return {
        peer_id: +this.$route.params.id
      };
    },
    computed: {
      peer() {
        const conv = this.$store.state.messages.conversations[this.peer_id];

        return conv && conv.peer;
      },
      pinnedMsg() {
        const showPinnedMsg = !this.$store.getters['settings/settings'].hiddenPinnedMessages[this.peer_id];

        return this.peer && this.peer.pinnedMsg && showPinnedMsg;
      }
    },
    methods: {
      closeChat() {
        eventBus.emit('messages:event', 'close_chat', {
          peer_id: this.peer_id
        });

        this.$router.replace('/messages');
      }
    },
    mounted() {
      if(this.peer_id > 2e9) loadConversationMembers(this.peer_id, true);

      this.$store.commit('messages/addOpenedChat', +this.peer_id);
    },
    activated() {
      if(!this.peer || !this.peer.loaded || this.peer_id < 2e9) {
        loadConversation(this.peer_id);
      }
    }
  }
</script>

<style>
  .im_chat_wrap {
    display: flex;
    flex-direction: column;
    height: calc(100% - 45px);
  }

  .im_chat_wrap.pinnedMsg {
    height: calc(100% - 45px - 52px);
  }
</style>
