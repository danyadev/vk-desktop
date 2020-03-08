<template>
  <ContextMenu>
    <div v-if="settings.devShowPeerId" class="act_menu_item">
      <Icon class="act_menu_icon" name="bug" color="#828a99" />
      <div class="act_menu_data">peer_id: {{ peerId }}</div>
    </div>

    <div v-if="peer.unread" class="act_menu_item" @click="markAsRead">
      <img src="assets/show.svg" class="act_menu_icon">
      <div class="act_menu_data">{{ l('im_mark_messages_as_read') }}</div>
    </div>

    <div class="act_menu_item" @click="toggleNotifications">
      <Icon :name="'volume_' + (peer.muted ? 'active' : 'muted')" color="#828a99" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('im_toggle_notifications', !peer.muted) }}</div>
    </div>

    <div v-if="!peer.channel" class="act_menu_item" @click="clearHistory">
      <img src="assets/trash.svg" class="act_menu_icon">
      <div class="act_menu_data">{{ l('im_clear_history') }}</div>
    </div>

    <div v-if="peerId > 2e9" class="act_menu_item" @click="leftFromChat">
      <template v-if="peer.left">
        <img src="assets/forward.svg" class="act_menu_icon">
        <div class="act_menu_data">{{ l('im_toggle_left_state', peer.channel ? 3 : 2) }}</div>
      </template>
      <template v-else>
        <img src="assets/close.svg" class="act_menu_icon left_icon">
        <div class="act_menu_data">{{ l('im_toggle_left_state', peer.channel ? 1 : 0) }}</div>
      </template>
    </div>
  </ContextMenu>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { eventBus } from 'js/utils';
  import { mapGetters } from 'vuex';

  import ContextMenu from './ContextMenu.vue';
  import Icon from '../UI/Icon.vue';

  export default {
    props: ['peerId'],

    components: {
      ContextMenu,
      Icon
    },

    computed: {
      ...mapGetters('settings', ['settings']),

      peer() {
        return this.$store.state.messages.conversations[this.peerId].peer;
      }
    },

    methods: {
      markAsRead() {
        vkapi('messages.markAsRead', {
          peer_id: this.peerId
        });
      },

      toggleNotifications() {
        vkapi('account.setSilenceMode', {
          peer_id: this.peerId,
          time: this.peer.muted ? 0 : -1
        });
      },

      clearHistory() {
        this.$modals.open('clear-history', {
          peer_id: this.peerId
        });
      },

      leftFromChat() {
        if(this.peer.channel) {
          eventBus.emit('messages:event', 'changeLoadedState', {
            peer_id: this.peerId,
            loadedUp: !this.peer.left,
            loadedDown: !this.peer.left
          });
        }

        vkapi(this.peer.left ? 'messages.addChatUser' : 'messages.removeChatUser', {
          chat_id: this.peerId - 2e9,
          user_id: this.$store.state.users.activeUser
        });
      }
    }
  }
</script>
