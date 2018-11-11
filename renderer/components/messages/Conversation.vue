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
          <div class="conversation_author">{{ author }}</div>
          <emoji :push="[1, 0]"
                 :class="{ conversation_attach: attachment }">{{ message }}</emoji>
        </div>
        <div class="conversation_message_unread"
             :class="{ outread: outread, muted: muted }">{{ unread }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['conversation', 'last_message', 'profiles'],
    data() {
      return {
        peer_id: this.conversation.peer.id,
        isChat: this.conversation.peer.type == 'chat',
        message_author: this.profiles[this.last_message.from_id],
        verified: this.owner && this.owner.verified ? true : false,
        muted: this.conversation.push_settings ? true : false,
        unread: this.conversation.unread_count || '',
        outread: this.conversation.out_read != this.last_message.id && this.last_message.out,
        attachment: false
      }
    },
    computed: {
      photo() {
        let photo, owner = this.profiles[this.peer_id];

        if(this.isChat) {
          let photos = this.conversation.chat_settings.photo;
          if(photos) photo = photos.photo_50;
        } else photo = owner.photo_50;

        return photo;
      },
      time() {
        let unixtime = this.last_message.date,
            date = new Date(unixtime * 1000),
            thisDate = new Date(), time,
            f = (t) => t < 10 ? `0${t}` : t;

        if(date.toLocaleDateString() == thisDate.toLocaleDateString()) {
          time = `${f(date.getHours())}:${f(date.getMinutes())}`;
        } else if(date.getFullYear() == thisDate.getFullYear()) {
          time = `${f(date.getDate())}.${f(date.getMonth() + 1)}`;
        } else time = date.getFullYear();

        return time;
      },
      author() {
        let author = '', user = this.message_author;

        if(user.id == users.get().id) author = 'Вы:';
        else if(this.isChat) author = `${user.name || user.first_name}:`;

        return this.last_message.action ? '' : author;
      },
      chatName() {
        let name, owner = this.profiles[this.peer_id];

        if(this.isChat) name = this.conversation.chat_settings.title;
        else name = owner.name || `${owner.first_name} ${owner.last_name}`;

        return name;
      },
      message() {
        let text = this.last_message.text, attach = this.last_message.attachments[0],
            { message, attachment } = this.getAttachmentPreview(text, attach);

        this.attachment = attachment;

        if(this.last_message.action) {
          this.attachment = false;
          message = this.getServiceMessagePreview(this.last_message.action, this.message_author);
        }

        if(this.last_message.fwd_messages.length && !message) {
          this.attachment = true;

          let count = this.last_message.fwd_messages.length,
              word = other.getWordEnding(count, ['сообщение', 'сообщения', 'сообщений']);

          message = `${count} ${word}`;
        }

        return message;
      }
    },
    methods: {
      getAttachmentPreview(message, attachment) {
        if(!attachment || (message && attachment.type != 'gift')) {
          return { message, attach: false };
        }

        let attachName = '';

        switch(attachment.type) {
          case 'doc': attachName = 'Документ'; break;
          case 'link': attachName = 'Ссылка'; break;
          case 'poll': attachName = 'Опрос'; break;
          case 'wall': attachName = 'Запись на стене'; break;
          case 'call': attachName = 'Звонок'; break;
          case 'gift': attachName = 'Подарок'; break;
          case 'photo': attachName = 'Фотография'; break;
          case 'audio': attachName = 'Аудиозапись'; break;
          case 'video': attachName = 'Видеозапись'; break;
          case 'point': attachName = 'Местоположение'; break;
          case 'market': attachName = 'Товар'; break;
          case 'sticker': attachName = 'Стикер'; break;
          case 'graffiti': attachName = 'Граффити'; break;
          case 'audio_message': attachName = 'Голосовое сообщение'; break;
          case 'money_request': attachName = 'Запрос на денежный перевод'; break;
          case 'audio_playlist': attachName = 'Плейлист'; break;
          default: attachName = 'Вложение'; break;
        }

        return { message: attachName, attachment: true };
      },
      getServiceMessagePreview(action, user) {
        let actUser = this.profiles[action.member_id],
            id = users.get().id,
            us = user.id == id ? 'и' : (user.sex == 1 ? 'a' : ''),
            as = actUser && (actUser.id == id ? 'и' : (actUser.sex == 1 ? 'a' : ''));

        let getName = (user, ncase) => {
          let name;

          if(user.id == id) name = 'Вы';
          else if(user.name) name = user.name;
          else if(ncase) name = `${user[`first_name_${ncase}`]} ${user[`last_name_${ncase}`]}`;
          else name = `${user.first_name} ${user.last_name}`;

          return name;
        }

        switch(action.type) {
          case 'chat_photo_update':
            return `${getName(user)} обновил${us} фотографию беседы`;
            break;
          case 'chat_photo_remove':
            return `${getName(user)} удалил${us} фотографию беседы`;
            break;
          case 'chat_create':
            return `${getName(user)} создал${us} беседу "${action.text}"`;
            break;
          case 'chat_title_update':
            return `${getName(user)} изменил${us} название беседы на "${action.text}"`;
            break;
          case 'chat_invite_user':
            if(actUser.id == id) return `Вас пригласили в беседу`;
            else return `${getName(actUser, 'acc')} пригласил${us} в беседу`;
            break;
          case 'chat_kick_user':
            if(action.member_id == user.id) return `${getName(user)} покинул${us} беседу`;
            else return `Вас исключили из беседы`;
            break;
          case 'chat_pin_message':
            return `${getName(actUser)} закрепил${as} сообщение "${action.message}"`;
            break;
          case 'chat_unpin_message':
            return `${getName(actUser)} открепил${as} сообщение`;
            break;
          case 'chat_invite_user_by_link':
            let end = (us == 'и' ? 'ись' : (us ? 'ась' : 'ся'));

            return `${getName(user)} присоединил${end} к беседе по ссылке`;
            break;
          default:
            return `Неизвестное действие (${action.type})`;
            break;
        }
      }
    }
  }
</script>
