<template>
  <div v-if="photo" :class="['attach_link', { horizontalPhoto, hasButton: !!button }]">
    <img
      v-if="horizontalPhoto"
      :src="photo.url"
      :style="{ aspectRatio: `${photo.width} / ${photo.height}` }"
      :width="photo.width"
    >
    <span v-else :style="{ backgroundImage: `url(${photo.url})` }"></span>
    <div class="attach_link_content">
      <div class="attach_link_content_title" @click="openPage(url)">
        <VKText>{{ title }}</VKText>
      </div>
      <div v-if="caption" class="attach_link_content_caption">{{ caption }}</div>

      <Button v-if="button" @click="openPage(button.action.url)">{{ button.title }}</Button>
    </div>
  </div>
  <div v-else class="attach_link -short attach_left_border" @click="openPage(url)">
    <div class="attach_link_content">
      <div class="attach_link_content_title"><VKText>{{ title }}</VKText></div>
      <div v-if="caption" class="attach_link_content_caption">{{ caption }}</div>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { getPhotoFromSizes } from 'js/api/utils';

import VKText from '@/UI/VKText.vue';
import Button from '@/UI/Button.vue';

export default {
  props: ['attach'],

  components: {
    VKText,
    Button
  },

  setup(props) {
    // eslint-disable-next-line vue/no-setup-props-destructure
    const [attach] = props.attach;
    const photo = attach.photo && getPhotoFromSizes(attach.photo.sizes, ['k', 'l', 'x']);

    return {
      url: attach.url,
      photo,
      horizontalPhoto: !attach.forceLeftPhoto && (
        photo && (photo.width / photo.height >= 3 / 2) && photo.width > 300
      ),
      title: attach.title || attach.url,
      caption: attach.caption || attach.description || attach.url,
      button: attach.button,

      openPage(url) {
        electron.shell.openExternal(url);
      }
    };
  }
};
</script>

<style>
.attach_link {
  display: flex;
  margin-top: 1px;
}

.attach_link:not(.-short) {
  background: var(--background);
  border: 1px solid var(--separator-dark);
  border-radius: 10px;
  overflow: hidden;
  min-height: 70px;
}

.message.removeTopMargin .message_bubble_content > .im_attachments > .attach_link:not(.-short) {
  border-radius: 14px 14px 10px 10px;
}

.attach_link.-short {
  position: relative;
  padding-left: 10px;
  cursor: pointer;
}

.attach_link.horizontalPhoto {
  flex-direction: column;
}

.attach_link span {
  background-position: 50% 50%;
  background-size: cover;
  background-repeat: no-repeat;
  width: 110px;
  flex: none;
  border-right: 1px solid var(--separator-dark);
}

.attach_link.hasButton span {
  min-height: 95px;
}

.attach_link img {
  max-width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-bottom: 1px solid var(--separator-dark);
}

.attach_link:not(.-short) .attach_link_content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 10px;
  user-select: text;
}

.attach_link_content_title,
.attach_link_content_caption {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.attach_link_content_title {
  -webkit-line-clamp: 3;
  color: var(--text-blue);
  font-weight: 500;
  cursor: pointer;
}

.hasButton .attach_link_content_title,
.attach_link.-short .attach_link_content_title {
  -webkit-line-clamp: 1;
}

.attach_link_content_caption {
  -webkit-line-clamp: 1;
  color: var(--text-dark-steel-gray);
  margin-top: 5px;
  font-size: 14px;
}

.attach_link.-short .attach_link_content_caption {
  margin-top: 2px;
}

.attach_link.horizontalPhoto .attach_link_content_caption {
  -webkit-line-clamp: 2;
}

.attach_link_content .button {
  padding: 6px 10px;
  margin-top: auto;
  width: fit-content;
}

.attach_link.horizontalPhoto .button {
  margin-top: 5px;
}
</style>
