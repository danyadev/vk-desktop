<script>
  import components from './attachments';

  export default {
    props: ['msg'],
    render(h) {
      const attachments = [];

      for(const attachment of this.msg.attachments) {
        const { type } = attachment;
        const component = components[type];

        if(component) {
          attachments.push(
            h(component, {
              props: {
                attach: attachment[type]
              }
            })
          );
        } else {
          attachments.push(
            h('div', { class: 'attach_unknown' }, `(${type})`)
          );
        }
      }

      if(attachments.length) {
        return h('div', { class: 'im_attachments' }, attachments);
      }
    }
  }
</script>

<style scoped>
  .im_attachments {
    display: flex;
    flex-direction: column;
  }

  .attach_unknown {
    color: #696969;
  }
</style>
