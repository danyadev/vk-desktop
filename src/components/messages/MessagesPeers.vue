<template>
  <div class="peers_container">
    <div class="header">
      <HeaderButton/>
      <div class="header_name">{{ l('im_header_title') }}</div>
    </div>
    <Scrolly class="peers_wrap" :passiveScroll="true">
      <ScrollyViewport>
        <MessagesPeer v-for="peer of peersList" :key="peer.id" :peer="peer"/>
      </ScrollyViewport>
      <ScrollyBar/>
    </Scrolly>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { mapGetters } from 'vuex';
  import { fields, concatProfiles } from 'js/utils';
  import { parseConversation, parseMessage } from 'js/messages';
  import { Scrolly, ScrollyViewport, ScrollyBar } from 'vue-scrolly';

  import MessagesPeer from './MessagesPeer.vue';
  import HeaderButton from './../HeaderButton.vue';

  export default {
    components: {
      Scrolly, ScrollyViewport, ScrollyBar,
      HeaderButton, MessagesPeer
    },
    data: () => ({
      loading: true,
      loaded: false
    }),
    computed: {
      ...mapGetters('messages', ['peersList'])
    },
    methods: {
      async load() {
        const { items, profiles, groups } = await vkapi('messages.getConversations', {
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

<style>
  .peers_wrap {
    width: 100%;
    /* 45px - постоянная высота у .header */
    height: calc(100% - 45px);
    border-right: 1px solid #e7e8ec;
  }
</style>
