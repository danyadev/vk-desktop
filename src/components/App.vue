<template>
  <div class="root">
    <Titlebar/>
    <div class="app">
      <MainMenu v-if="activeUser"/>
      <RouterView/>
      <ModalsWrapper/>
    </div>
  </div>
</template>

<script>
  import longpoll from 'js/longpoll';
  import { fields } from 'js/utils';
  import { mapState } from 'vuex';
  import vkapi from 'js/vkapi';

  import ModalsWrapper from './ModalsWrapper.vue';
  import Titlebar from './Titlebar.vue';
  import MainMenu from './MainMenu.vue';

  import '../css/themes.css';

  export default {
    name: 'App',
    components: {
      Titlebar,
      MainMenu,
      ModalsWrapper
    },
    computed: {
      ...mapState('users', ['activeUser'])
    },
    methods: {
      initUser() {
        if(longpoll.started) longpoll.stop();

        if(this.activeUser) {
          vkapi('execute.init', {
            lp_version: longpoll.version,
            fields: fields
          }).then(({ lp, counters, user }) => {
            this.$store.commit('users/updateUser', user);
            this.$store.commit('setMenuCounters', counters);

            if(longpoll.stopped) longpoll.start(lp);
            else longpoll.once('stop', () => longpoll.start(lp));
          });
        }

        this.$router.replace(this.activeUser ? '/messages' : '/auth');
      }
    },
    watch: {
      activeUser() {
        this.initUser();
      }
    },
    mounted() {
      this.initUser();
    }
  }
</script>

<style>
  /* Основные стили приложения */

  *, *::before, *::after { box-sizing: border-box }

  :focus { outline: none }

  @font-face {
  	font-family: Segoe UI;
  	font-weight: 400;
  	font-display: block;
  	src: url('~assets/SegoeUI.ttf');
  }

  @font-face {
  	font-family: Segoe UI;
  	font-weight: 500;
  	font-display: block;
  	src: url('~assets/SegoeUIMedium.ttf');
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

  ::selection { background: var(--button_primary_background); color: var(--button_primary_color); }

  body {
    font-family: BlinkMacSystemFont, Segoe UI;
    font-size: 15px;
    margin: 0;
    overflow: hidden;
    height: 100vh;
    -webkit-rtl-ordering: visual;
  }

  .ff-roboto {
    font-family: BlinkMacSystemFont, Roboto;
  }

  a, .link {
    display: inline-block;
    color: var(--text_link);
    cursor: pointer;
    transition: color .3s;
  }

  a:hover, .link:hover { text-decoration: underline }

  img:not(.emoji) {
    -webkit-user-drag: none;
    user-select: none;
  }

  .app {
    height: calc(100vh - 32px);
    background: var(--background_content);
  }

  .input {
    width: 250px;
    outline: none;
    border: 1px solid var(--border_color);
    border-radius: 5px;
    font-size: 15px;
    color: var(--text_placeholder);
    line-height: 32px;
    padding: 0 30px 0 9px;
    user-select: none;
    transition: border-color .3s;
    background: var(--background_content);
  }

  .input:disabled { color: #999 }
  .input:hover { border: 1px solid #a2a5a8 }
  .input:focus { border: 1px solid #7e7f7f }
  .input::-webkit-input-placeholder { color: var(--text_placeholder) }

  .button, .light_button {
    display: inline-block;
    font-size: 15px;
    padding: 9px;
    outline: none;
    border: none;
    border-radius: 5px;
    user-select: none;
    text-align: center;
    transition: opacity .3s, background-color .3s;
  }

  .button:not(:disabled), .light_button:not(:disabled) {
    cursor: pointer;
  }

  .button:disabled, .light_button:disabled {
    opacity: .8;
  }

  .button {
    background-color: var(--button_primary_background);
    color: var(--button_primary_color);
  }

  .light_button {
    background-color: var(--button_secondary_background);
    color: var(--button_secondary_color);
  }

  .button:not(:disabled):hover { background-color: var(--button_primary_hover_background) }
  .button:not(:disabled):active { background-color: var(--button_primary_active_background) }
  .light_button:not(:disabled):hover { background-color: var(--button_secondary_hover_background) }
  .light_button:not(:disabled):active { background-color: var(--button_secondary_active_background) }

  .emoji {
    margin: 0 1px -3px 1px;
    width: 16px;
    height: 16px;
  }

  .header {
    display: flex;
    align-items: center;
    background-color: var(--titlebar_background);
    width: 100%;
    height: 45px;
  }

  body[scheme="dark"] .header { border-bottom: 1px solid var(--border_color) }

  .header_name {
    color: #fff;
    padding: 0 0 1px 10px;
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
    background: url('~assets/spinner.png') 0 / contain;
  }

  .verified {
    display: inline-block;
    width: 16px;
    height: 16px;
    vertical-align: middle;
    background-image: url('~assets/verified.svg');
  }

  .verified.white {
    background-image: url('~assets/verified_white.svg');
    opacity: .7;
  }

  .scrolly-bar:before {
    background: var(--scrolly_background);
  }

  .scrolly-bar:hover:before, .scrolly.isScrolling .scrolly-bar:before {
    background: var(--scrolly_highlighted);
  }
</style>
