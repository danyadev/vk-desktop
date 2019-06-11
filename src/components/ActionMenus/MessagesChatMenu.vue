<template>
  <ActionsMenu>
    <div class="act_menu_item" @click="toggleNotifications">
      <Icon :name="'volume_' + (muted ? 'active' : 'muted')" color="#828a99" class="act_menu_icon"/>
      <div class="act_menu_data">{{ l('im_toggle_notifications', !muted) }}</div>
    </div>
    <div class="act_menu_item" @click="clearHistory">
      <img src="assets/trash.svg" class="act_menu_icon">
      <div class="act_menu_data">{{ l('im_clear_history') }}</div>
    </div>
    <div v-if="peer_id > 2e9" class="act_menu_item" @click="leftFromChat">
      <img :src="`assets/${left ? 'forward' : 'close'}.svg`" :class="['act_menu_icon', { left_icon: !left }]">
      <div class="act_menu_data">{{ l('im_toggle_left_state', translateID) }}</div>
    </div>
  </ActionsMenu>
</template>

<script>
  import vkapi from 'js/vkapi';
  import ActionsMenu from './ActionsMenu.vue';
  import Icon from '../UI/Icon.vue';

  export default {
    props: ['peer_id'],
    components: {
      ActionsMenu,
      Icon
    },
    computed: {
      peer() {
        const conv = this.$store.state.messages.conversations[this.peer_id];

        return conv && conv.peer;
      },

      muted() {
        return this.peer && this.peer.muted;
      },
      left() {
        return this.peer && this.peer.left;
      },
      channel() {
        return this.peer && this.peer.channel;
      },

      translateID() {
        return this.channel
          ? (this.left ? 3 : 2)
          : (this.left ? 1 : 0);
      }
    },
    methods: {
      toggleNotifications() {
        vkapi('account.setSilenceMode', {
          peer_id: this.peer_id,
          time: this.muted ? 0 : -1
        });
      },
      clearHistory() {
        this.$modals.open('clear-history', {
          peer_id: this.peer_id
        });
      },
      leftFromChat() {
        const { id: user_id } = this.$store.getters['users/user'];
        const chat_id = this.peer_id - 2e9;
        const method = `messages.${this.left ? 'addChatUser' : 'removeChatUser'}`;

        vkapi(method, { chat_id, user_id });
      }
    }
  }
</script>

<style scoped>
  .left_icon {
    padding: 1px;
  }
</style>
