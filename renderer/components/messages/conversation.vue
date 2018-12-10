<template>
  <div class="conversation" :class="{ active: isActiveChat }" @click="openChat">
    <div class="conversation_photo_wrap" :class="online">
      <img v-if="photo" :src="photo" class="conversation_photo">
      <div v-else class="conversation_photo no_photo"></div>
    </div>
    <div class="conversation_content">
      <div class="conversation_title">
        <div class="conversation_name_wrap">
          <div class="conversation_name" v-emoji>{{ chatName }}</div>
          <div class="verified" v-if="owner && owner.verified"></div>
          <div class="messages_muted" v-if="peer.muted"></div>
        </div>
        <div class="conversation_time">{{ time }}</div>
      </div>
      <div class="conversation_message_wrap">
        <div v-if="isTyping" class="typing_wrap">
          <div class="typing_text">{{ typingMsg }}</div>
          <div class="typing">
            <div class="typing_item"></div>
            <div class="typing_item"></div>
            <div class="typing_item"></div>
          </div>
        </div>
        <div v-else class="conversation_message">
          <div class="conversation_author">{{ authorName }}</div>
          <div :class="{ conversation_attach: isAttachment }" v-emoji.push
               class="conversation_text">{{ message }}</div>
        </div>
        <div class="conversation_message_unread"
             :class="{ outread: msg.outread, muted: peer.muted }"
             >{{ peer.unread || '' }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  const { getLastMessage, loadProfile } = require('./methods');

  module.exports = {
    props: ['peer'],
    data: (vm) => ({
      isChat: vm.peer.type == 'chat'
    }),
    computed: {
      isActiveChat() {
        return this.$store.state.activeChat == this.peer.id;
      },
      msg() {
        return getLastMessage(this.peer.id);
      },
      profiles() {
        return this.$store.state.profiles;
      },
      typing() {
        return this.$store.state.typing;
      },
      isTyping() {
        return !!Object.keys(this.typing[this.peer.id] || []).length;
      },
      owner() {
        let owner = this.profiles[this.peer.owner];
        if(!this.isChat && (!owner || !owner.photo_50)) loadProfile(this.peer.owner);
        return owner;
      },
      online() {
        if(this.peer.owner > 2e9) return '';
        else if(!this.owner || !this.owner.online) return '';

        return this.owner.online_mobile ? 'mobile' : 'desktop';
      },
      author() {
        let author = this.profiles[this.msg.from] || { id: this.msg.from };
        if(!author.photo_50) loadProfile(this.msg.from);
        return author;
      },
      photo() {
        if(this.isChat) return this.peer.photo;
        else if(this.owner) return this.owner.photo_50;
      },
      chatName() {
        if(this.isChat) return this.peer.title || '...';
        else if(this.owner && this.owner.photo_50) {
          return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        } else return '...';
      },
      time() {
        let date = new Date(this.msg.date * 1000),
            thisDate = new Date(),
            f = (t) => t < 10 ? `0${t}` : t;

        if(date.toLocaleDateString() == thisDate.toLocaleDateString()) {
          return `${f(date.getHours())}:${f(date.getMinutes())}`;
        } else if(date.getFullYear() == thisDate.getFullYear()) {
          return `${f(date.getDate())}.${f(date.getMonth() + 1)}`;
        } else return date.getFullYear();
      },
      authorName() {
        if(this.msg.action || this.peer.channel) return '';
        else if(this.msg.out || this.author.id == users.get().id) return 'Вы:';
        else if(this.author.photo_50) {
          if(this.isChat) return `${this.author.name || this.author.first_name}:`;
        } else return '...:';
      },
      message() {
        if(this.msg.action) {
          return this.getServiceMessage(this.msg.action, this.author || { id: this.msg.from });
        } else if(this.msg.fwd_count && !this.msg.text) {
          let count = this.msg.fwd_count,
              word = other.getWordEnding(count, ['сообщение', 'сообщения', 'сообщений']);

          return `${count} ${word}`;
        } else return this.getAttachment(this.msg.text, this.msg.attachments[0]);
      },
      isAttachment() {
        return !this.msg.text && (this.msg.fwd_count || !this.msg.action && this.msg.attachments[0]);
      },
      typingMsg() {
        return this.$store.getters.typingMsg(this.peer.id);
      }
    },
    methods: {
      async openChat() {
        if(this.peer.id == this.$store.state.activeChat) return;

        if(this.$store.state.activeChat) {
          let peer = this.$store.state.peers.find((peer) => {
            return peer.id == this.$store.state.activeChat;
          });

          if(peer) {
            peer.scrollTop = qs('.dialog_messages_list').scrollTop;

            if(qs('.dialog_input')) {
              peer.inputText = qs('.dialog_input').innerHTML;
            }
          }
        }

        this.$store.commit('setChat', this.peer.id);
        await this.$nextTick();
        qs('.dialog_messages_list').scrollTop = this.peer.scrollTop || 0;

        if(qs('.dialog_input')) {
          qs('.dialog_input').innerHTML = this.peer.inputText || '';
        }
      },
      getAttachment(message, attachment) {
        if(!attachment || message) return message;

        let attachments = {
          geo: 'Карта',
          doc: 'Документ',
          link: 'Ссылка',
          poll: 'Опрос',
          wall: 'Запись на стене',
          call: 'Звонок',
          gift: 'Подарок',
          story: 'История',
          photo: 'Фотография',
          audio: 'Аудиозапись',
          video: 'Видеозапись',
          point: 'Местоположение',
          market: 'Товар',
          sticker: 'Стикер',
          podcast: 'Подкаст',
          graffiti: 'Граффити',
          audio_message: 'Голосовое сообщение',
          money_request: 'Запрос денег',
          audio_playlist: 'Плейлист'
        };

        if(attachment.type == 'link' && attachment.link) {
          if(attachment.link.url.match('https://m.vk.com/story')) attachment.type = 'story';
        }

        if(!attachments[attachment.type]) {
          console.warn('[messages] Неизвестное вложение:', attachment.type);
        }

        return attachments[attachment.type] || 'Вложение';
      },
      getServiceMessage(action, author) {
        let actID = action.member_id || action.mid,
            actUser = this.profiles[actID] || { id: actID },
            id = users.get().id;

        let name = (type, acc) => {
          let user = type ? actUser : author;
          if(!user.photo_50) loadProfile(user.id);

          if(user.id == id) return 'Вы';
          else if(user.name) return user.name;
          else if(user.photo_50) {
            if(acc) return `${user.first_name_acc} ${user.last_name_acc}`;
            else return `${user.first_name} ${user.last_name}`;
          } else return '...';
        }

        let w = (type, text) => {
          let user = type ? actUser : author, endID;

          if(user.id == id) endID = 0;
          else if(user.sex == 1) endID = 1;
          else endID = 2;

          return text.split(':')[endID] || '';
        }

        switch(action.type) {
          case 'chat_photo_update':
            return `${name(0)} обновил${w(0, 'и:а')} фотографию беседы`;
          case 'chat_photo_remove':
            return `${name(0)} удалил${w(0, 'и:а')} фотографию беседы`;
          case 'chat_create':
            return `${name(0)} создал${w(0, 'и:а')} беседу`;
          case 'chat_title_update':
            return `${name(0)} изменил${w(0, 'и:а')} название беседы на "${action.text}"`;
          case 'chat_invite_user':
            if(actID == author.id) return `${name(1)} вернул${w(1, 'ись:ась:ся')} в беседу`;
            else return `${name(1, 1)} пригласили в беседу`;
          case 'chat_kick_user':
            if(actID == author.id) return `${name(0)} покинул${w(0, 'и:а')} беседу`;
            else if(actID == id) return 'Вас исключили из беседы';
            else return `${name(1, 1)} исключили из беседы`;
          case 'chat_pin_message':
            return `${name(1)} закрепил${w(1, 'и:а')} сообщение "${action.message}"`;
          case 'chat_unpin_message':
            return `${name(1)} открепил${w(1, 'и:а')} сообщение`;
          case 'chat_invite_user_by_link':
            return `${name(0)} присоединил${w(0, 'ись:ась:ся')} к беседе по ссылке`;
          default:
            console.warn('[messages] Неизвестное действие:', action.type);
            return `Неизвестное действие (${action.type})`;
        }
      }
    }
  }
</script>
