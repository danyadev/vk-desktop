<template>
  <div class="attach_article">
    <img :src="photo.url" :width="photo.width">
    <div class="attach_article_content">
      <div class="attach_article_title">{{ title }}</div>
      <div class="attach_article_author text-overflow">
        {{ ownerName }}
        <Icon v-if="owner && owner.verified" name="verified" class="verified" />
      </div>
      <Button class="attach_article_button" @click="openPage(button.action.url)">
        {{ button.title }}
      </Button>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { computed } from 'vue';
import { loadProfile, getPhotoFromSizes } from 'js/utils';
import store from 'js/store';

import Icon from '../../../UI/Icon.vue';
import Button from '../../../UI/Button.vue';

export default {
  props: ['attach'],

  components: {
    Icon,
    Button
  },

  setup(props) {
    // eslint-disable-next-line vue/no-setup-props-destructure
    const [attach] = props.attach;
    const domain = attach.url.match(/@(.+?)-/)[1];

    const owner = computed(() => {
      const { profiles } = store.state;

      return profiles[domain] || Object.values(profiles).find((profile) => (
        profile.screen_name === domain ||
        profile.domain === domain ||
        profile.id === domain
      ));
    });

    const ownerName = computed(() => {
      const author = owner.value;
      return author
        ? author.name || (`${author.first_name} ${author.last_name}`)
        : (loadProfile(domain), '...');
    });

    return {
      photo: getPhotoFromSizes(attach.photo.sizes, ['y', 'x']),
      title: attach.title,
      owner,
      ownerName,
      button: attach.button,

      openPage(url) {
        electron.shell.openExternal(url);
      }
    };
  }
};
</script>

<style>
.attach_article {
  position: relative;
  width: 100%;
  max-width: 415px;
  overflow: hidden;
  border-radius: 14px;
}

.attach_article img {
  display: block;
  max-width: 100%;
  min-height: 180px;
  max-height: 250px;
}

.attach_article_content {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  padding: 0 10px;
  color: var(--text-white);
  background: rgba(0, 0, 0, .4);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.attach_article_title {
  margin-bottom: 10px;
  font-weight: 500;
  font-size: 18px;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.attach_article_author {
  margin-bottom: 20px;
  width: 100%;
}

.attach_article .verified {
  color: #fff;
  margin-bottom: 2px;
}

.attach_article_title,
.attach_article_author {
  text-shadow: 0 4px 12px rgba(0, 0, 0, .4);
  text-align: center;
}

.attach_article_button {
  background: #fff;
  color: #000;
  line-height: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, .4);
}
</style>
