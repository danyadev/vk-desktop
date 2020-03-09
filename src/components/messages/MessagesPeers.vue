<template>
  <div class="im_peers_container">
    <div class="header">
      <HeaderButton />
      <div class="header_name">{{ l('im_header_title') }}</div>
      <MessagesListMenu />
    </div>
    <Scrolly
      class="im_peers_wrap"
      :vclass="{ loading }"
      :lock="lockScroll"
      @scroll="onScroll"
    >
      <template v-if="conversationsLists.pinned.length && conversationsLists.pinned[0]">
        <div>
          <MessagesPeer
            v-for="{ peer, msg } of conversationsLists.pinned"
            :key="peer.id"
            :peer="peer"
            :msg="msg"
            :activeChat="activeChat"
          />
        </div>
        <div class="im_peers_delimiter"></div>
      </template>

      <MessagesPeer
        v-for="{ peer, msg } of conversationsLists.unpinned"
        :key="peer.id"
        :peer="peer"
        :msg="msg"
        :activeChat="activeChat"
      />
    </Scrolly>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { mapGetters } from 'vuex';
  import { fields, concatProfiles, endScroll } from 'js/utils';
  import { parseConversation, parseMessage } from 'js/messages';

  import Scrolly from '../UI/Scrolly.vue';
  import MessagesListMenu from '../ActionMenus/MessagesListMenu.vue';
  import HeaderButton from '../HeaderButton.vue';
  import MessagesPeer from './MessagesPeer.vue';

  export default {
    props: ['activeChat'],

    components: {
      Scrolly,
      MessagesListMenu,
      HeaderButton,
      MessagesPeer
    },

    data: () => ({
      loading: true,
      loaded: false,
      lockScroll: false
    }),

    computed: {
      ...mapGetters('messages', ['conversationsList']),
      ...mapGetters('settings', ['settings']),

      conversationsLists() {
        const { pinnedPeers } = this.settings;

        return {
          pinned: pinnedPeers.map((id) => {
            return this.$store.state.messages.conversations[id];
          }),

          unpinned: this.conversationsList.filter(({ peer }) => {
            return !pinnedPeers.includes(peer.id)
          })
        };
      }
    },

    methods: {
      async load() {
        const { items, profiles, groups } = await vkapi('messages.getConversations', {
          offset: this.conversationsList.length,
          count: 40,
          fields: fields,
          extended: true
        });

        this.lockScroll = true;

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));

        const conversations = items.map((item) => ({
          peer: parseConversation(item.conversation),
          msg: parseMessage(item.last_message)
        }));

        this.$store.commit('messages/addConversations', conversations);

        await this.$nextTick();
        setTimeout(() => this.lockScroll = false, 0);

        this.loading = false;
        if(items.length < 40) this.loaded = true;
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
  .im_peers_wrap {
    width: 100%;
    /* 45px - постоянная высота у .header */
    height: calc(100% - 45px);
    border-right: 1px solid #e7e8ec;
  }

  .im_peers_container .header_name {
    flex-grow: 1;
  }

  .im_peers_delimiter {
    width: 100%;
    height: 8px;
    background: #e7e8ec;
  }
</style>
