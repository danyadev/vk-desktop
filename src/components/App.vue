<template>
  <div class="root">
    <Titlebar/>
    <div class="app">
      <MainMenu/>
      <router-view/>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';
  import Titlebar from './Titlebar.vue';
  import MainMenu from './MainMenu.vue';

  export default {
    name: 'App',
    components: { Titlebar, MainMenu },
    computed: {
      ...mapState('users', ['activeUser'])
    },
    watch: {
      activeUser(state) {
        this.$router.replace(state ? '/messages' : '/auth');
      }
    },
    mounted() {
      this.$router.replace(this.activeUser ? '/messages' : '/auth');

      if(this.activeUser) this.$store.dispatch('users/updateUserData');
    }
  }
</script>

<style>
  /* Основные стили приложения */

  *, *::before, *::after { box-sizing: border-box }

  @font-face {
  	font-family: 'Segoe UI';
  	font-weight: 400;
  	font-display: block;
  	src: local('Segoe UI'),
         url('~assets/SegoeUI.ttf');
  }

  @font-face {
  	font-family: 'Segoe UI';
  	font-weight: 500;
  	font-display: block;
  	src: local('Segoe UI Semibold'),
         url('~assets/SegoeUISemiBold.ttf');
  }

  body {
    font-family: BlinkMacSystemFont, 'Segoe UI';
    font-size: 15px;
    margin: 0;
    overflow: hidden;
    height: 100vh;
  }

  a, .link {
    display: inline-block;
    color: #254f79;
    cursor: pointer;
    transition: color .3s;
  }

  a:hover, .link:hover { text-decoration: underline }

  img, .is-scrolling {
    -webkit-user-drag: none;
    user-select: none;
  }

  .scrolly-bar {
    box-sizing: content-box;
    width: 7px !important;
    right: 4px !important;
    border-right: 0 solid transparent;
    transition: opacity .3s ease;
  }

  .scrolly-bar:hover:before {
    background: rgba(0, 0, 0, .4);
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
    transition: border-color .3s;
  }

  .input:disabled { color: #999 }
  .input:hover { border: 1px solid #a2a5a8 }
  .input:focus { border: 1px solid #7e7f7f }
  .input::-webkit-input-placeholder { color: #a0a0a0 }

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
    background-color: #598ac1;
    color: white;
  }

  .light_button {
    background-color: #e4eaf0;
    color: #55677d;
  }

  .button:not(:disabled):hover { background-color: #547fb3 }
  .button:not(:disabled):active { background-color: #4977a9 }
  .light_button:not(:disabled):hover { background-color: #dbe3eb }
  .light_button:not(:disabled):active { background-color: #d3dce6 }

  .emoji {
    margin: 0 1px -3px 1px;
    width: 16px;
    height: 16px;
  }

  .header {
    display: flex;
    align-items: center;
    background-color: #5281b9;
    width: 100%;
    height: 45px;
  }

  .header_name {
    color: white;
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
</style>
