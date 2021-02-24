<template>
  <div :class="['attach_link', { horizontalPhoto }]" @click="openPage(url)">
    <img v-if="photo" :src="photo">
    <div class="attach_link_content">
      <div class="attach_link_content_title">{{ title }}</div>
      <div v-if="caption" class="attach_link_content_caption">{{ caption }}</div>

      <Button v-if="button" @click="openPage(button.action.url)">{{ button.title }}</Button>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { getPhotoFromSizes } from 'js/utils';

import Button from '../../../UI/Button.vue';

export default {
  props: ['attach'],

  components: {
    Button
  },

  setup(props) {
    // eslint-disable-next-line vue/no-setup-props-destructure
    const [attach] = props.attach;
    const photo = attach.photo && getPhotoFromSizes(attach.photo.sizes, ['k', 'l', 'x']);

    return {
      url: attach.url,
      photo: photo && photo.url,
      horizontalPhoto: photo && (photo.width / photo.height >= 3 / 2) && photo.width > 300,
      title: attach.title,
      caption: attach.caption || attach.description,
      button: attach.button,

      openPage(url) {
        electron.shell.openItem(url);
      }
    };
  }
};
</script>

<style>
.attach_link {
  display: flex;
  background-color: var(--background);
  border: 1px solid var(--separator-dark);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}

.attach_link.horizontalPhoto {
  flex-direction: column;
}

.attach_link img {
  object-fit: cover;
}

.attach_link:not(.horizontalPhoto) img {
  min-width: 100px;
  max-height: 100px;
  border-right: 1px solid var(--separator-dark);
}

.attach_link.horizontalPhoto img {
  width: 100%;
  max-height: 200px;
  border-bottom: 1px solid var(--separator-dark);
}

.attach_link_content {
  margin: 10px;
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
}

.attach_link_content_caption {
  -webkit-line-clamp: 1;
  color: var(--text-dark-steel-gray);
  margin-top: 5px;
  font-size: 14px;
}

.attach_link.horizontalPhoto .attach_link_content_caption {
  -webkit-line-clamp: 2;
}

.attach_link_content .button {
  padding: 6px 8px;
  margin-top: 5px;
}
</style>
