<template>
  <div class="header header_messages_toolbar">
    <div class="im_header_cancel_select" @click="cancelSelect">
      <Icon name="close" color="var(--icon-dark-gray)" width="16" height="16" />

      <div class="im_header_selected_count">
        {{ l('im_messages_count', [messages.length], messages.length) }}
      </div>
    </div>

    <div class="im_header_selected_actions">
      <Icon
        v-if="
          messages.length && peer.isWriteAllowed && (
            !peer.isCasperChat || messages.length === 1
          )
        "
        name="reply"
        color="var(--icon-dark-gray)"
        :data-tooltip="messages.length === 1 ? 'im_reply_msg' : 'im_forward_messages_here'"
        @click="reply"
      />

      <Icon
        v-if="peer && !peer.isChannel"
        name="trash"
        color="var(--icon-dark-gray)"
        :data-tooltip="messages.length === 1 ? 'im_delete_msg' : 'im_delete_messages'"
        @click="deleteMessages(messages, peer, true)"
      />

      <Icon
        v-if="messages.length && !peer.isCasperChat"
        name="forward"
        color="var(--icon-dark-gray)"
        :data-tooltip="messages.length === 1 ? 'im_forward_message' : 'im_forward_messages'"
        @click="forward()"
      />

      <Icon
        name="restrict"
        color="var(--icon-dark-gray)"
        data-tooltip="im_mark_msg_as_spam"
        @click="markAsSpam"
      />
    </div>
  </div>
</template>

<script>
import { getMessageById, deleteMessages } from 'js/messages';
import { openModal } from 'js/modals';
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

    function forward(toThisChat) {
      if (toThisChat) {
        store.commit('messages/updatePeerConfig', {
          peer_id: props.peer_id,
          replyMsg: null,
          fwdMessages: props.messages.map((id) => getMessageById(id, props.peer_id))
        });
      } else {
        store.state.messages.tmpForwardingMessages = props.messages.map(
          (id) => getMessageById(id, props.peer_id)
        );

        router.replace({
          name: 'forward-to',
          params: {
            fromId: props.peer_id
          }
        });
      }

      cancelSelect();
    }

    function reply() {
      if (props.messages.length > 1) {
        return forward(true);
      }

      store.commit('messages/updatePeerConfig', {
        peer_id: props.peer_id,
        replyMsg: getMessageById(props.messages[0], props.peer_id),
        fwdMessages: null
      });

      cancelSelect();
    }

    function markAsSpam() {
      openModal('mark-as-spam', {
        count: props.messages.length,
        submit() {
          vkapi('messages.delete', {
            message_ids: props.messages.join(','),
            spam: 1
          });

          cancelSelect();
        }
      });
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
.im_header_cancel_select {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.im_header_cancel_select svg,
.im_header_selected_actions svg {
  cursor: pointer;
  opacity: .75;
  transition: opacity .3s;
}

.im_header_cancel_select:hover svg,
.im_header_selected_actions svg:hover {
  opacity: 1;
}

.im_header_cancel_select svg {
  box-sizing: content-box;
  padding: 16px 10px 15px 15px;
}

.im_header_selected_count {
  font-weight: 500;
}

.im_header_selected_actions {
  margin: 0 3px 0 auto;
}

.im_header_selected_actions svg {
  margin-right: 15px;
}
</style>
