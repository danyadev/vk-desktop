<script>
  import components from './attachments';

  export default {
    props: ['peer_id', 'msg'],
    render(h) {
      const attachments = [];
      const layoutAttachs = {};
      const documentAttachs = [];

      for(const type in this.msg.attachments) {
        const attach = this.msg.attachments[type];
        const component = components[type];

        if(['photo', 'video', 'doc'].includes(type)) {
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
        attachments.push(
          h(components.photosLayout, {
            props: {
              attachments: layoutAttachs,
              peer_id: this.peer_id
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
</style>
