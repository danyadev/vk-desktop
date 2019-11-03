<script>
  import { isSameDay } from 'date-fns';
  import { getMessageDate } from 'js/date';
  import { capitalize } from 'js/utils';
  import { getServiceMessage } from 'js/messages';

  import Message from './Message.vue';

  export default {
    props: ['peer_id', 'list'],

    computed: {
      peer() {
        const conv = this.$store.state.messages.conversations[this.peer_id];
        return conv && conv.peer;
      },
      in_read() {
        return this.peer && (this.peer.new_in_read || this.peer.in_read);
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

        return !msg.out && !isPrevUnread && isThisUnread;
      },
      serviceMessage(msg) {
        if(msg.action) {
          const user = this.$store.state.profiles[msg.from];
          return getServiceMessage(msg.action, user || { id: msg.from }, true);
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
          children.push(
            h('div', {
              class: ['service_message', msg.id > this.in_read && 'isUnread'],
              domProps: {
                innerHTML: serviceMessage,
                id: msg.id
              }
            })
          );

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
    padding: 5px 14px 5px 14px;
    text-align: center;
    color: #5d6165;
  }

  .service_message >>> b {
    font-weight: 500;
  }
</style>
