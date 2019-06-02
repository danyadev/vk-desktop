<template>
  <div class="peers_container">
    <div class="header">
      <HeaderButton/>
      <div class="header_name">{{ l('im_header_title') }}</div>
    </div>
    <Scrolly class="peers_wrap" :vclass="{ loading }" @scroll="onScroll">
      <MessagesPeer v-for="{ peer, msg } of conversations" :key="peer.id" :peer="peer" :msg="msg"/>
    </Scrolly>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { mapGetters } from 'vuex';
  import { fields, concatProfiles, endScroll } from 'js/utils';
  import { parseConversation, parseMessage } from 'js/messages';

  import Scrolly from '../UI/Scrolly.vue';
  import HeaderButton from '../HeaderButton.vue';
  import MessagesPeer from './MessagesPeer.vue';

  export default {
    components: {
      Scrolly,
      HeaderButton,
      MessagesPeer
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

        const conversations = items.map((item) => ({
          peer: parseConversation(item.conversation),
          msg: parseMessage(item.last_message)
        }));

        this.$store.commit('messages/addConversations', conversations);
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
    border-right: 1px solid var(--border-color);
  }
</style>
