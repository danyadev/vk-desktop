<script>
  import { isSameDay } from 'date-fns';
  import { getMessageDate } from 'js/date';
  import { capitalize, getPhotoFromSizes } from 'js/utils';
  import { getServiceMessage } from 'js/messages';

  import Message from './Message.vue';

  export default {
    props: ['peer_id', 'peer', 'list', 'showStartUnread'],

    computed: {
      in_read() {
        return this.peer && this.peer.in_read;
      }
    },

    methods: {
      messageDate(msg, prevMsg) {
        const prevMsgDate = prevMsg && new Date(prevMsg.date * 1000);
        const thisMsgDate = new Date(msg.date * 1000);

        if(!prevMsg || !isSameDay(prevMsgDate, thisMsgDate)) {
          return capitalize(getMessageDate(thisMsgDate));
        }
      },
      isStartUnread(msg, prevMsg) {
        const isPrevUnread = prevMsg && prevMsg.id > this.in_read;
        const isThisUnread = msg.id > this.in_read;

        return this.showStartUnread && !msg.out && !isPrevUnread && isThisUnread;
      },
      serviceMessage(msg) {
        if(msg.action) {
          const user = this.$store.state.profiles[msg.from];
          return getServiceMessage(msg.action, user || { id: msg.from }, this.peer_id, true);
        }
      }
    },

    render(h) {
      const children = [];

      for(const i in this.list) {
        const msg = this.list[i];
        const prevMsg = this.list[i-1];

        const messageDate = this.messageDate(msg, prevMsg);
        const isStartUnread = this.isStartUnread(msg, prevMsg);
        const serviceMessage = this.serviceMessage(msg);

        if(messageDate) {
          children.push(
            h('div', { class: 'message_date' }, messageDate)
          );
        }

        if(isStartUnread) {
          children.push(
            h('div', { class: 'message_unreaded_messages' }, [
              h('span', this.l('im_unread_messages'))
            ])
          );
        }

        if(serviceMessage) {
          if(msg.attachments.photo) {
            const [attach] = msg.attachments.photo;

            children.push(
              h('div', {
                class: ['service_message', 'hasPhoto', msg.id > this.in_read && 'isUnread'],
                domProps: {
                  id: msg.id
                }
              }, [
                h('span', {
                  domProps: {
                    innerHTML: serviceMessage
                  }
                }),
                h('img', {
                  class: 'service_message_photo',
                  domProps: {
                    src: attach ? getPhotoFromSizes(attach.sizes, 'q').url : 'assets/blank.gif'
                  }
                })
              ])
            );
          } else {
            children.push(
              h('div', {
                class: ['service_message', msg.id > this.in_read && 'isUnread'],
                domProps: {
                  id: msg.id,
                  innerHTML: serviceMessage
                }
              })
            );
          }

          continue;
        }

        children.push(
          h(Message, {
            key: msg.id,
            props: {
              peer_id: this.peer_id,
              peer: this.peer,
              msg,
              messageDate,
              isStartUnread,
              prevMsg
            }
          })
        );
      }

      return h('div', children);
    }
  }
</script>

<style scoped>
  .message_date, .message_unreaded_messages {
    text-align: center;
    margin: 10px 0 8px 0;
    color: #5d6165;
  }

  .message_unreaded_messages {
    position: relative;
  }

  .message_unreaded_messages span {
    position: relative;
    background: #fff;
    padding: 0 10px;
  }

  .message_unreaded_messages::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    height: 1px;
    width: 100%;
    background: #d4d6da;
  }

  .service_message {
    text-align: center;
    padding: 5px 14px 5px 14px;
    color: #5d6165;
  }

  .service_message.hasPhoto {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .service_message >>> b {
    font-weight: 500;
  }

  .service_message img {
    width: 100px;
    height: 100px;
    margin-top: 10px;
    border-radius: 50%;
    object-fit: contain;
  }
</style>
