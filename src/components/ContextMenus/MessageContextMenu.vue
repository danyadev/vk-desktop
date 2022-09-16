<template>
  <ContextMenu :event="event">
    <div v-if="settings.showObjectIds" class="act_menu_item" @click="copyMessageId">
      <Icon name="bug" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_message_id') }}: {{ id }}</div>
    </div>

    <div v-if="peer.isWriteAllowed && !hasCallAttach" class="act_menu_item" @click="reply">
      <Icon name="reply" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_reply_msg') }}</div>
    </div>

    <div v-if="!hasCallAttach && !peer.isCasperChat" class="act_menu_item" @click="forward">
      <Icon name="forward" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_forward_message') }}</div>
    </div>

    <div v-if="isChat && peer.acl.can_change_pin" class="act_menu_item" @click="togglePin">
      <Icon
        :name="isPinnedMessage ? 'unpin_outline' : 'pin_outline'"
        color="var(--icon-blue)"
        class="act_menu_icon"
      />
      <div class="act_menu_data">{{ l('im_toggle_msg_pin', isPinnedMessage) }}</div>
    </div>

    <div v-if="message && message.id > peer.in_read" class="act_menu_item" @click="markAsRead">
      <Icon name="message" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_mark_as_read') }}</div>
    </div>

    <!-- TODO убрать hasCallAttach -->
    <div
      v-if="!peer.isChannel && !hasCallAttach"
      class="act_menu_item"
      @click="deleteMessages([message.id], peer)"
    >
      <Icon name="trash" color="var(--icon-red)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_delete_msg') }}</div>
    </div>

    <div class="act_menu_item" @click="markAsSpam">
      <Icon name="restrict" color="var(--icon-red)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_mark_msg_as_spam') }}</div>
    </div>
  </ContextMenu>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import electron from 'electron';
import { isChatPeerId } from 'js/api/ranges';
import { deleteMessages } from 'js/api/messages';
import { addSnackbar } from 'js/snackbars';
import { openModal } from 'js/modals';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';
import getTranslate from 'js/getTranslate';

import ContextMenu from './ContextMenu.vue';
import Icon from '@/UI/Icon.vue';

export default {
  props: ['event', 'id'],

  components: {
    ContextMenu,
    Icon
  },

  setup(props) {
    const peerId = +router.currentRoute.value.params.id;
    const messageId = +props.id;

    const state = reactive({
      settings: computed(() => store.getters['settings/settings']),
      peer: computed(() => store.state.messages.conversations[peerId].peer),
      isChat: isChatPeerId(peerId),

      message: computed(() => {
        const messages = store.state.messages.messages[peerId];
        return messages.find((msg) => msg.id === messageId);
      }),

      isPinnedMessage: computed(() => {
        const { pinnedMsg } = state.peer;
        return (
          !!pinnedMsg &&
          state.message &&
          pinnedMsg.conversation_msg_id === state.message.conversation_msg_id
        );
      }),

      hasCallAttach: computed(() => state.message && !!state.message.attachments.call)
    });

    function copyMessageId() {
      electron.clipboard.writeText(String(messageId));

      addSnackbar({
        text: getTranslate('im_message_id_copied'),
        icon: 'copy'
      });
    }

    function reply() {
      store.commit('messages/updatePeerConfig', {
        peer_id: peerId,
        replyMsg: state.message,
        fwdMessages: null
      });
    }

    function forward() {
      store.state.messages.tmpForwardingMessages = [state.message];

      router.replace({
        name: 'forward-to',
        params: {
          fromId: peerId
        }
      });
    }

    function togglePin() {
      vkapi(state.isPinnedMessage ? 'messages.unpin' : 'messages.pin', {
        peer_id: peerId,
        message_id: messageId
      });
    }

    function markAsRead() {
      vkapi('messages.markAsRead', {
        start_message_id: messageId,
        peer_id: peerId
      });
    }

    function markAsSpam() {
      openModal('mark-as-spam', {
        count: 1,
        submit() {
          vkapi('messages.delete', {
            message_ids: messageId,
            spam: 1
          });
        }
      });
    }

    return {
      ...toRefs(state),

      copyMessageId,
      reply,
      forward,
      togglePin,
      markAsRead,
      deleteMessages,
      markAsSpam
    };
  }
};
</script>
