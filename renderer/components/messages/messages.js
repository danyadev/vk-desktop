'use strict';

const { loadProfile } = require('./methods');

function getServiceMessage(action, author, full) {
  function boldText(text) {
    return `<b>${other.escape(text)}</b>`;
  }

  function name(type, acc) {
    let user = type ? actUser : author, name;
    if(!user.photo_50) loadProfile(user.id);

    if(user.id == id) name = 'Вы';
    else if(user.name) name = user.name;
    else if(user.photo_50) {
      if(acc) name = `${user.first_name_acc} ${user.last_name_acc}`;
      else name = `${user.first_name} ${user.last_name}`;
    } else name = '...';

    if(full) return boldText(name);
    else return other.escape(name);
  }

  function w(type, text) {
    let user = type ? actUser : author, endID;

    if(user.id == id) endID = 0;
    else if(user.sex == 1) endID = 1;
    else endID = 2;

    return text.split(':')[endID] || '';
  }

  let actID = action.member_id || action.mid,
      actUser = this.$store.state.profiles[actID] || { id: actID },
      id = this.$root.user.id;

  switch(action.type) {
    case 'chat_photo_update':
      return `${name(0)} обновил${w(0, 'и:а')} фотографию беседы`;
    case 'chat_photo_remove':
      return `${name(0)} удалил${w(0, 'и:а')} фотографию беседы`;
    case 'chat_create':
      let title = full ? `«${boldText(emoji(action.text))}»` : '';
      return `${name(0)} создал${w(0, 'и:а')} беседу ${title}`;
    case 'chat_title_update':
      let text = full ? `на «${boldText(emoji(action.text))}»` : '';

      return `${name(0)} изменил${w(0, 'и:а')} название беседы ${text}`;
    case 'chat_invite_user':
      if(actID == author.id) return `${name(1)} вернул${w(1, 'ись:ась:ся')} в беседу`;
      else return `${name(1, 1)} пригласили в беседу`;
    case 'chat_kick_user':
      if(actID == author.id) return `${name(0)} покинул${w(0, 'и:а')} беседу`;
      else if(actID == id) return 'Вас исключили из беседы';
      else return `${name(1, 1)} исключили из беседы`;
    case 'chat_pin_message':
      return `${name(1)} закрепил${w(1, 'и:а')} сообщение`;
    case 'chat_unpin_message':
      return `${name(1)} открепил${w(1, 'и:а')} сообщение`;
    case 'chat_invite_user_by_link':
      return `${name(0)} присоединил${w(0, 'ись:ась:ся')} к беседе по ссылке`;
    default:
      console.warn('[messages] Неизвестное действие:', action.type);
      return `Неизвестное действие (${action.type})`;
  }
}

module.exports = {
  getServiceMessage
}
