<script>
import { h } from 'vue';
import { getDay } from 'js/date';
import { isSameDay } from 'js/date/utils';
import { capitalize } from 'js/utils';

import Message from './Message.vue';

export default {
  props: ['peer_id', 'peer', 'list'],

  setup(props) {
    function getMessageDate(msg, prevMsg) {
      const prevMsgDate = prevMsg && new Date(prevMsg.date * 1000);
      const thisMsgDate = new Date(msg.date * 1000);

      if (!prevMsg || !isSameDay(prevMsgDate, thisMsgDate)) {
        return capitalize(getDay(thisMsgDate));
      }
    }

    const children = [];

    for (let i = 0; i < props.list.length; i++) {
      const msg = props.list[i];
      const prevMsg = props.list[i - 1];
      const messageDate = getMessageDate(msg, prevMsg);

      if (messageDate) {
        children.push(
          h('div', { class: 'message_date' }, messageDate)
        );
      }

      if (msg.action) {
        // TODO
        continue;
      }

      children.push(
        h(Message, {
          key: msg.id,
          props: {
            peer_id: props.peer_id,
            peer: props.peer,
            msg,
            prevMsg,
            messageDate
          }
        })
      );
    }

    return () => h('div', children);
  }
};
</script>

<style>
.message_date {
  text-align: center;
  margin: 10px 0 8px 0;
  color: #5d6165;
}
</style>
