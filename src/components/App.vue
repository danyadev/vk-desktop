<template>
  <div :class="['root', { mac }]" :theme="theme">
    <Titlebar />
    <div class="app">
      <MainMenu v-if="activeUser" />
      <KeepAlive v-if="activeUser"><RouterView /></KeepAlive>
      <Auth v-else />
      <ModalsWrapper />
    </div>
  </div>
</template>

<script>
  import longpoll from 'js/longpoll';
  import { fields } from 'js/utils';
  import { mapState } from 'vuex';
  import vkapi from 'js/vkapi';
  import { addNotificationsTimer } from 'js/messages';

  import Titlebar from './Titlebar.vue';
  import MainMenu from './MainMenu.vue';
  import Auth from './auth/Auth.vue';
  import ModalsWrapper from './ModalsWrapper.vue';

  export default {
    components: {
      Titlebar,
      MainMenu,
      Auth,
      ModalsWrapper
    },

    data: () => ({
      mac: process.platform == 'darwin'
    }),

    computed: {
      ...mapState('users', ['activeUser']),
      ...mapState('settings', ['theme'])
    },

    methods: {
      async initUser() {
        if(!this.activeUser) return;

        if(this.$router.currentRoute.path != '/messages') {
          this.$router.replace('/messages');
        }

        const { lp, counters, user, temporarilyDisabledNotifications } = await vkapi('execute.init', {
          lp_version: longpoll.version,
          fields
        });

        this.$store.commit('users/updateUser', user);
        this.$store.commit('setMenuCounters', counters);

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
  @import '~assets/themes/light.css';
  @import '~assets/themes/dark.css';

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
    user-select: none;
  }

  a, .link {
    color: var(--text-link);
    cursor: pointer;
  }

  a:hover, .link:hover {
    text-decoration: underline;
  }

  img:not(.emoji) {
    -webkit-user-drag: none;
    user-select: none;
  }

  .root {
    --titlebar-height: 32px;
    background: var(--background-content);
    color: var(--text-primary);
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
    border: 1px solid var(--input-border);
    border-radius: 5px;
    font-size: 15px;
    color: var(--input-placeholder);
    line-height: 32px;
    height: 34px;
    padding: 0 9px;
    transition: border-color .3s;
    background: var(--background-content);
  }

  .input:disabled { opacity: 0.6 }
  .input:hover:not(:disabled) { border: 1px solid var(--input-border) }
  .input:focus { border: 1px solid var(--input-border-active) }
  .input::-webkit-input-placeholder { color: var(--text-secondary) }

  .emoji {
    margin: 0 1px -2px 1px;
    width: 16px;
    height: 16px;
  }

  .header {
    display: flex;
    align-items: center;
    background: var(--header-background);
    width: 100%;
    height: 45px;
  }

  .header_name {
    color: var(--header-text);
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
    background: url('~assets/verified.svg');
  }

  .verified.white {
    background: url('~assets/verified_white.svg');
    opacity: .7;
  }
</style>
