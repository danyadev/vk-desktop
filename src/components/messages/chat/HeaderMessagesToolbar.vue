<template>
  <div class="header header_messages_toolbar">
    <Icon
      name="close"
      color="var(--icon-gray)"
      width="16"
      height="16"
      class="im_header_cancel_select"
      @click="cancelSelect"
    />

    <div class="im_header_selected_count roboto-vk">
      {{ l('im_selected_messages_count', [messages.length], messages.length) }}
    </div>

    <div class="im_header_selected_actions">
      <Icon
        v-if="
          messages.length && peer.isWriteAllowed && (
            !peer.isCasperChat || messages.length === 1
          )
        "
        name="reply"
        color="var(--icon-gray)"
        :data-tooltip="messages.length === 1 ? 'im_reply_msg' : 'im_forward_messages_here'"
        @click="reply"
      />

      <Icon
        v-if="peer && !peer.isChannel"
        name="trash"
        color="var(--icon-gray)"
        :data-tooltip="messages.length === 1 ? 'im_delete_msg' : 'im_delete_messages'"
        @click="deleteMessages(messages, peer, true)"
      />

      <Icon
        v-if="messages.length && !peer.isCasperChat"
        name="forward"
        color="var(--icon-gray)"
        :data-tooltip="messages.length === 1 ? 'im_forward_message' : 'im_forward_messages'"
        @click="forward()"
      />

      <Icon
        name="spam"
        color="var(--icon-gray)"
        data-tooltip="im_mark_msg_as_spam"
        @click="markAsSpam"
      />
    </div>
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { eventBus } from 'js/utils';
import { getMessageById, deleteMessages } from 'js/messages';
import store from 'js/store';
import vkapi from 'js/vkapi';
import router from 'js/router';

import Icon from '../../UI/Icon.vue';

export default {
  props: ['peer_id', 'peer', 'messages'],

  components: {
    Icon
  },

  setup(props) {
    function cancelSelect() {
      store.commit('messages/removeSelectedMessages');
    }

    function scrollToEnd() {
      eventBus.emit('messages:event', 'jump', {
        peer_id: props.peer_id,
        bottom: true
      });
    }

    async function forward(toThisChat) {
      if (toThisChat) {
        eventBus.emit('messages:replyOrForward', {
          type: 'forward',
          data: props.messages.map((id) => getMessageById(id, props.peer_id))
        });

        await nextTick();
        scrollToEnd();
      } else {
        store.state.messages.tmpForwardingMessages = props.messages.map(
          (id) => getMessageById(id, props.peer_id)
        );

        eventBus.emit('messages:event', 'closeChat', {
          peer_id: props.peer_id
        });

        router.replace({
          name: 'forward-to',
          params: {
            fromId: props.peer_id
          }
        });
      }

      cancelSelect();
    }

    async function reply() {
      if (props.messages.length > 1) {
        return forward(true);
      }

      eventBus.emit('messages:replyOrForward', {
        type: 'reply',
        data: getMessageById(props.messages[0], props.peer_id)
      });

      cancelSelect();
      await nextTick();
      scrollToEnd();
    }

    function markAsSpam() {
      vkapi('messages.delete', {
        message_ids: props.messages.join(','),
        spam: 1
      });

      cancelSelect();
    }

    return {
      cancelSelect,
      reply,
      deleteMessages,
      forward,
      markAsSpam
    };
  }
};
</script>

<style>
.im_header_cancel_select,
.im_header_selected_actions svg {
  cursor: pointer;
}

.im_header_cancel_select {
  box-sizing: content-box;
  padding: 15px;
  transition: color .3s;
}

.im_header_selected_count {
  font-weight: 500;
}

.im_header_selected_actions {
  margin: 0 3px 0 auto;
}

.im_header_selected_actions svg {
  margin-right: 15px;
  transition: color .3s;
}

.im_header_selected_actions svg:hover,
.im_header_cancel_select:hover {
  color: var(--icon-dark-gray);
}
</style>
