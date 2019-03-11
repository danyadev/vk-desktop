<template>
  <div class="app">
    <Titlebar/>
  </div>
</template>

<script>
  import Titlebar from './Titlebar.vue';

  export default {
    name: 'App',
    components: { Titlebar }
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
  			 url('/dist/assets/SegoeUI.ttf');
  }

  @font-face {
  	font-family: 'Segoe UI';
  	font-weight: 500;
  	font-display: block;
  	src: local('Segoe UI Semibold'),
  			 url('/dist/assets/SegoeUISemiBold.ttf');
  }

  body {
    font-family: BlinkMacSystemFont, 'Segoe UI';
    font-size: 15px;
    margin: 0;
    overflow: hidden;
    height: 100vh;
  }
</style>
