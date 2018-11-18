<template>
  <div class="conversation">
    <img v-if="photo" :src="photo" class="conversation_photo">
    <div v-else class="conversation_photo no_photo"></div>
    <div class="conversation_content">
      <div class="conversation_title">
        <div class="conversation_name_wrap">
          <div class="conversation_name" v-emoji>{{ chatName }}</div>
          <div class="verified" v-if="owner && owner.verified"></div>
          <div class="conversation_muted" v-if="peer.muted"></div>
        </div>
        <div class="conversation_time">{{ time }}</div>
      </div>
      <div class="conversation_message_wrap">
        <div class="conversation_message">
          <div class="conversation_author">{{ authorName }}</div>
          <div :class="{ conversation_attach: attachment }" v-emoji.push
               class="conversation_text">{{ message }}</div>
        </div>
        <div class="conversation_message_unread"
             :class="{ outread: msg.out, muted: peer.muted }"
             >{{ peer.unread || '' }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['peer', 'msg'],
    data() {
      return {
        isChat: this.peer.type == 'chat',
        attachment: false
      }
    },
    computed: {
      profiles() {
        return this.$store.state.profiles;
      },
      owner() {
        return this.profiles[this.peer.owner];
      },
      author() {
        return this.profiles[this.msg.from] || { id: this.msg.from };
      },
      photo() {
        if(this.isChat) return this.peer.photo;
        else if(this.owner) return this.owner.photo_50;
        else {
          this.getUser(this.peer.owner);
          return 'images/conversation_no_photo.png';
        }
      },
      chatName() {
        if(this.isChat) return this.peer.title;
        else if(this.owner && this.owner.photo_50) {
          return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        } else {
          this.getUser(this.peer.owner);
          return '...';
        }
      },
      time() {
        let unixtime = this.msg.date,
            date = new Date(unixtime * 1000),
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
        else if(this.author.id == users.get().id) return 'Вы:';
        else if(this.author.photo_50) {
          if(this.isChat) return `${this.author.name || this.author.first_name}:`;
        } else {
          this.getUser(this.author.id);
          return '...:';
        }
      },
      message() {
        if(this.msg.action) {
          this.attachment = false;
          return this.getServiceMessage(this.msg.action, this.author || { id: this.msg.from });
        } else if(this.msg.fwd_count && !this.msg.text) {
          let count = this.msg.fwd_count,
              word = other.getWordEnding(count, ['сообщение', 'сообщения', 'сообщений']);

          this.attachment = true;
          return `${count} ${word}`;
        } else {
          let { msg, attach } = this.getAttachment(this.msg.text, this.msg.attachments[0]);

          this.attachment = attach;
          return msg;
        }
      }
    },
    methods: {
      getAttachment(message, attachment) {
        if(!attachment || (message && attachment.type != 'gift')) {
          return { msg: message, attach: false };
        }

        let attachments = {
          geo: 'Карта',
          doc: 'Документ',
          link: 'Ссылка',
          poll: 'Опрос',
          wall: 'Запись на стене',
          call: 'Звонок',
          gift: 'Подарок',
          photo: 'Фотография',
          audio: 'Аудиозапись',
          video: 'Видеозапись',
          point: 'Местоположение',
          market: 'Товар',
          sticker: 'Стикер',
          graffiti: 'Граффити',
          audio_message: 'Голосовое сообщение',
          money_request: 'Запрос на денежный перевод',
          audio_playlist: 'Плейлист'
        };

        return {
          msg: attachments[attachment.type] || 'Вложение',
          attach: true
        }
      },
      getServiceMessage(action, author) {
        let actID = action.member_id || action.mid,
            actUser = this.profiles[actID] || { id: actID },
            id = users.get().id;

        let name = (type, acc) => {
          let user = type ? actUser : author;

          if(!user.photo_50) this.getUser(user.id);

          if(user.id == id) return 'Вы';
          else if(user.name) return user.name;
          else if(user.photo_50) {
            if(acc) return `${user.first_name_acc} ${user.last_name_acc}`;
            else return `${user.first_name} ${user.last_name}`;
          } else return '...';
        }

        let w = (type, text) => {
          let user = type ? actUser : author, endID;

          if(!user.photo_50) this.getUser(user.id);

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
            return `${name(0)} создал${w(0, 'и:а')} беседу "${action.text}"`;
          case 'chat_title_update':
            return `${name(0)} изменил${w(0, 'и:а')} название беседы на "${action.text}"`;
          case 'chat_invite_user':
            if(actUser.id == id) return 'Вас пригласили в беседу';
            else return `${name(1, 1)} пригласили в беседу`;
          case 'chat_kick_user':
            if(actUser.id == author.id) return `${name(0)} покинул${w(0, 'и:а')} беседу`;
            else if(actUser.id == id) return 'Вас исключили из беседы';
            else return `${name(1, 1)} исключили из беседы`;
          case 'chat_pin_message':
            return `${name(1)} закрепил${w(1, 'и:а')} сообщение "${action.message}"`;
          case 'chat_unpin_message':
            return `${name(1)} открепил${w(1, 'и:а')} сообщение`;
          case 'chat_invite_user_by_link':
            return `${name(0)} присоединил${w(0, 'ись:ась:ся')} к беседе по ссылке`;
          default:
            return `Неизвестное действие (${action.type})`;
        }
      },
      async getUser(id) {
        if(id > 0) {
          let [ user ] = await vkapi('users.get', {
            user_id: id,
            fields: 'photo_50,verified,sex,first_name_acc,last_name_acc'
          });

          this.$store.commit('addProfile', user);
        }
      }
    }
  }
</script>
