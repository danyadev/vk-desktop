<template>
  <img class="attach_sticker" :src="src" loading="lazy" width="128" height="128">
</template>

<script>
  export default {
    props: ['attach'],

    computed: {
      src() {
        const [sticker] = this.attach;

        if(sticker) {
          const { darkTheme } = this.$store.state.settings;
          const type = darkTheme ? 'images_with_background' : 'images';
          const index = devicePixelRatio > 1 ? 2 : 1;

          return sticker[type][index].url;
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
