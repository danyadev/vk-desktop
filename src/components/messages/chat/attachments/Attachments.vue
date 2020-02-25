<script>
  import components from './attachments';

  export default {
    props: ['peer_id', 'msg', 'fwdDepth', 'showUserAvatar', 'hideBubble'],

    render(h) {
      const attachNames = Object.keys(this.msg.attachments);
      const hasStickerOrGift = attachNames.includes('sticker') || attachNames.includes('gift');
      const attachments = [];
      const layoutAttachs = {};
      const documentAttachs = [];

      for(const type in this.msg.attachments) {
        const attach = this.msg.attachments[type];
        const component = components[type];

        if(hasStickerOrGift && type != 'sticker' && type != 'gift') {
          continue;
        } else if(['photo', 'video', 'doc'].includes(type)) {
          if(type == 'doc') {
            const photoDocs = [];

            for(const doc of attach) {
              if(doc.preview && doc.preview.photo) photoDocs.push(doc);
              else documentAttachs.push(doc);
            }

            if(photoDocs.length) layoutAttachs.doc = photoDocs;
          } else {
            layoutAttachs[type] = attach;
          }
        } else if(component) {
          attachments.push(
            h(component, {
              props: {
                attach,
                peer_id: this.peer_id
              }
            })
          );
        } else {
          attachments.push(
            h('div', { class: 'im_attach_unknown' }, `(${type})`)
          );
        }
      }

      if(Object.keys(layoutAttachs).length) {
        attachments.unshift(
          h(components.photosLayout, {
            props: {
              attachments: layoutAttachs,
              peer_id: this.peer_id,
              fwdDepth: this.fwdDepth || 0,
              showUserAvatar: this.showUserAvatar,
              hideBubble: this.hideBubble
            }
          })
        );
      }

      if(documentAttachs.length) {
        attachments.push(
          ...documentAttachs.map((attach) => {
            return h(components.doc, {
              props: { attach }
            });
          })
        );
      }

      if(attachments.length) {
        return h('div', { class: 'im_attachments' }, attachments);
      }
    }
  }
</script>

<style>
  .im_attach_unknown {
    color: #696969;
  }

  .im_attachments > div:not(:first-child) {
    padding-top: 5px;
  }

  .attach_left_border::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 2px;
    border-radius: 1px;
    background-color: #5281b9;
  }
</style>
