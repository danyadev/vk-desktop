<template>
  <ContextMenu :event="event">
    <div v-if="settings.showObjectIds" class="act_menu_item" @click="copyMsgId">
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

    <div v-if="peer.id > 2e9 && peer.acl.can_change_pin" class="act_menu_item" @click="togglePin">
      <Icon
        :name="isPinnedMessage ? 'unpin' : 'pin'"
        color="var(--icon-blue)"
        class="act_menu_icon"
      />
      <div class="act_menu_data">{{ l('im_toggle_msg_pin', isPinnedMessage) }}</div>
    </div>

    <div v-if="msg && msg.id > peer.in_read" class="act_menu_item" @click="markAsRead">
      <Icon name="show" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_mark_as_read') }}</div>
    </div>

    <div
      v-if="!peer.isChannel && !hasCallAttach"
      class="act_menu_item"
      @click="deleteMessages([msg.id], peer)"
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
import { deleteMessages } from 'js/messages';
import { addSnackbar } from 'js/snackbars';
import { openModal } from 'js/modals';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';
import getTranslate from 'js/getTranslate';

import ContextMenu from './ContextMenu.vue';
import Icon from '../UI/Icon.vue';

export default {
  props: ['event', 'id'],

  components: {
    ContextMenu,
    Icon
  },

  setup(props) {
    const peer_id = +router.currentRoute.value.params.id;
    const msg_id = +props.id;

    const state = reactive({
      settings: computed(() => store.getters['settings/settings']),
      peer: computed(() => store.state.messages.conversations[peer_id].peer),

      msg: computed(() => {
        const messages = store.state.messages.messages[peer_id];
        return messages.find((msg) => msg.id === msg_id);
      }),

      isPinnedMessage: computed(() => {
        const { pinnedMsg } = state.peer;
        return (
          !!pinnedMsg &&
          state.msg &&
          pinnedMsg.conversation_msg_id === state.msg.conversation_msg_id
        );
      }),

      hasCallAttach: computed(() => state.msg && !!state.msg.attachments.call)
    });

    function copyMsgId() {
      electron.remote.clipboard.writeText(props.id);

      addSnackbar({
        text: getTranslate('im_message_id_copied'),
        icon: 'copy'
      });
    }

    function reply() {
      store.commit('messages/updatePeerConfig', {
        peer_id,
        replyMsg: state.msg,
        fwdMessages: null
      });
    }

    function forward() {
      store.state.messages.tmpForwardingMessages = [state.msg];

      router.replace({
        name: 'forward-to',
        params: {
          fromId: peer_id
        }
      });
    }

    function togglePin() {
      vkapi(state.isPinnedMessage ? 'messages.unpin' : 'messages.pin', {
        peer_id,
        message_id: msg_id
      });
    }

    function markAsRead() {
      vkapi('messages.markAsRead', {
        start_message_id: state.msg.id,
        peer_id
      });
    }

    function markAsSpam() {
      openModal('mark-as-spam', {
        count: 1,
        submit() {
          vkapi('messages.delete', {
            message_ids: state.msg.id,
            spam: 1
          });
        }
      });
    }

    return {
      ...toRefs(state),

      copyMsgId,
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
