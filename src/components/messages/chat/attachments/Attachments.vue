<script>
  import Sticker from './Sticker.vue';

  export default {
    props: ['msg'],
    render(h) {
      const attachments = [];
      const components = {
        sticker: Sticker
      };

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
  }
</style>
