<template>
  <ContextMenu :event="event">
    <div v-if="settings.devShowObjectIds" class="act_menu_item" @click="copyMsgId">
      <Icon name="bug" color="var(--icon-dark-gray)" class="act_menu_icon" />
      <div class="act_menu_data">msg_id: {{ id }}</div>
    </div>

    <div v-if="peer.id > 2e9 && peer.acl.can_change_pin" class="act_menu_item" @click="togglePin">
      <Icon
        :name="isPinnedMessage ? 'unpin' : 'pin'"
        color="var(--icon-dark-gray)"
        class="act_menu_icon"
      />
      <div class="act_menu_data">{{ l('im_toggle_msg_pin', isPinnedMessage) }}</div>
    </div>

    <div v-if="msg.text" class="act_menu_item" @click="copy">
      <Icon name="copy" color="var(--icon-dark-gray)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_copy_msg') }}</div>
    </div>

    <div v-if="msg.id > peer.in_read" class="act_menu_item" @click="markAsRead">
      <Icon name="show" color="var(--icon-dark-gray)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_mark_as_read') }}</div>
    </div>

    <div v-if="!peer.isChannel" class="act_menu_item" @click="deleteMsg">
      <Icon name="trash" color="var(--icon-dark-gray)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_delete_msg') }}</div>
    </div>

    <div class="act_menu_item" @click="markAsSpam">
      <Icon name="spam" color="var(--icon-dark-gray)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_mark_msg_as_spam') }}</div>
    </div>
  </ContextMenu>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import electron from 'electron';
import { openModal } from 'js/modals';
import { addSnackbar } from 'js/snackbars';
import getTranslate from 'js/getTranslate';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';

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
        return !!pinnedMsg && pinnedMsg.conversation_msg_id === state.msg.conversation_msg_id;
      })
    });

    function copyMsgId() {
      electron.remote.clipboard.writeText(props.id);

      addSnackbar({
        text: getTranslate('im_message_id_copied'),
        icon: 'copy'
      });
    }

    function togglePin() {
      const method = state.isPinnedMessage ? 'messages.unpin' : 'messages.pin';

      vkapi(method, {
        peer_id,
        message_id: msg_id
      });
    }

    function copy() {
      electron.remote.clipboard.writeText(state.msg.text);

      addSnackbar({
        text: getTranslate('im_message_copied'),
        icon: 'copy'
      });
    }

    function markAsRead() {
      vkapi('messages.markAsRead', {
        start_message_id: state.msg.id,
        peer_id
      });
    }

    function deleteMsg() {
      const currentUser = store.state.users.activeUser;

      const canDeleteForAll = (
        state.peer.id > 2e9 &&
        state.peer.acl.can_moderate &&
        !state.peer.admin_ids.includes(state.msg.from)
      );

      openModal('delete-messages', {
        count: 1,
        canDeleteForAll,

        submit(deleteForAll) {
          vkapi('messages.delete', {
            message_ids: state.msg.id,
            delete_for_all: currentUser === state.peer.id || deleteForAll
          });
        }
      });
    }

    function markAsSpam() {
      vkapi('messages.delete', {
        message_ids: state.msg.id,
        spam: 1
      });
    }

    return {
      ...toRefs(state),

      copyMsgId,
      togglePin,
      copy,
      markAsRead,
      deleteMsg,
      markAsSpam
    };
  }
};
</script>
