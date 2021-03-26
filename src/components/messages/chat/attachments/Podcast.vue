<template>
  <Link :attach="[linkAttach]" />
</template>

<script>
import getTranslate from 'js/getTranslate';

import Link from './Link.vue';

export default {
  props: ['attach'],

  components: {
    Link
  },

  setup(props) {
    // eslint-disable-next-line vue/no-setup-props-destructure
    const [attach] = props.attach;
    const url = `https://vk.com/podcast${attach.owner_id}_${attach.id}`;

    return {
      linkAttach: {
        url,
        photo: attach.podcast_info.cover,
        forceLeftPhoto: true,
        title: attach.title,
        caption: attach.artist,
        button: {
          title: getTranslate('listen'),
          action: { url }
        }
      }
    };
  }
};
</script>
