<template>
  <div class="messages_container">
    <div class="conversations_container">
      <div class="header">
        <open-menu></open-menu>
        <div class="header_name">Сообщения</div>
        <!-- кнопка поиска и три точки (доп.инструменты) -->
      </div>
      <div class="conversations_wrap" @scroll="onScroll" :class="{ loading: loadConversations }">
        <div class="conversation"
             v-for="item in conversations"
             :peer="item.peer_id">
          <img v-if="item.photo" :src="item.photo" class="conversation_photo">
          <div v-else :style="`background-color: #${item.color}`"
               class="conversation_photo"><emoji>{{ item.firstSym }}</emoji></div>
          <div class="conversation_content">
            <div class="conversation_title">
              <div class="conversation_name">
                <emoji>{{ item.name }}</emoji>
                <div class="verified" v-if="item.verified"></div>
              </div>
              <div class="conversation_time">{{ item.time }}</div>
            </div>
            <div class="conversation_message_wrap">
              <div class="conversation_message">
                <div class="conversation_author">{{ item.author }}</div>
                <div class="link" v-if="item.isService"><emoji :push="[1, 0]">{{ item.message }}</emoji></div>
                <emoji v-else :push="[1, 0]">{{ item.message }}</emoji>
              </div>
              <div class="conversation_message_unread"
                   :class="{ outread: item.outread, muted: item.muted }">{{ item.unread }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="dialogs_container">
      <div class="header">
        <!-- иконка беседы -->
        <!-- название беседы, кол-во людей и онлайн, три точки -->
      </div>
      <!-- сообщения -->
      <!-- форма для написания сообщения -->
    </div>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      conversations: [],
      profiles: {},
      loadConversations: true,
      conversationsOffset: 0
    }),
    methods: {
      async load() {
        if(this.offset % 20) return;

        let { profiles = [], groups = [], items } = await vkapi('messages.getConversations', {
              extended: true,
              fields: 'photo_50,verified,sex,first_name_acc,last_name_acc',
              offset: this.conversationsOffset,
              log: 1
            }),
            conversations = [];

        profiles.concat(groups.reduce((list, group) => {
          group.id = -group.id;
          list.push(group);
          return list;
        }, [])).forEach((profile) => {
          this.profiles[profile.id] = profile;
        });

        for(let item of items) {
          let { conversation, last_message } = item,
              isChat = conversation.peer.type == 'chat',
              owner = isChat ? null : this.profiles[conversation.peer.id],
              author = this.profiles[last_message.from_id],
              name = isChat ? conversation.chat_settings.title : owner.name || `${owner.first_name} ${owner.last_name}`,
              author_name = author.id == users.get().id ? 'Вы:' : isChat ? `${author.name || author.first_name}:` : '',
              photoColors = ['f04a48', 'ffa21e', '5fbf64', '59a9eb', '6580f0', 'c858dc', 'fa50a5'],
              photo, firstSym,
              { message, attach: isService } = this.getAttachmentPreview(last_message.text, last_message.attachments[0]);

          if(isChat) {
            let photos = conversation.chat_settings.photo;

            if(photos) {
              photo = photos.photo_50;
            } else {
              if(emoji.isEmoji(name[0])) firstSym = name[0];
              else if(emoji.isEmoji(name.slice(0, 2))) firstSym = name.slice(0, 2);
              else firstSym = name[0];
            }
          } else {
            photo = owner.photo_50;
          }

          if(last_message.action) {
            isService = true;
            message = this.getServiceMessagePreview(last_message.action, author);
            author_name = '';
          }

          if(last_message.fwd_messages.length) {
            isService = true;

            let count = last_message.fwd_messages.length,
                word = other.getWordEnding(count, ['сообщение', 'сообщения', 'сообщений']);

            message = `${count} ${word}`;
          }

          conversations.push({
            peer_id: conversation.peer.id,
            photo, firstSym, name, message, isService,
            color: photoColors[random(0, photoColors.length-1)],
            verified: owner && owner.verified,
            time: this.getTime(last_message.date),
            author: author_name,
            unread: conversation.unread_count || '',
            outread: item.conversation.out_read != item.last_message.id && item.last_message.out,
            muted: item.conversation.push_settings,
          });
        }

        this.conversationsOffset += items.length;
        this.loadConversations = false;
        this.conversations = this.conversations.concat(conversations);

        setTimeout(() => {
          this.onScroll({ target: qs('.conversations_wrap') });
        }, 100);
      },
      onScroll: endScroll((vm) => {
        if(!vm.loadConversations) {
          vm.load();
          vm.loadConversations = true;
        }
      }, 100),
      getTime(unixtime, force) {
        let date = new Date(unixtime * 1000),
            thisDate = new Date(), time,
            f = (t) => t < 10 ? `0${t}` : t;

        if(date.toLocaleDateString() == thisDate.toLocaleDateString() || force) {
          time = `${f(date.getHours())}:${f(date.getMinutes())}`;
        } else if(date.getFullYear() == thisDate.getFullYear()) {
          time = `${f(date.getDate())}.${f(date.getMonth() + 1)}`;
        } else time = date.getFullYear();

        return time;
      },
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

        return { message: attachName, attach: true };
      },
      getServiceMessagePreview(action, user) {
        let actUser = this.profiles[action.member_id], name,
            s = user.sex == 1 ? 'a' : '', text;

        switch(action.type) {
          case 'chat_photo_update':
            text = `${user.first_name} ${user.last_name} обновил${s} фотографию беседы`;
            break;
          case 'chat_photo_remove':
            text = `${user.first_name} ${user.last_name} удалил${s} фотографию беседы`;
            break;
          case 'chat_create':
            text = `${user.first_name} ${user.last_name} создал${s} беседу ${action.text}`;
            break;
          case 'chat_title_update':
            text = `${user.first_name} ${user.last_name} изменил${s} название беседы на ${action.text}`;
            break;
          case 'chat_invite_user':
            name = actUser.name || `${actUser.first_name_acc} ${actUser.last_name_acc}`;

            text = `${user.first_name} ${user.last_name} пригласил${s} ${name}`;
            break;
          case 'chat_kick_user':
            if(action.member_id == user.id) {
              text = `${user.first_name} ${user.last_name} покинул${s} беседу`;
            } else {
              name = actUser.name || `${actUser.first_name_acc} ${actUser.last_name_acc}`;

              text = `${user.first_name} ${user.last_name} исключил${s} ${name}`;
            }
            break;
          case 'chat_pin_message':
            name = actUser.name || `${actUser.first_name} ${actUser.last_name}`;

            text = `${name} закрепил${s} сообщение "${action.message}"`;
            break;
          case 'chat_unpin_message':
            name = actUser.name || `${actUser.first_name} ${actUser.last_name}`;

            text = `${name} открепил${s} сообщение`;
            break;
          case 'chat_invite_user_by_link':
            text = `${user.first_name} ${user.last_name} присоединил${s ? 'ась' : 'ся'} к беседе по ссылке`;
            break;
          default: text = `Неизвестное действие (${action.type})`;
        }

        return text;
      }
    },
    mounted() {
      this.load();
    }
  }
</script>
