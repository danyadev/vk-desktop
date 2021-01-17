<script>
import { h } from 'vue';
import components from '.';

export default {
  props: ['attachments'],

  render(props) {
    const attachments = [];
    const attachNames = Object.keys(props.attachments);
    // Вложения, с которыми не будут отображаться другие вложения (будут скрыты)
    const singleAttachments = ['sticker', 'gift'];
    const hasSingleAttach = singleAttachments.some((attach) => attachNames.includes(attach));

    const layoutAttachs = {};
    const documentAttachs = [];

    for (const type in props.attachments) {
      const attach = props.attachments[type];
      const component = components[type];

      if (hasSingleAttach && !singleAttachments.includes(type)) {
        continue;
      }

      if (['photo', 'video', 'doc'].includes(type)) {
        if (type === 'doc') {
          const photoDocs = [];

          for (const doc of attach) {
            if (doc.preview && doc.preview.photo) {
              photoDocs.push(doc);
            } else {
              documentAttachs.push(doc);
            }
          }

          if (photoDocs.length) {
            layoutAttachs.doc = photoDocs;
          }
        } else {
          layoutAttachs[type] = attach;
        }
      } else if (component) {
        attachments.push(
          h(component, { attach })
        );
      } else {
        attachments.push(
          h('div', { class: 'im_attach_unknown' }, `(${type})`)
        );
      }
    }

    if (Object.keys(layoutAttachs).length) {
      attachments.unshift(
        h(components.photosLayout, {
          attachments: layoutAttachs
        })
      );
    }

    // if(documentAttachs.length) {
    //   attachments.push(
    //     ...documentAttachs.map((attach) => {
    //       return h(components.doc, { attach });
    //     })
    //   );
    // }

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
  margin-top: 5px;
}

.message:not(.hasForward) .message_bubble_content > .im_attachments > .im_attach_unknown:last-child {
  /* Убираем слишком большой отступ от конца сообщения */
  margin-bottom: -5px;
}

.message.hasPhoto .message_bubble_content > .attach_forwarded,
.message.hasPhoto .message_bubble_content > .im_attachments > div:not(.attach_photos_wrap) {
  margin-left: 5px;
  margin-right: 5px;
}

.attach_left_border::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  border-radius: 1px;
  background: var(--attach-left-border);
}

.attach_title {
  font-size: 13px;
  margin-bottom: 4px;
  color: var(--text-dark-steel-gray);
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
