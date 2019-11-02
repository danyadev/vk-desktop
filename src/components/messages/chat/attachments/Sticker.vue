<template>
  <img class="attach_sticker" :src="src">
</template>

<script>
  export default {
    props: ['attach'],
    computed: {
      src() {
        const index = devicePixelRatio > 1 ? 2 : 1;

        return this.attach ? this.attach.images[index].url : 'assets/blank.gif';
      }
    }
  }
</script>

<style scoped>
  .attach_sticker {
    height: 128px;
    width: 128px;
  }
</style>
