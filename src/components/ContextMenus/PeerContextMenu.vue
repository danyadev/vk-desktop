<template>
  <ContextMenu :event="event">
    <div v-if="settings.showObjectIds" class="act_menu_item" @click="copyPeerId">
      <Icon name="bug" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_peer_id') }}: {{ peerId }}</div>
    </div>

    <div
      v-if="pinnedPeers.length < 5 || isPinnedPeer"
      class="act_menu_item"
      @click="togglePinPeer"
    >
      <Icon
        :name="isPinnedPeer ? 'unpin_outline' : 'pin_outline'"
        color="var(--icon-blue)"
        class="act_menu_icon"
      />
      <div class="act_menu_data">{{ l('im_toggle_pin_peer', isPinnedPeer) }}</div>
    </div>

    <div v-if="peer.unread" class="act_menu_item" @click="markAsRead">
      <Icon name="message" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_mark_as_read') }}</div>
    </div>

    <div class="act_menu_item" @click="toggleNotifications">
      <Icon
        :name="peer.muted ? 'volume_active' : 'volume_muted'"
        color="var(--icon-blue)"
        class="act_menu_icon"
      />
      <div class="act_menu_data">{{ l('im_toggle_notifications', !peer.muted) }}</div>
    </div>

    <div v-if="!peer.isChannel" class="act_menu_item" @click="clearHistory">
      <Icon name="trash" color="var(--icon-red)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_clear_history') }}</div>
    </div>

    <div v-if="peerId > 2e9" class="act_menu_item" @click="leftFromChat">
      <template v-if="peer.left">
        <Icon name="door_in" color="var(--icon-blue)" class="act_menu_icon -door_in" />
        <div class="act_menu_data">{{ l('im_toggle_left_state', peer.isChannel ? 3 : 2) }}</div>
      </template>
      <template v-else>
        <Icon name="door_out" color="var(--icon-red)" class="act_menu_icon -door_out" />
        <div class="act_menu_data">{{ l('im_toggle_left_state', peer.isChannel ? 1 : 0) }}</div>
      </template>
    </div>
  </ContextMenu>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import electron from 'electron';
import { eventBus } from 'js/utils';
import { openModal } from 'js/modals';
import { addSnackbar } from 'js/snackbars';
import vkapi from 'js/vkapi';
import store from 'js/store';
import getTranslate from 'js/getTranslate';

import ContextMenu from './ContextMenu.vue';
import Icon from '../UI/Icon.vue';

export default {
  props: ['event', 'peerId'],

  components: {
    ContextMenu,
    Icon
  },

  setup(props) {
    const peer_id = +props.peerId;

    const state = reactive({
      settings: computed(() => store.getters['settings/settings']),
      peer: computed(() => store.state.messages.conversations[peer_id].peer),
      pinnedPeers: computed(() => store.state.messages.pinnedPeers),
      isPinnedPeer: computed(() => state.pinnedPeers.includes(peer_id))
    });

    function copyPeerId() {
      electron.clipboard.writeText(props.peerId);

      addSnackbar({
        text: getTranslate('im_peer_id_copied'),
        icon: 'copy'
      });
    }

    function togglePinPeer() {
      const { pinnedPeers, isPinnedPeer: isUnpin } = state;

      if (isUnpin) {
        pinnedPeers.splice(pinnedPeers.indexOf(peer_id), 1);
        store.commit('messages/moveConversation', { peer_id });
      } else {
        pinnedPeers.unshift(peer_id);
      }

      vkapi(
        isUnpin ? 'messages.unpinConversation' : 'messages.pinConversation',
        { peer_id },
        { android: true }
      );
    }

    function markAsRead() {
      vkapi('messages.markAsRead', {
        peer_id
      });
    }

    function toggleNotifications() {
      vkapi('account.setSilenceMode', {
        peer_id,
        time: state.peer.muted ? 0 : -1
      });
    }

    function clearHistory() {
      openModal('clear-history', {
        peer_id
      });
    }

    function leftFromChat() {
      if (state.peer.isChannel) {
        eventBus.emit('messages:event', 'changeLoadedState', {
          peer_id,
          loadedUp: !state.peer.left,
          loadedDown: !state.peer.left
        });
      }

      vkapi(state.peer.left ? 'messages.addChatUser' : 'messages.removeChatUser', {
        chat_id: peer_id - 2e9,
        user_id: store.state.users.activeUserID
      });
    }

    return {
      ...toRefs(state),

      copyPeerId,
      togglePinPeer,
      markAsRead,
      toggleNotifications,
      clearHistory,
      leftFromChat
    };
  }
};
</script>
