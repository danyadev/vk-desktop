<template>
  <div class="photo_viewer">
    <img :src="data">
  </div>
</template>

<script>
  module.exports = {
    props: ['data']
  }
</script>
