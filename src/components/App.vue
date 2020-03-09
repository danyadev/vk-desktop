<template>
  <div :class="['root', { mac }]">
    <Titlebar />
    <div class="app">
      <MainMenu v-if="activeUser" />
      <KeepAlive v-if="activeUser"><RouterView /></KeepAlive>
      <Auth v-else />

      <ModalsWrapper />
      <ContextMenuWrapper />
    </div>
  </div>
</template>

<script>
  import longpoll from 'js/longpoll';
  import { fields } from 'js/utils';
  import { mapState, mapGetters } from 'vuex';
  import vkapi from 'js/vkapi';
  import { addNotificationsTimer, parseMessage, parseConversation } from 'js/messages';

  import Titlebar from './Titlebar.vue';
  import MainMenu from './MainMenu.vue';
  import Auth from './auth/Auth.vue';
  import ModalsWrapper from './ModalsWrapper.vue';
  import ContextMenuWrapper from './ContextMenus/ContextMenuWrapper.vue';

  export default {
    components: {
      Titlebar,
      MainMenu,
      Auth,
      ModalsWrapper,
      ContextMenuWrapper
    },

    data: () => ({
      mac: process.platform == 'darwin'
    }),

    computed: {
      ...mapState('users', ['activeUser']),
      ...mapGetters('settings', ['settings'])
    },

    methods: {
      async initUser() {
        if(!this.activeUser) return;

        if(this.$router.currentRoute.path != '/messages') {
          this.$router.replace('/messages');
        }

        const {
          user,
          counters,
          pinnedPeers,
          lp,
          temporarilyDisabledNotifications
        } = await vkapi('execute.init', {
          pinnedPeers: this.settings.pinnedPeers.join(','),
          lp_version: longpoll.version,
          fields
        });

        this.$store.commit('users/updateUser', user);
        this.$store.commit('setMenuCounters', counters);

        for(const { peer, msg } of pinnedPeers) {
          this.$store.commit('messages/updateConversation', {
            peer: parseConversation(peer),
            msg: msg.id ? parseMessage(msg) : {}
          });
        }

        longpoll.start(lp);

        for(const peer of temporarilyDisabledNotifications) {
          addNotificationsTimer(peer);
        }
      }
    },

    watch: {
      // Может измениться только при авторизации, т.к. при
      // выходе из аккаунта данные обновляются сразу в localStorage
      activeUser() {
        this.initUser();
      }
    },

    created() {
      this.initUser();
    }
  }
</script>

<style>
  *, *::before, *::after {
    box-sizing: border-box;
  }

  :focus {
    outline: none;
  }

  @font-face {
    font-family: Roboto;
  	font-weight: 400;
  	font-display: block;
  	src: url('~assets/Roboto.ttf');
  }

  @font-face {
    font-family: Roboto;
  	font-weight: 500;
  	font-display: block;
  	src: url('~assets/RobotoMedium.ttf');
  }

  body {
    font-family: BlinkMacSystemFont, Roboto;
    font-size: 15px;
    margin: 0;
    overflow: hidden;
    height: 100vh;
    -webkit-rtl-ordering: visual;
    text-rendering: optimizeSpeed;
    background: #fff;
    user-select: none;
  }

  a, .link {
    color: #306aab;
    cursor: pointer;
  }

  a:hover, .link:hover {
    text-decoration: underline;
  }

  img:not(.emoji) {
    -webkit-user-drag: none;
    user-select: none;
  }

  .text-overflow,
  .keyboard_button div,
  .im_peer_message_wrap > div:first-child,
  .attach_photo_type {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .root {
    --titlebar-height: 32px;
  }

  .root.mac {
    --titlebar-height: 22px;
  }

  .app {
    height: calc(100vh - var(--titlebar-height));
    position: relative;
  }

  .input {
    width: 250px;
    outline: none;
    border: 1px solid #d2d8de;
    border-radius: 5px;
    font-size: 15px;
    color: #3c3c3c;
    line-height: 32px;
    height: 34px;
    padding: 0 9px;
    transition: border-color .3s;
  }

  .input:disabled { color: #999 }
  .input:hover { border: 1px solid #a2a5a8 }
  .input:focus { border: 1px solid #7e7f7f }
  .input::-webkit-input-placeholder { color: #a0a0a0 }

  .emoji {
    margin: 0 1px -2px 1px;
    width: 16px;
    height: 16px;
  }

  .header {
    display: flex;
    align-items: center;
    background: #5281b9;
    width: 100%;
    height: 45px;
  }

  .header_name {
    color: #fff;
    padding-left: 10px;
  }

  @keyframes spinner {
    from { transform: rotate(0deg) }
    to { transform: rotate(360deg) }
  }

  .loading::after {
    content: '';
    display: block;
    width: 18px;
    height: 18px;
    margin: 10px auto;
    animation: spinner .7s infinite linear;
    background: url('~assets/spinner.webp') 0 / contain;
  }

  .verified {
    display: inline-block;
    width: 12px;
    height: 12px;
    vertical-align: middle;
    color: #5c9ce6;
  }

  .verified.white {
    opacity: .7;
    color: #fff;
  }
</style>
