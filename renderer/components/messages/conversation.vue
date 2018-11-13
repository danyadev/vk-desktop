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
             :class="{ outread, muted }">{{ unread }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['conversation', 'last_message'],
    data() {
      let peerID = this.conversation.peer.id,
          isChat = this.conversation.peer.type == 'chat',
          owner = isChat ? null : this.$root.profiles[peerID];

      return {
        isChat: isChat,
        owner: owner,
        verified: owner && owner.verified ? true : false,
        muted: this.conversation.push_settings ? true : false,
        author: this.$root.profiles[this.last_message.from_id],
        attachment: false,
        outread: this.conversation.out_read != this.last_message.id && this.last_message.out,
        unread: this.conversation.unread_count || ''
      }
    },
    computed: {
      photo() {
        let photo;

        if(this.isChat) {
          let photos = this.conversation.chat_settings.photo;
          if(photos) photo = photos.photo_50;
        } else photo = this.owner.photo_50;

        return photo;
      },
      chatName() {
        if(this.isChat) return this.conversation.chat_settings.title;
        else return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
      },
      time() {
        let unixtime = this.last_message.date,
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
        if(this.last_message.action) return '';
        else if(this.author.id == users.get().id) return 'Вы:';
        else if(this.isChat) return `${this.author.name || this.author.first_name}:`;
      },
      message() {
        if(this.last_message.action) {
          this.attachment = false;
          return this.getServiceMessageText(this.last_message.action, this.author);
        } else if(this.last_message.fwd_messages.length && !this.last_message.text) {
          let count = this.last_message.fwd_messages.length,
              word = other.getWordEnding(count, ['сообщение', 'сообщения', 'сообщений']);

          this.attachment = true;
          return `${count} ${word}`;
        } else {
          let { msg, attach } = this.getAttachmentText(this.last_message.text, this.last_message.attachments[0]);

          this.attachment = attach;
          return msg;
        }
      }
    },
    methods: {
      getAttachmentText(message, attachment) {
        if(!attachment || (message && attachment.type != 'gift')) {
          return { msg: message, attach: false };
        }

        let attachments = {
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
      getServiceMessageText(action, author) {
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
            return `${actUser.id == id ? 'Вас' : name(1, 'acc')} пригласили в беседу`;
          case 'chat_kick_user':
            if(action.member_id == author.id) return `${name(0)} покинул${w(0, 'и:а')} беседу`;
            else return `Вас исключили из беседы`;
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
