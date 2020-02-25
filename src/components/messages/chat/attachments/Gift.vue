<template>
  <img class="attach_gift" :src="attach[0].thumb_256" loading="lazy" width="256" height="256">
</template>

<script>
  export default {
    props: ['attach']
  }
</script>

<style>
  .attach_gift {
    overflow: hidden;
    vertical-align: middle;
    border-radius: 14px;
  }
</style>
