<template>
  <div class="emoji_block" @mouseleave="mouseleave" @mouseenter="mouseenter">
    <div v-for="(emojies, name) of list" class="emoji_block_item">
      <div class="emoji_block_name">{{ l('emojies', name) }}</div>
      <div v-for="emoji of emojies" class="emoji_block_image_wrap" @click="$emit('onChooseEmoji', emoji)">
        <div :class="'@'+emoji" class="emoji_block_image"></div>
      </div>
    <div>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      list: require('./../../js/emojiList'),
      entered: false,
      timeout: null
    }),
    methods: {
      mouseleave() {
        this.entered = false;
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
          if(!this.entered) this.$emit('close');
          else this.entered = false;


        }, 1000);
      },
      mouseenter() {
        this.entered = true;
      }
    }
  }
</script>
