<script>
  import components from './attachments';

  export default {
    props: ['peer_id', 'msg'],
    render(h) {
      const attachments = [];

      for(const type in this.msg.attachments) {
        const component = components[type];

        if(component) {
          attachments.push(
            h(component, {
              props: {
                attach: this.msg.attachments[type],
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
