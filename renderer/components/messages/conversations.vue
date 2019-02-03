<template>
  <div class="conversations_container">
    <div class="header">
      <menu-button></menu-button>
      <div class="header_name">{{ l('im_header_title') }}</div>
    </div>
    <div class="conversations_wrap" :class="{ loading }" @scroll="onScroll">
      <conversation v-for="peer in peers" :peer="peer" :key="peer.id"></conversation>
    </div>
  </div>
</template>

<script>
  const { parseConversation, parseMessage, concatProfiles } = require('./methods');

  module.exports = {
    data: () => ({
      loading: true,
      loaded: false
    }),
    computed: {
      peers() {
        return this.$store.getters.peers;
      }
    },
    methods: {
      async load() {
        let { items, profiles = [], groups = [] } = await vkapi('messages.getConversations', {
          offset: this.peers.length,
          extended: true,
          fields: other.fields
        });

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));

        for(let item of items) {
          let { conversation, last_message } = item;

          this.$store.commit('addConversation', {
            peer: parseConversation(conversation),
            lastMsg: parseMessage(last_message, conversation)
          });
        }

        this.loading = false;

        if(items.length < 20) {
          this.loaded = true;
          return;
        }

        await this.$nextTick();
        this.onScroll({ target: qs('.conversations_wrap') });
      },
      onScroll: other.endScroll((vm) => {
        if(!vm.loading && !vm.loaded) {
          vm.load();
          vm.loading = true;
        }
      }, 100)
    },
    mounted() {
      if(longpoll.started) this.load();
      else longpoll.once('started', this.load);

      require('./events');
    }
  }
</script>
