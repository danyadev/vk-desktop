<template>
  <img class="attach_sticker" :src="src" loading="lazy" width="128" height="128">
</template>

<script>
  export default {
    props: ['attach'],
    
    computed: {
      src() {
        if(this.attach[0]) {
          const index = devicePixelRatio > 1 ? 2 : 1;

          return this.attach[0].images[index].url;
        } else {
          return 'assets/blank.gif';
        }
      }
    }
  }
</script>

<style>
  .attach_sticker {
    vertical-align: middle;
  }
</style>
