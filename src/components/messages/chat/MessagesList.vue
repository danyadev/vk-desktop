<script>
import { h, Fragment } from 'vue';
import { getDay } from 'js/date';
import { isSameDay } from 'js/date/utils';
import { capitalize } from 'js/utils';

import MessagesGroup from './MessagesGroup.vue';

export default {
  props: ['peer_id', 'peer', 'list'],

  render(props) {
    function getMessageDate(msg, prevMsg) {
      const prevMsgDate = prevMsg && new Date(prevMsg.date * 1000);
      const thisMsgDate = new Date(msg.date * 1000);

      if (!prevMsg || !isSameDay(prevMsgDate, thisMsgDate)) {
        return capitalize(getDay(thisMsgDate));
      }
    }

    const children = [];
    let activeGroup;

    function closeGroup() {
      if (activeGroup) {
        children.push(
          h(MessagesGroup, {
            peer_id: props.peer_id,
            peer: props.peer,
            messages: activeGroup
          })
        );

        activeGroup = null;
      }
    }

    for (let i = 0; i < props.list.length; i++) {
      const msg = props.list[i];
      const prevMsg = props.list[i - 1];
      const messageDate = getMessageDate(msg, prevMsg);

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

      // || start unread
      if (prevMsg && prevMsg.from !== msg.from) {
        closeGroup();
      }

      if (!activeGroup) {
        activeGroup = [];
      }

      activeGroup.push(msg);
    }

    closeGroup();

    return h(Fragment, children);
  }
};
</script>

<style>
.message_date {
  text-align: center;
  margin: 10px 0 8px 0;
  color: var(--text-dark-steel-gray);
}
</style>
