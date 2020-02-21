<template>
  <Touch class="im_carousel">
    <div v-for="item of template.elements" class="im_carousel_item">
      <img v-if="item.photo" :src="getPhotoFromSizes(item.photo.sizes, 'x').url">
      <div class="im_carousel_content">
        <div class="im_carousel_title">{{ item.title }}</div>
        <div class="im_carousel_description">{{ item.description }}</div>
        <Keyboard class="im_carousel_buttons"
                  :peer_id="peer_id"
                  :keyboard="{
                    inline: true,
                    author_id,
                    buttons: item.buttons.map((btn) => [btn])
                  }"
        />
      </div>
    </div>
    <div class="im_carousel_after"></div>
  </Touch>
</template>

<script>
  import { getPhotoFromSizes } from 'js/utils';

  import Touch from '../../UI/Touch.vue';
  import Keyboard from './Keyboard.vue';

  export default {
    props: ['peer_id', 'author_id', 'template'],

    components: {
      Touch,
      Keyboard
    },

    methods: {
      getPhotoFromSizes
    }
  }
</script>

<style>
  .im_carousel {
    display: flex;
    margin-top: 2px;
    padding-left: 15px;
    user-select: none;
  }

  .im_carousel_item {
    flex: none;
    width: 270px;
    border-radius: 15px;
    overflow: hidden;
  }

  .im_carousel_item:not(:first-child) {
    margin-left: 5px;
  }

  .im_carousel_item > img {
    vertical-align: middle;
    width: 270px;
    height: 166px;
  }

  .im_carousel_content {
    display: flex;
    flex-direction: column;
    height: calc(100% - 166px);
    padding: 10px;
    background: #eee;
  }

  .im_carousel_description {
    color: #666;
    margin: 6px 0 25px 0;
  }

  .im_carousel_buttons {
    margin-top: auto;
  }

  .im_carousel_after {
    width: 100px;
    flex: none;
  }
</style>
