<template>
  <div class="attach_wall_reply">
    <div class="attach_title">{{ l('im_attachments', 'wall_reply', [], 1) }}</div>

    <div class="attach_forwarded attach_left_border">
      <ForwardedMessage :msg="fakeMsg" />

      <div class="outline_button" @click="openComment">
        {{ l('im_open_comment') }}
      </div>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { parseAttachments } from 'js/messages';

export default {
  props: ['attach'],

  setup(props) {
    // eslint-disable-next-line vue/no-setup-props-destructure
    const [attach] = props.attach;

    function openComment() {
      let link = `https://vk.com/wall${attach.owner_id}_${attach.post_id}?reply=${attach.id}`;

      if (attach.parents_stack[0]) {
        link += `&thread=${attach.parents_stack[0]}`;
      }

      electron.shell.openItem(link);
    }

    return {
      openComment,

      fakeMsg: {
        from: attach.from_id,
        date: attach.date,
        text: attach.text,
        attachments: parseAttachments(attach.attachments || []),
        isContentDeleted: !attach.text && !attach.attachments
      }
    };
  }
};
</script>

<style>
.attach_wall_reply .attach_left_border::before {
  background: var(--forwarded-left-border);
}

.outline_button {
  color: var(--text-light-blue);
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 3px 16px;
  margin-top: 6px;
  font-size: 13px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
}
</style>
