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

    return {
      linkAttach: {
        url: attach.url,
        photo: { sizes: attach.photo },
        forceLeftPhoto: true,
        title: attach.name,
        caption: getTranslate('im_attachments', 'curator', [], 1),
        button: {
          title: getTranslate('listen'),
          action: { url: attach.url }
        }
      }
    };
  }
};
</script>
