<template>
  <div class="header header_messages_toolbar">
    <div class="im_header_cancel_select text-overflow" @click="cancelSelect">
      <Icon name="close" color="var(--icon-dark-gray)" width="16" height="16" />

      <div class="im_header_selected_count text-overflow">
        {{ l('im_messages_count', [messages.length], messages.length) }}
      </div>
    </div>

    <div class="im_header_selected_actions">
      <Icon
        v-if="peer && !peer.isChannel"
        name="trash"
        color="var(--icon-dark-gray)"
        :data-tooltip="messages.length === 1 ? 'im_delete_msg' : 'im_delete_messages'"
        @click="deleteMessages(messages, peer, true)"
      />

      <Icon
        name="restrict"
        color="var(--icon-dark-gray)"
        data-tooltip="im_mark_msg_as_spam"
        @click="markAsSpam"
      />

      <Button
        v-if="peer.isWriteAllowed && (!peer.isCasperChat || messages.length === 1)"
        @click="reply"
      >
        {{ l(messages.length === 1 ? 'im_reply_msg_short' : 'im_forward_messages_here') }}
      </Button>

      <Button v-if="!peer.isCasperChat" @click="forward()">
        {{ l('im_forward_messages_short') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { getMessageById, deleteMessages } from 'js/messages';
import { openModal } from 'js/modals';
import store from 'js/store';
import vkapi from 'js/vkapi';
import router from 'js/router';

import Icon from '@/UI/Icon.vue';
import Button from '@/UI/Button.vue';

export default {
  props: ['peer_id', 'peer', 'messages'],

  components: {
    Icon,
    Button
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
  margin-right: 5px;
  flex: 1;
  cursor: pointer;
}

.im_header_cancel_select svg,
.im_header_selected_actions svg {
  flex: none;
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
  display: flex;
  align-items: center;
  margin-left: auto;
}

.im_header_selected_actions svg {
  margin-right: 15px;
}

.im_header_selected_actions .button {
  padding: 0 10px;
  margin-right: 8px;
  height: 28px;
  line-height: 28px;
  font-size: 14px;
  flex: none;
}
</style>
