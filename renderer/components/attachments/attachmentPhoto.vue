<template>
  <div class="message_attach attach_photo" @click="$modals.open('photo-viewer', max)">
    <img :src="url">
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    data() {
      let type = this.data.isServiceMsg ? 'm' : 'x',
          sizes = ['z', 'y', 'x', 'r', 'q', 'p', 'o', 'm', 's'],
          max, i = 0;

      while(!max && sizes[i]) {
        max = this.getSize(sizes[i]);
        i++;
      }

      return {
        url: this.getSize(type).url,
        max: max && max.url
      }
    },
    methods: {
      getSize(type) {
        return this.data.sizes.find((size) => size.type == type);
      }
    }
  }
</script>
