<template>
  <div class="message_attach attach_link" :class="type">
    <img v-if="photo" class="attach_link_img" :src="photo">
    <div class="attach_link_content">
      <div class="attach_link_title">{{ title }}</div>
      <div class="attach_link_url">{{ caption }}</div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    data() {
      let photo = this.data.photo, photoUrl,
          isHorizontal = false,
          isStory = this.data.url.match(/^https:\/\/m\.vk\.com\/story/);

      if(photo) {
        let horizontal = this.getSize('l');

        if(horizontal) {
          photoUrl = horizontal.url;
          isHorizontal = true;
        } else photoUrl = this.getSize('m').url;
      }

      return {
        type: '-type' + (photo ? (isHorizontal && !isStory ? 2 : 1) : 0),
        photo: photoUrl,
        title: this.data.title,
        caption: this.data.caption,
        url: this.data.url
      }
    },
    methods: {
      getSize(type) {
        return this.data.photo.sizes.find((size) => size.type == type);
      }
    }
  }
</script>
