<template>
  <div :class="['root', { mac }]">
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
      ...mapState('users', ['activeUser'])
    },

    methods: {
      async initUser() {
        if(this.activeUser) {
          if(this.$router.currentRoute.path != '/messages') {
            this.$router.replace('/messages');
          }

          const { lp, counters, user } = await vkapi('execute.init', {
            lp_version: longpoll.version,
            fields: fields
          });

          this.$store.commit('users/updateUser', user);
          this.$store.commit('setMenuCounters', counters);

          longpoll.start(lp);
        }
      }
    },

    watch: {
      activeUser() {
        // При входе в аккаунт
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
  }

  a, .link {
    color: #306aab;
    cursor: pointer;
    user-select: none;
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
    user-select: none;
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

  .root:not(.mac) .header_name,
  .root:not(.mac) .text-shadow {
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
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
    width: 16px;
    height: 16px;
    vertical-align: middle;
    background: url('~assets/verified.svg');
  }

  .verified.white {
    background: url('~assets/verified_white.svg');
    opacity: .7;
  }
</style>
