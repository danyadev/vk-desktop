<template>
  <div class="dialog_container" tabindex="0" @keyup.esc="closeChat">
    <div class="header">
      <img class="dialog_header_back" src="images/im_back.png" @click="closeChat"/>
      <img class="dialog_header_photo" :src="photo"/>
      <div class="dialog_header_center">
        <div class="dialog_name_wrap">
          <div class="dialog_name" v-emoji="title"></div>
          <div class="verified" v-if="owner && owner.verified"></div>
          <div class="messages_muted" v-if="peer && peer.muted"></div>
        </div>
        <div class="dialog_online">{{ online }}</div>
      </div>
      <img src="images/actions_button.svg" class="dialog_actions_btn" @click="openDialogSettingsBox"/>
      <div class="dialog_messages_time_wrap" :class="{ active: topTime && showTopTime }">
        <div class="dialog_messages_time">{{ topTime }}</div>
      </div>
      <dialog-settings-box v-if="peer" :peer="peer" :active="openedDialogSettingsBox" @close="closeDialogSettingsBox"/>
    </div>
    <div class="dialog_wrap">
      <div class="dialog_messages_list" :class="{ empty: !hasMessages }" @scroll="onScroll">
        <template v-if="peer && hasMessages">
          <div class="dialog_empty_block"></div>
          <div v-if="loading" class="loading"></div>
          <div class="dialog_messages_wrap">
            <message v-for="msg of messages" :msg="msg" :peer="peer" :key="msg.id"/>
          </div>
        </template>
        <template v-else-if="!loading">
          <img src="images/empty_messages_placeholder.png"/>
          {{ l('im_empty_dialog') }}
        </template>
        <div v-else class="loading"></div>
        <div class="typing_wrap">
          <div class="typing" v-if="typingMsg">
            <div class="typing_item"></div>
            <div class="typing_item"></div>
            <div class="typing_item"></div>
          </div>
          <div class="typing_text">{{ typingMsg }}</div>
        </div>
      </div>
      <div class="dialog_input_wrap">
        <div class="dialog_to_end" :class="{ hidden: !showEndBtn }" @click="scrollToEnd">
          <div class="dialog_to_end_count">{{ peer && peer.unread || '' }}</div>
          <img class="dialog_to_end_icon" src="images/im_to_end.png"/>
        </div>
        <emoji-block :active="openedEmojiBlock" @chooseEmoji="writeEmoji" @close="closeEmojiBlock"/>
        <template v-if="canSendMessages.state">
          <img class="dialog_show_attachments_btn" src="images/more_attachments.svg"/>
          <div class="dialog_input_container">
            <div class="dialog_input" role="textbox" contenteditable
                 :placeholder="l('im_enter_msg')"
                 @paste.prevent="pasteText"
                 @mousedown="setCursorPositionForEmoji"
                 @input="onInput" @drop="onDrop"
                 @keydown.enter.exact.prevent="sendMessage"></div>
            <div class="dialog_input_emoji_btn" @click="openEmojiBlock"></div>
          </div>
          <img class="dialog_send" src="images/send_message.svg" @click="sendMessage">
        </template>
        <div v-else class="dialog_input_error">
          <div v-if="!canSendMessages.channel" class="dialog_input_error_img"></div>
          <div class="dialog_input_error_text" :class="{ channel: canSendMessages.channel }">
            <div v-if="canSendMessages.channel"
                 @click="toggleChannelNotifications"
                 class="dialog_input_channel">{{ canSendMessages.text }}</div>
            <template v-else>{{ canSendMessages.text }}</template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  const { clipboard } = require('electron').remote;

  const {
    loadOnlineApp,
    loadConversation,
    concatProfiles,
    parseMessage,
    parseConversation,
    getDate,
    getTextWithEmoji
  } = require('./methods');

  module.exports = {
    data() {
      let peer_id = this.$store.state.messages.chat;

      return {
        // Если id = 0, то отображать текущего пользователя
        id: peer_id || app.user.id,
        isChat: peer_id > 2e9,
        loadedMessages: false,
        loading: false,
        loaded: false,
        topTime: null,
        showTopTime: false,
        showEndBtn: false,
        openedDialogSettingsBox: false,
        openedEmojiBlock: false,
        scrollTop: null,
        scrolledToEnd: false
      }
    },
    computed: {
      peer() {
        let dialog = this.$store.state.conversations[this.id],
            peer = dialog && dialog.peer;

        if(!peer) {
          loadConversation(this.id).then((conversation) => {
            this.$store.commit('editPeer', conversation);
          });
        }

        return peer;
      },
      profiles() {
        return this.$store.state.profiles;
      },
      owner() {
        return this.peer && this.profiles[this.peer.owner];
      },
      photo() {
        if(this.owner) return this.owner.photo;
        else if(this.peer && this.peer.photo) return this.peer.photo;
        else return 'images/im_chat_photo.png';
      },
      hasMessages() {
        return this.messages && this.messages.length;
      },
      title() {
        if(this.isChat) return this.peer && this.peer.title || '...';
        else if(this.owner) {
          return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        } else return '...';
      },
      online() {
        if(!this.peer) return this.l('loading');
        if(this.id < 0) return this.l('community');

        if(this.isChat) {
          if(this.peer.canWrite.reason == 917) this.l('im_kicked_from_chat');
          if(this.peer.left) return this.l('im_left_chat');

          if(this.peer.members == undefined) return '';

          let type = other.getWordEnding(this.peer.members);
          return this.l('members', type, [this.peer.members]);
        }

        if(this.owner.deactivated) return '';

        let f = (t) => t < 10 ? `0${t}` : t,
            date = new Date(this.owner.last_seen.time * 1000);

        if(this.owner.online) {
          let app = this.owner.online_device || '';

          if(!app) {
            if(this.owner.online_mobile) app = this.l('with_phone');
          } else app = this.l('with_app', [app]);

          return `online ${app} (${date.getHours()}:${f(date.getMinutes())})`;
        } else {
          let thisDate = new Date(),
              offlineTime = thisDate.getTime() - date.getTime(),
              offlineHours = Math.floor(offlineTime / (1000 * 60 * 60)),
              offlineMins = Math.floor(offlineTime / (1000 * 60)),
              time = getDate(this.owner.last_seen.time) + ' ';

          if(offlineHours <= 3) {
            if(offlineHours == 0) {
              let type = other.getWordEnding(offlineMins);

              if(offlineMins == 0) time = this.l('just_now');
              else time = this.l('minutes', type, [offlineMins]);
            } else {
              let type = other.getWordEnding(offlineHours);
              time = this.l('hours', type, [offlineHours == 1 ? '' : offlineHours]);
            }
          } else time += this.l('at_n', [`${date.getHours()}:${f(date.getMinutes())}`]);

          return this.l('was_online', Number(this.owner.sex == 1), [time]);
        }
      },
      messages() {
        let messagesList = qs('.dialog_messages_list');

        if(messagesList) {
          let isBottomPos = messagesList.scrollTop + messagesList.clientHeight == messagesList.scrollHeight;

          if(isBottomPos) this.$nextTick().then(this.scrollToEnd);
        }

        return this.$store.state.messages[this.id];
      },
      typingMsg() {
        return this.$store.getters.typingMsg(this.id);
      },
      canSendMessages() {
        if(!this.peer) {
          return {
            state: false,
            channel: false,
            text: this.l('im_cant_write')
          }
        }

        let text, reason = this.peer.canWrite.reason;

        if(!this.peer.canWrite.allowed) {
          if(reason == 925) text = this.l('toggle_notifications', Number(!this.peer.muted));
          else if(reason == 18) text = this.l('im_user_deleted');
          else text = this.l('im_cant_write');
        }

        return {
          state: this.peer.canWrite.allowed,
          channel: this.peer.channel,
          text: text
        }
      }
    },
    methods: {
      openEmojiBlock() {
        this.openedEmojiBlock = !this.openedEmojiBlock;
      },
      closeEmojiBlock() {
        if(this.openedEmojiBlock) this.openedEmojiBlock = false;
      },
      openDialogSettingsBox() {
        this.openedDialogSettingsBox = !this.openedDialogSettingsBox;
      },
      closeDialogSettingsBox() {
        if(this.openedDialogSettingsBox) this.openedDialogSettingsBox = false;
      },
      writeEmoji(code) {
        qs('.dialog_input').innerHTML += emoji(emoji.hexToEmoji(code));
      },
      closeChat() {
        this.$store.commit('messages/setChat', null);
      },
      async sendMessage(event) {
        let input = qs('.dialog_input'),
            { text, emojies } = getTextWithEmoji(input.childNodes),
            random_id = other.random(0, 9e8);

        if(!text) return;
        input.innerHTML = '';

        this.$store.commit('settings/updateRecentEmojies', emojies);

        await vkapi('messages.send', {
          peer_id: this.id,
          message: text,
          random_id
        });

        longpoll.once(`new_message_${random_id}`, () => {
          this.$nextTick(this.scrollToEnd);
        });
      },
      scrollToEnd() {
        let el = qs('.dialog_messages_list .typing_wrap');
        if(el) el.scrollIntoView();
      },
      pasteText(event) {
        document.execCommand('insertHTML', false, emoji(clipboard.readText()));
      },
      setCursorPositionForEmoji(event) {
        if(event.target.nodeName != 'IMG') return;

        let selection = window.getSelection(),
            range = document.createRange();

        range.selectNode(event.target);
        range.collapse(event.offsetX <= 8);
        selection.removeAllRanges();
        selection.addRange(range);
      },
      toggleChannelNotifications() {
        vkapi('account.setSilenceMode', {
          peer_id: this.peer.id,
          time: this.peer.muted ? 0 : -1
        });
      },
      hideTopDate: other.debounce((vm) => {
        if(vm.showTopTime) vm.showTopTime = false;
      }, 2000),
      hideEndBtn: other.debounce((vm) => {
        if(vm.showEndBtn) vm.showEndBtn = false;
      }, 3000),
      onScroll(event) {
        let el = event.target,
            hide = el.scrollTop + el.offsetHeight == el.scrollHeight,
            days = [].slice.call(qsa('.message_top_date')).reverse(),
            messagesList = qs('.dialog_messages_list');

        if(!messagesList) return;

        // TODO: move to beforeDeactivated hook
        // https://github.com/vuejs/vue/issues/9454
        this.scrollTop = messagesList.scrollTop;

        if(messagesList.scrollTop + messagesList.clientHeight == messagesList.scrollHeight) {
          this.scrolledToEnd = true;
        } else this.scrolledToEnd = false;

        if(!this.showTopTime) this.showTopTime = true;
        this.hideEndBtn(this);
        this.hideTopDate(this);

        for(let item of days) {
          if(el.scrollTop + el.offsetTop >= item.offsetTop) {
            if(this.topTime != item.innerText) this.topTime = item.innerText;
            break;
          }
        }

        if(this.showEndBtn != !hide) this.showEndBtn = !hide;

        if(!this.loading && !this.loaded && el.scrollTop <= 200) {
          this.loading = true;
          this.loadNewMessages();
        }
      },
      setTypingActivity: other.throttle((peer) => {
        vkapi('messages.setActivity', {
          peer_id: peer.id,
          type: 'typing'
        });
      }, 4500),
      onDrop(event) {
        event.preventDefault();
      },
      onInput(event) {
        if(event.data != null) this.setTypingActivity(this.peer);
      },
      async loadNewMessages() {
        let offset = this.messages ? this.messages.length : 0;

        let { items, conversations, profiles = [], groups = [] } = await vkapi('messages.getHistory', {
          peer_id: this.id,
          offset: offset,
          extended: 1,
          fields: other.fields
        });

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));

        let conv = parseConversation(conversations[0]),
            lastMsg = parseMessage(items[items.length-1], this.peer);

        if(lastMsg && !offset) {
          this.$store.commit('updateLastMsg', {
            peer_id: this.id,
            msg: lastMsg
          });
        }

        for(let msg of items) {
          let parsedMsg = parseMessage(msg, conv);

          this.$store.commit('addMessage', {
            peer_id: this.id,
            msg: parsedMsg,
            notNewMsg: true
          });
        }

        if(items.length < 20) this.loaded = true;
        this.loading = false;

        let { scrollTop, scrollHeight } = qs('.dialog_messages_list') || {};
        await this.$nextTick();

        if(this.$store.state.messages.chat == this.id) {
          let thisHeight = qs('.dialog_messages_list').scrollHeight;
          qs('.dialog_messages_list').scrollTop = scrollTop + thisHeight - scrollHeight;
        }

        this.loadedMessages = true;
      }
    },
    mounted() {
      this.loading = true;
      this.loadNewMessages();
    },
    activated() {
      if(this.scrollTop != null) {
        let messagesList = qs('.dialog_messages_list');

        if(this.scrolledToEnd) this.scrollToEnd();

        messagesList.scrollTop = this.scrollTop;
      } else this.scrollToEnd();

      // Чек онлайна при каждом открытии чата
      if(!this.isChat && this.id > 0) loadOnlineApp(this.id);
    }
  }
</script>
