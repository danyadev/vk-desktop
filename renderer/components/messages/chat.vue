<template>
  <div class="dialog_container" tabindex="0" @keyup.esc="closeChat">
    <div class="header">
      <template v-if="peer">
        <img class="dialog_header_back" src="images/im_back.png" @click="closeChat">
        <div class="dialog_header_center">
          <div class="dialog_name_wrap">
            <div class="dialog_name" v-emoji>{{ title }}</div>
            <div class="verified" v-if="owner && owner.verified"></div>
            <div class="messages_muted" v-if="peer.muted"></div>
          </div>
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
          Напиши сообщение или попроси котика сделать это за тебя
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
        <template v-if="canSendMessages.state">
          <img class="dialog_show_attachments_btn" src="images/more_attachments.svg">
          <div class="dialog_input_container">
            <div class="dialog_input" role="textbox" contenteditable
                 @paste.prevent="pasteText"
                 @mousedown="setCursorPositionForEmoji"
                 @keydown.enter="sendMessage"></div>
            <div class="dialog_input_placeholder">Введите сообщение...</div>
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
        return !this.peer.loaded && this.peer.loading;
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
        if(this.id < 0) return '';

        if(this.isChat) {
          if(this.peer.members == undefined) {
            if(this.peer.left) return 'Вы вышли из этой беседы';
            else if(this.peer.canWrite.reason == 917) {
              return 'Вы исключены из этой беседы';
            }

            return '';
          }

          let word = 'участник' + other.getWordEnding(this.peer.members, ['', 'а', 'ов']);
          return `${this.peer.members} ${word}`;
        }

        if(this.owner.deactivated) return '';

        let f = (t) => t < 10 ? `0${t}` : t,
            date = new Date(this.owner.last_seen.time * 1000);

        if(this.owner.online) {
          let app = this.owner.online_device || '';

          if(!app) {
            if(this.owner.online_mobile) app = 'с телефона';
            else if(!this.owner.online_web) loadOnlineApp(this.owner.id);
          } else app = 'с ' + app;

          return `В сети ${app} (${date.getHours()}:${f(date.getMinutes())})`;
        } else {
          let thisDate = new Date(),
              s = this.owner.sex == 1 ? 'a' : '',
              time = '',
              months = [
                'янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.',
                'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'
              ];

          let offlineTime = thisDate.getTime() - date.getTime(),
              offlineHours = Math.floor(offlineTime / (1000 * 60 * 60)),
              offlineMins = Math.floor(offlineTime / (1000 * 60)),
              thisYear = thisDate.getFullYear() == date.getFullYear(),
              thisMonth = thisYear && thisDate.getMonth() == date.getMonth(),
              thisDay = thisMonth && thisDate.getDate() == date.getDate(),
              yesterday = thisMonth && thisDate.getDate() - 1 == date.getDate();

          if(thisDay) time = 'сегодня';
          else if(yesterday) time = 'вчера';
          else if(thisYear) {
            time = `${date.getDate()} ${months[date.getMonth()]}`;
          } else {
            time = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} г.`;
          }

          if(offlineHours <= 3) {
            if(offlineHours == 0) {
              let word = other.getWordEnding(offlineMins, ['минуту', 'минуты', 'минут']);

              if(offlineMins == 0) time = 'только что';
              else time = `${offlineMins} ${word} назад`;
            } else {
              let word = other.getWordEnding(offlineHours, ['час', 'часа']);

              if(offlineHours == 1) time = 'час назад';
              else time = `${offlineHours} ${word} назад`;
            }
          } else time += ` в ${date.getHours()}:${f(date.getMinutes())}`;

          return `Был${s} в сети ${time}`;
        }
      },
      messages() {
        let hist = qs('.dialog_messages_list');

        if(hist) {
          let scrollPos = hist.scrollTop + hist.clientHeight,
              lastMsg = qs('.dialog_messages_wrap').lastChild,
              scrollHeight = lastMsg.offsetTop + lastMsg.offsetHeight;

          if(scrollPos == scrollHeight) {
            this.$nextTick().then(() => {
              qs('.dialog_messages_list .typing_wrap').scrollIntoView()
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
          let reasons = {
            18: 'Пользователь удален',
            203: 'Нет доступа к сообществу',
            900: 'Пользователь добавил вас в черный список',
            901: 'Пользователь запретил сообщения от сообщества',
            902: 'Пользователь запретил писать сообщения настройками приватности',
            915: 'В сообществе отключены сообщения',
            916: 'В сообществе заблокированы сообщения',
            917: 'Вы были исключены из этой беседы',
            918: 'Вы не можете написать сообщение на этот email',
            925: (this.peer.muted ? 'В' : 'Вы') + 'ключить уведомления' // канал
          }

          if(!reasons[reason]) text = 'Вы не можете писать сообщения в этот чат';
          else text = reasons[reason];

          if(!reasons[reason] || [203, 916].includes(reason)) {
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
        if(qs('.dialog_input')) {
          this.peer.inputText = qs('.dialog_input').innerHTML;
        }

        let hist = qs('.dialog_messages_list'),
            scrollPos = hist.scrollTop + hist.clientHeight + 40,
            lastMsg = qs('.dialog_messages_wrap').lastChild,
            scrollHeight = lastMsg.offsetTop + lastMsg.offsetHeight;

        this.updatePeer({
          scrollTop: hist.scrollTop,
          closedInBottom: scrollPos == scrollHeight
        });

        this.$store.commit('setChat', null);
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
      onScroll(event, fake) {
        if(fake && this.peer.inited || event.target.scrollTop > 200) return;

        if(!this.peer.loading && !this.peer.loaded) {
          Vue.set(this.peer, 'loading', true);
          this.loadNewMessages();
        }
      },
      async loadNewMessages() {
        let { items, conversations, profiles = [], groups = [] } = await vkapi('messages.getHistory', {
          peer_id: this.id,
          offset: this.messages.length,
          extended: 1,
          fields: other.fields
        });

        this.$store.commit('addProfiles', await concatProfiles(profiles, groups));

        let peer = parseConversation(conversations[0]);

        for(let msg of items) {
          this.$store.commit('addMessage', {
            peer_id: peer.id,
            msg: parseMessage(msg, peer)
          });
        }

        if(items.length < 20) Vue.set(this.peer, 'loaded', true);
        else this.peer.loading = false;

        let { scrollTop, scrollHeight } = qs('.dialog_messages_list');
        await this.$nextTick();

        let thisHeight = qs('.dialog_messages_list').scrollHeight;
        qs('.dialog_messages_list').scrollTop = scrollTop + thisHeight - scrollHeight;
        this.peer.inited = true;
      }
    }
  }
</script>
