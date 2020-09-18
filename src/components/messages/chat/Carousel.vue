<template>
  <Touch class="im_carousel">
    <div v-for="(item, i) of msg.template.elements" :key="i" class="im_carousel_item">
      <img v-if="item.photo" :src="getPhotoFromSizes(item.photo.sizes, 'x').url">

      <div class="im_carousel_content">
        <div class="im_carousel_title roboto-vk">
          <VKText>{{ item.title }}</VKText>
        </div>

        <div class="im_carousel_description roboto-vk">
          <VKText>{{ item.description }}</VKText>
        </div>

        <Keyboard
          class="im_carousel_buttons"
          :peer_id="peer_id"
          :keyboard="{
            inline: true,
            author_id: msg.from,
            buttons: item.buttons.map((btn) => [btn])
          }"
          :msg_id="msg.id"
        />
      </div>
    </div>

    <div class="im_carousel_after"></div>
  </Touch>
</template>

<script>
import { getPhotoFromSizes } from 'js/utils';

import Touch from '../../UI/Touch.vue';
import VKText from '../../UI/VKText.vue';
import Keyboard from './Keyboard.vue';

export default {
  props: ['peer_id', 'msg'],

  components: {
    Touch,
    VKText,
    Keyboard
  },

  setup: () => ({
    getPhotoFromSizes
  })
};
</script>

<style>
.im_carousel {
  display: flex;
  margin-top: 2px;
  padding-left: 14px;
  flex: none;
}

.im_carousel_item {
  flex: none;
  width: 221px;
  border-radius: 15px;
  overflow: hidden;
  background: var(--message-bubble-background);
}

.im_carousel_item:not(:first-child) {
  margin-left: 6px;
}

.im_carousel_item > img {
  vertical-align: middle;
  width: 221px;
  height: 136px;
}

.im_carousel_content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 136px);
  padding: 10px;
}

.im_carousel_description {
  color: var(--text-dark-steel-gray);
  margin: 6px 0 20px 0;
}

.im_carousel_buttons {
  margin-top: auto;
}

.im_carousel_after {
  width: 100px;
  flex: none;
}
</style>
