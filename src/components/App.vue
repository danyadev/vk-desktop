<template>
  Hello, World!
</template>

<script>
  export default {
    // TODO
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
    font-size: 18px;
    margin: 0;
    overflow: hidden;
    height: 100vh;
    -webkit-rtl-ordering: visual;
    text-rendering: optimizeSpeed;
    background: #fff;
    user-select: none;
  }
</style>
