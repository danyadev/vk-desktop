<template>
  <div class="peers_container">
    <div class="header">
      <HeaderButton/>
      <div class="header_name">{{ l('im_header_title') }}</div>
    </div>
    <Scrolly class="peers_wrap" @scrollchange="onScroll">
      <ScrollyViewport :class="{ loading }">
        <MessagesPeer v-for="{ peer, msg } of conversations" :key="peer.id" :peer="peer" :msg="msg"/>
      </ScrollyViewport>
      <ScrollyBar/>
    </Scrolly>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { mapGetters } from 'vuex';
  import { fields, concatProfiles, endScroll } from 'js/utils';
  import { parseConversation, parseMessage } from 'js/messages';
  import { Scrolly, ScrollyViewport, ScrollyBar } from 'vue-scrolly';

  import MessagesPeer from './MessagesPeer.vue';
  import HeaderButton from '../HeaderButton.vue';

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
      ...mapGetters('messages', {
        conversations: 'conversationsList'
      })
    },
    methods: {
      async load() {
        const { items, profiles, groups } = await vkapi('messages.getConversations', {
          offset: this.conversations.length,
          fields: fields,
          extended: true
        });

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));

        for(let item of items) {
          let { conversation, last_message } = item;

          this.$store.commit('messages/addPeer', {
            peer: parseConversation(conversation),
            msg: parseMessage(last_message, conversation)
          });
        }

        this.loading = false;
        if(items.length < 20) this.loaded = true;
      },
      onScroll: endScroll(function() {
        if(!this.loading && !this.loaded) {
          this.loading = true;
          this.load();
        }
      })
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
