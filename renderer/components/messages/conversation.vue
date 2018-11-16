<template>
  <div class="conversation">
    <img v-if="photo" :src="photo" class="conversation_photo">
    <div v-else class="conversation_photo no_photo"></div>
    <div class="conversation_content">
      <div class="conversation_title">
        <div class="conversation_name">
          <emoji>{{ chatName }}</emoji>
          <div class="verified" v-if="verified"></div>
          <div class="conversation_muted" v-if="muted"></div>
        </div>
        <div class="conversation_time">{{ time }}</div>
      </div>
      <div class="conversation_message_wrap">
        <div class="conversation_message">
          <div class="conversation_author">{{ authorName }}</div>
          <emoji :push="1"
                 :class="{ conversation_attach: attachment }">{{ message }}</emoji>
        </div>
        <div class="conversation_message_unread"
             :class="{ outread, muted }">{{ peer.unread || '' }}</div>
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
        owner: this.$root.profiles[this.peer.owner],
        attachment: false
      }
    },
    computed: {
      // TODO сделать нормально
      verified() {
        return this.owner && this.owner.verified;
      },
      muted() {
        return !!this.peer.muted;
      },
      outread() {
        return this.msg.out;
      },
      author() {
        return this.$root.profiles[this.msg.from];
      },
      // Далее все норм
      photo() {
        if(this.isChat) return this.peer.photo;
        else return this.owner.photo_50;
      },
      chatName() {
        if(this.isChat) return this.peer.title;
        else return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
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
        else if(this.isChat) return `${this.author.name || this.author.first_name}:`;
      },
      message() {
        if(this.msg.action) {
          this.attachment = false;
          return this.getServiceMessage(this.msg.action, this.author);
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
        let actUser = this.$root.profiles[action.member_id],
            id = users.get().id;

        let name = (type, ncase) => {
          let user = type ? actUser : author;

          if(user.id == id) return 'Вы';
          else if(user.name) return user.name;
          else if(ncase) return `${user[`first_name_${ncase}`]} ${user[`last_name_${ncase}`]}`;
          else return `${user.first_name} ${user.last_name}`;
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
            return `${name(0)} создал${w(0, 'и:а')} беседу "${action.text}"`;
          case 'chat_title_update':
            return `${name(0)} изменил${w(0, 'и:а')} название беседы на "${action.text}"`;
          case 'chat_invite_user':
            if(actUser.id == id) return 'Вас пригласили в беседу';
            else return `${name(1, 'acc')} пригласили в беседу`;
          case 'chat_kick_user':
            if(action.member_id == author.id) return `${name(0)} покинул${w(0, 'и:а')} беседу`;
            else if(actUser.id == id) return 'Вас исключили из беседы';
            else return `${name(1, 'acc')} исключили из беседы`;
          case 'chat_pin_message':
            return `${name(1)} закрепил${w(1, 'и:а')} сообщение "${action.message}"`;
          case 'chat_unpin_message':
            return `${name(1)} открепил${w(1, 'и:а')} сообщение`;
          case 'chat_invite_user_by_link':
            return `${name(0)} присоединил${w(0, 'ись:ась:ся')} к беседе по ссылке`;
          default:
            return `Неизвестное действие (${action.type})`;
        }
      }
    }
  }
</script>
