<template>
  <div class="attach_wall">
    <div class="attach_title">{{ l('im_attachments', 'wall_reply', [], 1) }}</div>

    <Forwarded :messages="[fakeMsg]">
      <template #afterContent>
        <div class="outline_button" @click="openComment">
          {{ l('im_open_comment') }}
        </div>
      </template>
    </Forwarded>
  </div>
</template>

<script>
import electron from 'electron';
import { parseAttachments } from 'js/api/messages';
import getTranslate from 'js/getTranslate';

import Forwarded from './Forwarded.vue';

export default {
  props: ['attach'],

  components: {
    Forwarded
  },

  setup(props) {
    // eslint-disable-next-line vue/no-setup-props-destructure
    const [attach] = props.attach;

    function openComment() {
      let link = `https://vk.com/wall${attach.owner_id}_${attach.post_id}?reply=${attach.id}`;

      if (attach.parents_stack[0]) {
        link += `&thread=${attach.parents_stack[0]}`;
      }

      electron.shell.openExternal(link);
    }

    return {
      openComment,

      fakeMsg: {
        from: attach.from_id || 100,
        date: attach.date,
        text: attach.deleted
          ? getTranslate('im_deleted_comment')
          : attach.text.replace(/\n/g, '<br>'),
        attachments: parseAttachments(attach.attachments || []),
        isContentDeleted: !attach.deleted && !attach.text && !attach.attachments
      }
    };
  }
};
</script>
