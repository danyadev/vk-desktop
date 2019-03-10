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

  body {
    font-family: BlinkMacSystemFont, sans-serif;
    font-size: 15px;
    margin: 0;
    overflow: hidden;
    height: 100vh;
  }
</style>
