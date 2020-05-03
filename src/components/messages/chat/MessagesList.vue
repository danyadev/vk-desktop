<script>
import { h, Fragment } from 'vue';
import { getDay } from 'js/date';
import { isSameDay } from 'js/date/utils';
import { capitalize } from 'js/utils';

import MessagesGroup from './MessagesGroup.vue';

export default {
  props: ['peer_id', 'peer', 'list', 'startInRead'],

  render(props) {
    const children = [];
    let activeGroup = [];

    function getMessageDate(msg, prevMsg) {
      const prevMsgDate = prevMsg && new Date(prevMsg.date * 1000);
      const thisMsgDate = new Date(msg.date * 1000);

      if (!prevMsg || !isSameDay(prevMsgDate, thisMsgDate)) {
        return capitalize(getDay(thisMsgDate));
      }
    }

    function checkIsStartUnread(msg, prevMsg) {
      const isPrevUnread = prevMsg && prevMsg.id > props.startInRead;
      const isThisUnread = msg.id > props.startInRead;

      return !msg.out && !isPrevUnread && isThisUnread;
    }

    function closeGroup() {
      if (activeGroup.length) {
        children.push(
          h(MessagesGroup, {
            peer_id: props.peer_id,
            peer: props.peer,
            messages: activeGroup
          })
        );

        activeGroup = [];
      }
    }

    for (let i = 0; i < props.list.length; i++) {
      const msg = props.list[i];
      const prevMsg = props.list[i - 1];
      const messageDate = getMessageDate(msg, prevMsg);
      const isStartUnread = checkIsStartUnread(msg, prevMsg);

      if (messageDate) {
        closeGroup();

        children.push(
          h('div', { class: 'message_date' }, messageDate)
        );
      }

      if (msg.action) {
        // closeGroup()

        // TODO
        continue;
      }

      if (isStartUnread) {
        closeGroup();

        children.push(
          h('div', { class: 'message_unreaded_messages' }, [
            h('span', this.l('im_unread_messages'))
          ])
        );
      }

      if (prevMsg && prevMsg.from !== msg.from) {
        closeGroup();
      }

      activeGroup.push(msg);
    }

    closeGroup();

    return h(Fragment, children);
  }
};
</script>

<style>
.message_date, .message_unreaded_messages {
  text-align: center;
  margin: 10px 0 8px 0;
  color: var(--text-dark-steel-gray);
}

.message_unreaded_messages {
  position: relative;
}

.message_unreaded_messages span {
  position: relative;
  background: var(--background);
  padding: 0 10px;
}

.message_unreaded_messages::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  height: 1px;
  width: 100%;
  background: var(--separator-dark);
}
</style>
