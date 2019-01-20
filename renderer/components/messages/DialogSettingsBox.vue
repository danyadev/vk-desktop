<template>
  <div class="messages_settings_box" :class="{ active }">
    <div v-if="peer.type == 'user'" class="messages_settings_box_item" @click="openInBrowser">
      <img src="images/placeholder_user.png" class="messages_settings_box_item_icon">
      {{ l('dialog_settings_box', 0) }}
    </div>
    <div class="messages_settings_box_item" @click="changePushSettings">
      <img src="images/muted_gray.svg" class="messages_settings_box_item_icon mute">
      {{ l('toggle_notifications', Number(!peer.muted)) }}
    </div>
  </div>
</template>

<script>
  const { shell } = require('electron');

  module.exports = {
    props: ['peer', 'active'],
    data: () => ({
      entered: false,
      timeout: null
    }),
    methods: {
      openInBrowser() {
        shell.openExternal('https://vk.com/id' + this.peer.id);
      },
      changePushSettings() {
        vkapi('account.setSilenceMode', {
          peer_id: this.peer.id,
          time: this.peer.muted ? 0 : -1
        });
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
