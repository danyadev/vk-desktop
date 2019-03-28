<template>
  <div class="peers_container">
    <div class="header">
      <HeaderButton/>
      <div class="header_name">{{ l('im_header_title') }}</div>
    </div>
    <div class="peers_wrap">
      <MessagesPeer v-for="peer of peersList" :key="peer.id" :peer="peer"/>
    </div>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { mapGetters } from 'vuex';
  import { fields, concatProfiles } from 'js/utils';
  import { parseConversation, parseMessage } from 'js/messages';

  import MessagesPeer from './MessagesPeer.vue';
  import HeaderButton from './../HeaderButton.vue';

  export default {
    components: { HeaderButton, MessagesPeer },
    data: () => ({
      loading: true,
      loaded: false
    }),
    computed: {
      ...mapGetters('messages', ['peersList'])
    },
    methods: {
      async load() {
        let { items, profiles, groups } = await vkapi('messages.getConversations', {
          offset: this.peersList.length,
          fields: fields,
          extended: true
        });

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));

        for(let item of items) {
          let { conversation, last_message } = item;

          this.$store.commit('messages/addPeer', {
            peer: parseConversation(conversation),
            lastMsg: parseMessage(last_message, conversation)
          });
        }
      }
    },
    mounted() {
      this.load();
    }
  }
</script>

<style media="screen">
  .peers_wrap {
    width: 100%;
    /* 45px - постоянная высота у .header */
    height: calc(100% - 45px);
    border-right: 1px solid #e7e8ec;
    overflow-x: auto;
  }
</style>
