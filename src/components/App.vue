<template>
  <div class="root" :theme="theme">
    <Titlebar/>
    <div class="app">
      <MainMenu v-if="activeUser"/>
      <KeepAlive v-if="activeUser"><RouterView/></KeepAlive>
      <Auth v-else/>
      <ModalsWrapper/>
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
    name: 'App',
    components: {
      Titlebar,
      MainMenu,
      Auth,
      ModalsWrapper
    },
    computed: {
      ...mapState('users', ['activeUser']),
      ...mapState('settings', ['theme'])
    },
    methods: {
      async initUser() {
        if(longpoll.started) longpoll.stop();

        if(this.activeUser) {
          if(this.$router.currentRoute.path != '/messages') this.$router.replace('/messages');

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
        this.initUser();
      }
    },
    created() {
      this.initUser();
    }
  }
</script>

<style>
  *, *::before, *::after { box-sizing: border-box }

  :focus { outline: none }

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
  }

  a, .link {
    display: inline-block;
    color: #254f79;
    cursor: pointer;
    transition: color .3s;
  }

  a:hover, .link:hover { text-decoration: underline }

  img:not(.emoji) {
    -webkit-user-drag: none;
    user-select: none;
  }

  .app { height: calc(100vh - 32px) }

  .input {
    width: 250px;
    outline: none;
    border: 1px solid #d2d8de;
    border-radius: 5px;
    font-size: 15px;
    color: #3c3c3c;
    line-height: 32px;
    padding: 0 30px 0 9px;
    user-select: none;
    transition: border-color .3s;
  }

  .input:disabled { color: #999 }
  .input:hover { border: 1px solid #a2a5a8 }
  .input:focus { border: 1px solid #7e7f7f }
  .input::-webkit-input-placeholder { color: #a0a0a0 }

  .emoji {
    margin: 0 1px -3px 1px;
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
