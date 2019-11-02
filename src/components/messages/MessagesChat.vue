<template>
  <div class="im_chat_container">
    <ChatHeader :id="id" :peer="peer" @close="closeChat"/>
    <div class="im_chat_wrap">
      <ChatList ref="chatList" :id="id"/>
      <ChatInput :id="id" :peer="peer"/>
    </div>
  </div>
</template>

<script>
  import { loadConversation, loadConversationMembers } from 'js/messages';
  import { eventBus } from 'js/utils';
  import ChatHeader from './chat/Header.vue';
  import ChatList from './chat/List.vue';
  import ChatInput from './chat/Input.vue';

  export default {
    components: {
      ChatHeader,
      ChatList,
      ChatInput
    },
    data() {
      return {
        id: this.$route.params.id
      };
    },
    computed: {
      peer() {
        const conversation = this.$store.state.messages.conversations[this.id];

        return conversation && conversation.peer;
      }
    },
    methods: {
      closeChat() {
        eventBus.emit('messages:closeChat', this.id);
        this.$router.replace('/messages');
      },
      setInRead() {
        const { peer } = this.$store.state.messages.conversations[this.id];

        this.$store.commit('messages/updateConversation', {
          peer: {
            id: this.id,
            new_in_read: peer.in_read
          }
        });
      }
    },
    mounted() {
      if(this.id > 2e9) loadConversationMembers(this.id, true);
    },
    activated() {
      if(!this.peer || !this.peer.loaded) loadConversation(this.id).then(this.setInRead);
      else {
        if(this.id < 2e9) loadConversation(this.id);
        this.setInRead();
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
</style>
