<template>
  <div :class="['root', { mac }]">
    <Titlebar />
  </div>
</template>

<script>
import Titlebar from './Titlebar.vue';

require('electron').remote.getCurrentWindow().openDevTools();

export default {
  components: {
    Titlebar
  },

  setup() {
    return {
      mac: process.platform === 'darwin'
    };
  }
};
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

  .root {
    --titlebar-height: 32px;
  }

  .root.mac {
    --titlebar-height: 22px;
  }
</style>
