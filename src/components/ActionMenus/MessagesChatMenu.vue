<template>
  <ActionsMenu ref="actionsMenu" :hideList="!peer">
    <div class="act_menu_item" @click="goToFirstMsg">
      <Icon name="arrow_up" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_go_to_first_msg') }}</div>
    </div>

    <div v-if="peer.pinnedMsg" class="act_menu_item" @click="togglePinnedMsg">
      <Icon
        :name="showPinnedMsg ? 'eye_hide_outline' : 'eye_show_outline'"
        color="var(--icon-blue)"
        class="act_menu_icon"
      />
      <div class="act_menu_data">{{ l('im_toggle_pinned_msg', showPinnedMsg) }}</div>
    </div>

    <div
      v-if="peer.pinnedMsg && peer.acl.can_change_pin"
      class="act_menu_item"
      @click="unpinMsg"
    >
      <Icon name="unpin_outline" color="var(--icon-blue)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_unpin_msg') }}</div>
    </div>

    <div class="act_menu_item" @click="toggleNotifications">
      <Icon
        :name="muted ? 'volume_active' : 'volume_muted'"
        color="var(--icon-blue)"
        class="act_menu_icon"
      />
      <div class="act_menu_data">{{ l('im_toggle_notifications', !muted) }}</div>
    </div>

    <div v-if="!isChannel" class="act_menu_item" @click="clearHistory">
      <Icon name="trash" color="var(--icon-red)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_clear_history') }}</div>
    </div>

    <div
      v-if="isChat && peer.chatState !== 'kicked'"
      class="act_menu_item"
      @click="leftFromChat"
    >
      <template v-if="left">
        <Icon name="door_in" color="var(--icon-blue)" class="act_menu_icon -door_in" />
        <div class="act_menu_data">{{ l('im_toggle_left_state', isChannel ? 3 : 2) }}</div>
      </template>
      <template v-else>
        <Icon name="door_out" color="var(--icon-red)" class="act_menu_icon -door_out" />
        <div class="act_menu_data">{{ l('im_toggle_left_state', isChannel ? 1 : 0) }}</div>
      </template>
    </div>
  </ActionsMenu>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { eventBus } from 'js/utils';
import { isChatPeerId, convertChatPeerIdToChatId } from 'js/api/ranges';
import { openModal } from 'js/modals';
import vkapi from 'js/vkapi';
import store from 'js/store';

import ActionsMenu from './ActionsMenu.vue';
import Icon from '@/UI/Icon.vue';

export default {
  props: ['peer_id', 'peer'],

  components: {
    ActionsMenu,
    Icon
  },

  setup(props) {
    const peerId = +props.peer_id;

    const state = reactive({
      actionsMenu: null,

      muted: computed(() => props.peer && props.peer.muted),
      left: computed(() => props.peer && props.peer.left),
      isChat: isChatPeerId(peerId),
      isChannel: computed(() => props.peer && props.peer.isChannel),
      hiddenPinnedMessages: computed(() => ({
        ...store.getters['settings/settings'].hiddenPinnedMessages
      })),
      showPinnedMsg: computed(() => !state.hiddenPinnedMessages[peerId])
    });

    function goToFirstMsg() {
      state.actionsMenu.setActive(false);

      eventBus.emit('messages:event', 'jump', {
        peer_id: peerId,
        top: true
      });
    }

    function togglePinnedMsg() {
      state.actionsMenu.setActive(false);

      const { hiddenPinnedMessages } = state;

      if (state.showPinnedMsg) {
        hiddenPinnedMessages[peerId] = true;
      } else {
        delete hiddenPinnedMessages[peerId];
      }

      store.commit('settings/updateUserSettings', {
        hiddenPinnedMessages
      });
    }

    function unpinMsg() {
      state.actionsMenu.setActive(false);

      vkapi('messages.unpin', {
        peer_id: peerId
      });
    }

    function toggleNotifications() {
      state.actionsMenu.setActive(false);

      vkapi('account.setSilenceMode', {
        peer_id: peerId,
        time: state.muted ? 0 : -1
      });
    }

    function clearHistory() {
      state.actionsMenu.setActive(false);

      openModal('clear-history', {
        peer_id: peerId
      });
    }

    function leftFromChat() {
      state.actionsMenu.setActive(false);

      if (state.isChannel) {
        eventBus.emit('messages:event', 'changeLoadedState', {
          peer_id: peerId,
          loadedUp: !state.left,
          loadedDown: !state.left
        });
      }

      vkapi(state.left ? 'messages.addChatUser' : 'messages.removeChatUser', {
        chat_id: convertChatPeerIdToChatId(peerId),
        user_id: store.state.users.activeUserID
      });
    }

    return {
      ...toRefs(state),

      goToFirstMsg,
      togglePinnedMsg,
      unpinMsg,
      toggleNotifications,
      clearHistory,
      leftFromChat
    };
  }
};
</script>
