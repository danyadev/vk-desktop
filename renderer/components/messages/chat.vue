<template>
  <div class="dialog_container" tabindex="0" @keyup.esc="closeChat">
    <div class="header">
      <template v-if="peer">
        <img class="dialog_header_back" src="images/im_back.png" @click="closeChat">
        <div class="dialog_header_center">
          <div class="dialog_name_wrap">
            <div class="dialog_name" v-emoji>{{ title | e }}</div>
            <div class="verified" v-if="owner && owner.verified"></div>
            <div class="messages_muted" v-if="peer.muted"></div>
          </div>
          <div class="dialog_online">{{ online }}</div>
        </div>
        <img src="images/actions_button.svg" class="dialog_actions_btn">
        <div class="dialog_messages_time_wrap" :class="{ active: topTime && showTopTime }">
          <div class="dialog_messages_time">{{ topTime }}</div>
        </div>
      </template>
    </div>
    <div v-if="!id" class="dialog_choice_chat">
      <img src="images/im_choice_chat.png">
      {{ l('im_choose_chat') }}
    </div>
    <div v-else class="dialog_wrap">
      <div class="dialog_messages_list" :class="{ dialog_no_messages: !hasMessages }" @scroll="onScroll">
        <template v-if="hasMessages">
          <div class="dialog_empty_block"></div>
          <div v-if="loading" class="loading"></div>
          <div class="dialog_messages_wrap">
            <message v-for="msg of messages" :msg="msg" :peer="peer" :key="msg.id"></message>
          </div>
        </template>
        <template v-else-if="!loading">
          <img src="images/im_empty_dialog.png">
          {{ l('im_empty_dialog') }}
        </template>
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
          <img class="dialog_to_end_icon" src="images/im_to_end.png">
        </div>
        <template v-if="canSendMessages.state">
          <img class="dialog_show_attachments_btn" src="images/more_attachments.svg">
          <div class="dialog_input_container">
            <div class="dialog_input" role="textbox" contenteditable
                 @paste.prevent="pasteText"
                 @mousedown="setCursorPositionForEmoji"
                 @input="onInput(peer)"
                 @keydown.enter="sendMessage"></div>
            <div class="dialog_input_placeholder">{{ l('im_enter_msg') }}</div>
          </div>
          <img class="dialog_send" src="images/send_message.svg" @click="sendMessage">
        </template>
        <div v-else class="dialog_input_error">
          <img src="images/warning.png" v-if="!canSendMessages.channel" class="dialog_input_error_img">
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
  const { loadOnlineApp, loadConversation, concatProfiles, parseMessage, parseConversation } = require('./methods');
  const { getDate, toggleChat } = require('./messages');

  module.exports = {
    computed: {
      id() {
        let id = this.$store.state.activeChat;

        this.$nextTick().then(() => {
          let el = qs('.dialog_messages_list');
          if(id && el) this.onScroll({ target: el }, true);
        });

        return id;
      },
      isChat() {
        return this.id > 2e9;
      },
      peer() {
        let dialog = this.$store.state.conversations[this.id],
            peer = dialog && dialog.peer;

        if(!peer && this.id) {
          loadConversation(this.id).then((conversation) => {
            this.$store.commit('editPeer', conversation);
          });
        }

        return dialog && dialog.peer;
      },
      profiles() {
        return this.$store.state.profiles;
      },
      owner() {
        return this.profiles[this.peer.owner];
      },
      hasMessages() {
        return this.messages && this.messages.length;
      },
      loading() {
        return this.peer && !this.peer.loaded && this.peer.loading;
      },
      showEndBtn() {
        return this.peer && this.peer.showEndBtn;
      },
      topTime() {
        return this.peer && this.peer.topTime;
      },
      showTopTime() {
        return this.peer && this.peer.showTopTime;
      },
      title() {
        if(this.isChat) return this.peer.title || '...';
        else if(this.owner) {
          return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        } else return '...';
      },
      online() {
        if(this.id < 0) return '';

        if(this.isChat) {
          if(this.peer.members == undefined) {
            if(this.peer.left) return this.l('im_left_chat');
            else if(this.peer.canWrite.reason == 917) {
              return this.l('im_cant_write_reasons', 917);
            }

            return '';
          }

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
            else if(!this.owner.online_web) loadOnlineApp(this.owner.id);
          } else app = this.l('with_app', null, [app]);

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
              else time = this.l('time_ago', null, [this.l('minutes', type, [offlineMins])]);
            } else {
              let type = other.getWordEnding(offlineHours);
              time = this.l('hours', type, [offlineHours == 1 ? '' : offlineHours]);
            }
          } else time += this.l('at_n', null, [`${date.getHours()}:${f(date.getMinutes())}`]);

          return this.l('was_online', Number(this.owner.sex == 1), [time]);
        }
      },
      messages() {
        let messagesList = qs('.dialog_messages_list');

        if(messagesList) {
          let isBottomPos = messagesList.scrollTop + messagesList.clientHeight == messagesList.scrollHeight;

          if(isBottomPos) {
            this.$nextTick().then(() => {
              qs('.dialog_messages_list .typing_wrap').scrollIntoView();
            });
          }
        }

        return this.$store.state.messages[this.id];
      },
      typingMsg() {
        return this.$store.getters.typingMsg(this.id);
      },
      canSendMessages() {
        if(!this.peer || !this.peer.canWrite) {
          return { state: true, channel: false }
        }

        let text, reason = this.peer.canWrite.reason;

        if(!this.peer.canWrite.allowed) {
          if(reason == 925) text = this.l('im_channel_notifications', this.peer.muted);
          else text = this.l('im_cant_write_reasons', reason);

          if(!text) {
            console.warn('[chat] неизвестная причина:', reason);
          }
        }

        return {
          state: this.peer.canWrite.allowed,
          channel: this.peer.channel,
          text: text
        }
      }
    },
    methods: {
      updatePeer(data) {
        data.id = this.id;
        this.$store.commit('editPeer', data);
      },
      closeChat() {
        toggleChat.bind(this)(null);
      },
      async sendMessage(event) {
        let longpoll = require('./../../js/longpoll').longpoll();

        if(event.shiftKey) return;
        else if(event.type != 'click') event.preventDefault();

        let input = qs('.dialog_input'),
            text = other.getTextWithEmoji(input.childNodes).trim();

        if(!text) return;
        input.innerHTML = '';

        try {
          let id = await vkapi('messages.send', {
            peer_id: this.id,
            message: text,
            random_id: 0
          });

          longpoll.once('new_message_' + id, async (data) => {
            await this.$nextTick();
            qs('.dialog_messages_list .typing_wrap').scrollIntoView();
          });
        } catch(e) {
          console.error('[chat] send error:', e);
        }
      },
      scrollToEnd() {
        qs('.dialog_messages_list .typing_wrap').scrollIntoView();
      },
      pasteText(event) {
        document.execCommand('insertHTML', false, emoji(clipboard.readText()));
      },
      setCursorPositionForEmoji(event) {
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
      },
      toggleChannelNotifications() {
        vkapi('account.setSilenceMode', {
          peer_id: this.peer.id,
          time: this.peer.muted ? 0 : -1
        });
      },
      hideTopDate: other.debounce((peer_id) => {
        app.$store.commit('editPeer', {
          id: peer_id,
          showTopTime: false
        });
      }, 2000),
      onScroll(event, fake) {
        if(!this.peer) return;

        if(!this.showTopTime) {
          app.$store.commit('editPeer', {
            id: this.peer.id,
            showTopTime: true
          });
        }

        this.hideTopDate(this.peer.id);

        let el = event.target,
            hide = el.scrollTop + el.offsetHeight == el.scrollHeight;

        let arr = [].slice.call(qsa('.message_top_date'));

        for(let item of arr.reverse()) {
          if(el.scrollTop + el.offsetTop >= item.offsetTop) {
            app.$store.commit('editPeer', {
              id: this.peer.id,
              topTime: item.innerText
            });

            break;
          }
        }

        Vue.set(this.peer, 'showEndBtn', !hide);

        if(fake && this.peer.inited || event.target.scrollTop > 200) return;

        if(!this.peer.loading && !this.peer.loaded) {
          Vue.set(this.peer, 'loading', true);
          this.loadNewMessages();
        }
      },
      onInput: other.throttle((peer) => {
        vkapi('messages.setActivity', {
          peer_id: peer.id,
          type: 'typing'
        });
      }, 4500),
      async loadNewMessages() {
        const PEER_ID = this.id;
        let offset = this.messages ? this.messages.length : 0;

        let { items, conversations, profiles = [], groups = [] } = await vkapi('messages.getHistory', {
          peer_id: PEER_ID,
          offset: offset,
          extended: 1,
          fields: other.fields
        });

        this.$store.commit('addProfiles', await concatProfiles(profiles, groups));

        let peer = parseConversation(conversations[0]),
            lastMsg = parseMessage(items[items.length-1], peer);

        if(!offset) {
          this.$store.commit('updateLastMsg', {
            peer_id: PEER_ID,
            msg: lastMsg
          });
        }

        for(let msg of items) {
          this.$store.commit('addMessage', {
            peer_id: PEER_ID,
            msg: parseMessage(msg, peer),
            notNewMsg: true
          });
        }

        function editPeer(key, value) {
          app.$store.commit('editPeer', {
            id: PEER_ID,
            [key]: value
          });
        }

        if(items.length < 20) editPeer('loaded', true);
        else editPeer('loading', false);

        let { scrollTop, scrollHeight } = qs('.dialog_messages_list') || {};
        await this.$nextTick();

        if(this.id == PEER_ID) {
          let thisHeight = qs('.dialog_messages_list').scrollHeight;
          qs('.dialog_messages_list').scrollTop = scrollTop + thisHeight - scrollHeight;
        }

        editPeer('inited', true);
      }
    }
  }
</script>
