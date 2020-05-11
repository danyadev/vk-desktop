<script>
import { h } from 'vue';

export default {
  props: ['msg'],

  render(props) {
    const attachments = [];

    for (const type in props.msg.attachments) {
      attachments.push(
        h('div', { class: 'im_attach_unknown' }, `(${type})`)
      );
    }

    if (attachments.length) {
      return h('div', { class: 'im_attachments' }, attachments);
    }
  }
};
</script>

<style>
.im_attach_unknown {
  color: var(--text-dark-steel-gray);
}

.im_attachments {
  user-select: none;
}

.im_attachments > div:not(:first-child) {
  padding-top: 5px;
}

.im_attachments .im_attach_unknown:last-child {
  margin-bottom: -5px;
}

.attach_left_border::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  border-radius: 1px;
  background-color: var(--blue-background);
}
</style>
