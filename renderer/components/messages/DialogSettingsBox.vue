<template>
  <div class="messages_settings_box" :class="{ active }">
    <div v-if="peer.id < 2e9" class="messages_settings_box_item" @click="openInBrowser">
      <img src="images/user.svg" class="messages_settings_box_item_icon">
      {{ l('dialog_settings_box', 0) }}
    </div>
    <div class="messages_settings_box_item" @click="changePushSettings">
      <img :src="`images/mute_${peer.muted ? 'on' : 'off'}.svg`" class="messages_settings_box_item_icon">
      {{ l('toggle_notifications', Number(!peer.muted)) }}
    </div>
    <div class="messages_settings_box_item" @click="setHiddenDialogs(!hiddenDialogs)">
      <img :src="`images/${hiddenDialogs ? 'show' : 'hide'}.svg`" class="messages_settings_box_item_icon">
      {{ l('toggle_hidden_dialogs', Number(hiddenDialogs)) }}
    </div>
    <div v-if="peer.id > 2e9" class="messages_settings_box_item" @click="exitFromChat">
      <img :src="`images/${peer.left ? 'return_to_chat' : 'cancel'}.svg`" class="messages_settings_box_item_icon">
      {{ l('exit_from_chat', Number(peer.left)) }}
    </div>
  </div>
</template>

<script>
  const { shell } = require('electron');
  const { mapState, mapMutations } = Vuex;

  module.exports = {
    props: ['peer', 'active'],
    data: () => ({
      entered: false,
      timeout: null
    }),
    computed: {
      ...mapState('settings', ['hiddenDialogs'])
    },
    methods: {
      ...mapMutations('settings', ['setHiddenDialogs']),
      openInBrowser() {
        shell.openExternal('https://vk.com/id' + this.peer.id);
      },
      changePushSettings() {
        vkapi('account.setSilenceMode', {
          peer_id: this.peer.id,
          time: this.peer.muted ? 0 : -1
        });
      },
      exitFromChat() {
        if(!this.peer.left) {
          vkapi('messages.removeChatUser', {
            chat_id: this.peer.id - 2e9,
            member_id: app.user.id
          });
        } else {
          vkapi('messages.addChatUser', {
            chat_id: this.peer.id - 2e9,
            user_id: app.user.id
          });
        }
      },
      leave() {
        this.entered = false;
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
          if(!this.entered) {
            this.active = false;
            this.$emit('close');
            document.body.removeEventListener('mousemove', this.mousemove);
          } else this.entered = false;
        }, 500);
      },
      mousemove(event) {
        let hasClose = !event.path.find((el) => {
          if(!el.classList) return;
          return el.classList.contains('messages_settings_box') || el.classList.contains('dialog_actions_btn');
        });

        if(hasClose) this.leave();
        else this.entered = true;
      }
    },
    watch: {
      active(value) {
        if(value) {
          document.body.addEventListener('mousemove', this.mousemove);
        }
      }
    }
  }
</script>
