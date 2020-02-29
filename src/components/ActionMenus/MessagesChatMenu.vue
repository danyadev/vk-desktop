<template>
  <ActionsMenu :hideList="!peer" ref="actionsMenu">
    <div class="act_menu_item" @click="goToFirstMsg">
      <Icon name="arrow_up" class="act_menu_icon" color="var(--text-secondary)" />
      <div class="act_menu_data">{{ l('im_go_to_first_msg') }}</div>
    </div>
    <div v-if="peer && peer.pinnedMsg" class="act_menu_item" @click="togglePinnedMsg">
      <Icon :name="showPinnedMsg ? 'unpin' : 'pin'" class="act_menu_icon" color="var(--text-secondary)" />
      <div class="act_menu_data">{{ l('im_toggle_pinned_msg', showPinnedMsg) }}</div>
    </div>
    <div class="act_menu_item" @click="toggleNotifications">
      <Icon :name="'volume_' + (muted ? 'active' : 'muted')" class="act_menu_icon" color="var(--text-secondary)" />
      <div class="act_menu_data">{{ l('im_toggle_notifications', !muted) }}</div>
    </div>
    <div v-if="!channel" class="act_menu_item" @click="clearHistory">
      <Icon name="trash" class="act_menu_icon" color="var(--text-secondary)" />
      <div class="act_menu_data">{{ l('im_clear_history') }}</div>
    </div>
    <div v-if="peer_id > 2e9" class="act_menu_item" @click="leftFromChat">
      <template v-if="left">
        <Icon name="forward" class="act_menu_icon" color="var(--text-secondary)" />
        <div class="act_menu_data">{{ l('im_toggle_left_state', channel ? 3 : 2) }}</div>
      </template>
      <template v-else>
        <Icon name="close" class="act_menu_icon left_icon" color="var(--text-secondary)" />
        <div class="act_menu_data">{{ l('im_toggle_left_state', channel ? 1 : 0) }}</div>
      </template>
    </div>
  </ActionsMenu>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { eventBus } from 'js/utils';

  import ActionsMenu from './ActionsMenu.vue';
  import Icon from '../UI/Icon.vue';

  export default {
    props: ['peer_id', 'peer'],

    components: {
      ActionsMenu,
      Icon
    },

    computed: {
      muted() {
        return this.peer && this.peer.muted;
      },
      left() {
        return this.peer && this.peer.left;
      },
      channel() {
        return this.peer && this.peer.channel;
      },
      hiddenPinnedMessages() {
        return { ...this.$store.getters['settings/settings'].hiddenPinnedMessages };
      },
      showPinnedMsg() {
        return !this.hiddenPinnedMessages[this.peer_id];
      }
    },

    methods: {
      goToFirstMsg() {
        this.$refs.actionsMenu.toggleMenu();

        eventBus.emit('messages:event', 'jump', {
          peer_id: this.peer_id,
          top: true
        });
      },

      togglePinnedMsg() {
        this.$refs.actionsMenu.toggleMenu();

        const list = this.hiddenPinnedMessages;

        if(this.showPinnedMsg) {
          list[this.peer_id] = true;
        } else {
          delete list[this.peer_id];
        }

        this.$store.commit('settings/updateMessagesSettings', {
          key: 'hiddenPinnedMessages',
          value: list
        });
      },

      toggleNotifications() {
        this.$refs.actionsMenu.toggleMenu();

        vkapi('account.setSilenceMode', {
          peer_id: this.peer_id,
          time: this.muted ? 0 : -1
        });
      },

      clearHistory() {
        this.$refs.actionsMenu.toggleMenu();

        this.$modals.open('clear-history', {
          peer_id: this.peer_id
        });
      },

      leftFromChat() {
        this.$refs.actionsMenu.toggleMenu();

        if(this.channel) {
          eventBus.emit('messages:event', 'changeLoadedState', {
            peer_id: this.peer_id,
            loadedUp: !this.left,
            loadedDown: !this.left
          });
        }

        vkapi(this.left ? 'messages.addChatUser' : 'messages.removeChatUser', {
          chat_id: this.peer_id - 2e9,
          user_id: this.$store.state.users.activeUser
        });
      }
    }
  }
</script>

<style scoped>
  .left_icon {
    padding: 1px;
  }
</style>
