<script>
import { h, Fragment } from 'vue';
import { getDay } from 'js/date';
import { isSameDay } from 'js/date/utils';
import { capitalize } from 'js/utils';

import MessagesGroup from './MessagesGroup.vue';
import Icon from '../../UI/Icon.vue';

export default {
  props: ['peer_id', 'peer', 'list', 'startInRead'],

  render(props) {
    const children = [];
    let activeGroup = [];
    let expiredMessages = 0;

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

    const addExpiredMark = () => {
      closeGroup();

      children.push(
        h('div', { class: 'message_expired_wrap' }, [
          h('div', { class: 'message_expired' }, [
            h(Icon, { name: 'bomb', color: 'var(--icon-gray)' }),
            this.l('im_messages_expired', [expiredMessages], expiredMessages)
          ])
        ])
      );

      expiredMessages = 0;
    }

    for (let i = 0; i < props.list.length; i++) {
      const prevMsg = props.list[i - 1];
      const msg = props.list[i];
      const nextMsg = props.list[i + 1];
      const messageDate = getMessageDate(msg, prevMsg);
      const isStartUnread = checkIsStartUnread(msg, prevMsg);

      if (expiredMessages && (messageDate || msg.action || isStartUnread)) {
        addExpiredMark();
      }

      if (messageDate) {
        closeGroup();

        children.push(
          h('div', { class: 'message_date' }, messageDate)
        );
      }

      if (msg.action) {
        // closeGroup();

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

      if (!msg.isExpired) {
        activeGroup.push(msg);
      } else {
        expiredMessages++;

        if (!(nextMsg && nextMsg.isExpired)) {
          addExpiredMark();
        }
      }
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

.message_expired_wrap {
  display: flex;
  justify-content: center;
  margin: 8px 0 4px 0;
}

.message_expired {
  display: flex;
  align-items: center;
  border: 1px solid var(--separator-dark);
  border-radius: 20px;
  color: var(--text-dark-steel-gray);
  padding: 5px 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .1);
}

.message_expired svg {
  margin-right: 5px;
}
</style>
