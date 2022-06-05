<template>
  <div class="attach_wall">
    <div class="attach_title">{{ l('im_attachments', 'wall', [], 1) }}</div>

    <Forwarded :messages="[fakeMsg]">
      <template #afterContent>
        <Forwarded v-if="postReply" :messages="[postReply]" />

        <div class="outline_button" @click="openWall">
          {{ l('im_open_wall') }}
        </div>
      </template>
    </Forwarded>
  </div>
</template>

<script>
import electron from 'electron';
import { parseAttachments } from 'js/messages';

import Forwarded from './Forwarded.vue';

export default {
  props: ['attach'],

  components: {
    Forwarded
  },

  setup(props) {
    // eslint-disable-next-line vue/no-setup-props-destructure
    const [attach] = props.attach;

    function openWall() {
      electron.shell.openExternal(`https://vk.com/wall${attach.to_id}_${attach.id}`);
    }

    function generateMessage(attach) {
      return {
        from: attach.from_id,
        date: attach.date,
        text: attach.text.replace(/\n/g, '<br>'),
        attachments: parseAttachments(attach.attachments || []),
        isContentDeleted: !attach.text && !attach.attachments && !attach.copy_history
      };
    }

    if (attach.geo) {
      (attach.attachments || (attach.attachments = [])).push({
        type: 'geo',
        geo: attach.geo
      });
    }

    const postReply = attach.copy_history && attach.copy_history[0];

    return {
      openWall,
      fakeMsg: generateMessage(attach),
      postReply: postReply && generateMessage(postReply)
    };
  }
};
</script>
