<template>
  <div class="attach_wall">
    <div class="attach_title">{{ l('im_attachments', 'wall', [], 1) }}</div>

    <Forwarded :messages="[fakeMsg]">
      <template #afterContent>
        <Forwarded v-if="postReply" :messages="[postReply]" />

        <div v-if="donutText" class="attach_wall_donut">
          <Icon name="donut_outline_56" color="var(--icon-gray)" />
          <span class="attach_wall_donut_text">{{ donutText }}</span>
        </div>

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
import Icon from '@/UI/Icon.vue';

export default {
  props: ['attach'],

  components: {
    Forwarded,
    Icon
  },

  setup(props) {
    // eslint-disable-next-line vue/no-setup-props-destructure
    const [attach] = props.attach;
    const postReply = attach.copy_history && attach.copy_history[0];

    if (attach.geo) {
      // TODO: вложение точно не может дублироваться?
      (attach.attachments || (attach.attachments = [])).push({
        type: 'geo',
        geo: attach.geo
      });
    }

    function openWall() {
      electron.shell.openExternal(`https://vk.com/wall${attach.to_id}_${attach.id}`);
    }

    function generateMessage(attach) {
      return {
        from: attach.from_id,
        date: attach.date,
        text: (attach.text || '').replace(/\n/g, '<br>'),
        attachments: parseAttachments(attach.attachments || []),
        isContentDeleted: (
          !attach.text && !attach.attachments && !attach.copy_history && !attach.donut
        )
      };
    }

    return {
      fakeMsg: generateMessage(attach),
      donutText: attach.donut.is_donut && attach.donut.placeholder.text,
      postReply: postReply && generateMessage(postReply),
      openWall
    };
  }
};
</script>

<style>
.attach_wall_donut {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto;
  padding: 40px 20px;
  color: var(--text-dark-steel-gray);
  background: var(--background-light);
  border-radius: 5px;
}

.attach_wall_donut svg {
  margin-bottom: 20px;
}

.attach_wall_donut_text {
  max-width: 300px;
}
</style>
