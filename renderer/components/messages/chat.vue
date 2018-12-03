<template>
  <div class="dialog_container" tabindex="0" @keyup.esc="closeChat">
    <div class="header">
      <template v-if="peer">
        <img class="dialog_back" src="images/im_back.png" @click="closeChat">
        <div class="dialog_name_wrap">
          <div class="dialog_name" v-emoji>{{ title }}</div>
          <div class="dialog_online">{{ online }}</div>
        </div>
        <img src="images/actions_button.svg" class="dialog_actions_btn">
      </template>
    </div>
    <div v-if="!id" class="dialog_choice_chat">
      <img src="images/im_choice_chat.png">
      Выберите диалог, чтобы начать переписку
    </div>
    <div v-else class="dialog_wrap">
      <div class="dialog_messages_list">
        <message v-for="msg of messages" :msg="msg" :peer_id="id"></message>
      </div>
      <div class="dialog_input_wrap">
        <img class="dialog_show_attachments_btn" src="images/more_attachments.svg">
        <div class="dialog_input_container">
          <div class="dialog_input"
               role="textbox"
               contenteditable
               v-emoji.br
              @mousedown="onMousedown"
              @keydown.enter="sendMessage"
              @paste.prevent="onPaste"></div>
          <div class="dialog_input_placeholder">Введите сообщение...</div>
        </div>
        <img class="dialog_send" src="images/send_message.svg" @click="sendMessage">
      </div>
    </div>
  </div>
</template>

<script>
  const { clipboard } = require('electron').remote;

  module.exports = {
    data: () => ({
      text: ''
    }),
    computed: {
      id() {
        return this.$store.state.activeChat;
      },
      isChat() {
        return this.id > 2e9;
      },
      peer() {
        return this.$store.state.peers.find((peer) => {
          return peer.id == this.id;
        });
      },
      profiles() {
        return this.$store.state.profiles;
      },
      owner() {
        return this.profiles[this.peer.owner];
      },
      title() {
        if(this.isChat) return this.peer.title || '...';
        else if(this.owner) {
          return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        } else {
          console.warn('[chat] undefined owner:', this.peer.owner);
          // this.getUser(this.peer.owner);
          return '...';
        }
      },
      online() {
        return 'Загрузка...';
      },
      messages() {
        let dialog = this.$store.state.dialogs.find((dialog) => {
          return dialog.id == this.id;
        });

        return dialog ? dialog.items : [];
      }
    },
    methods: {
      closeChat() {
        this.$store.commit('setChat');
      },
      async sendMessage(event) {
        if(event.shiftKey) return;
        else if(event.type != 'click') event.preventDefault();

        let input = qs('.dialog_input'),
            text = other.getTextWithEmoji(input.childNodes);

        if(!text.trim()) return;

        try {
          await vkapi('messages.send', {
            peer_id: this.id,
            message: text,
            random_id: 0
          });
        } catch(e) {
          console.error('[chat] send error:', e);
        }

        input.innerHTML = '';
      },
      onPaste(event) {
        document.execCommand('insertHTML', false, emoji(clipboard.readText()));
      },
      onMousedown(event) {
        if(event.target.nodeName != 'IMG') return;

        event.target.focus();

        let toRight = event.offsetX <= event.target.width / 2,
            selection = window.getSelection(),
            range = document.createRange();

        range.selectNode(event.target);
        range.collapse(toRight);

        selection = window.getSelection();

        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
</script>
