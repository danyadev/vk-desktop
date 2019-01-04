'use strict';

const { loadProfile } = require('./methods');

function getServiceMessage(action, author, full) {
  let actID = action.member_id || action.mid,
      actUser = this.$store.state.profiles[actID] || { id: actID },
      id = this.$root.user.id;

  function g(type) {
    let user = type ? actUser : author;

    if(user.id == id) return 0;
    else if(user.sex == 1) return 2;
    else return 1;
  }

  function e(text) {
    return emoji(other.escape(text));
  }

  function name(type, acc) {
    let user = type ? actUser : author, name;
    if(!user.photo_50) loadProfile(user.id);

    if(user.id == id) name = acc ? app.l('you2') : app.l('you');
    else if(user.name) name = user.name;
    else if(user.photo_50) {
      if(acc) name = `${user.first_name_acc} ${user.last_name_acc}`;
      else name = `${user.first_name} ${user.last_name}`;
    } else name = '...';

    return e(name);
  }

  switch(action.type) {
    case 'chat_photo_update':
      return app.l('im_chat_photo_update', g(0), [name(0)]);
    case 'chat_photo_remove':
      return app.l('im_chat_photo_remove', g(0), [name(0)]);
    case 'chat_create':
      return app.l('im_chat_create', g(0), [name(0), e(action.text)]);
    case 'chat_title_update':
      return app.l('im_chat_title_update', g(0), [name(0), e(action.text)]);
    case 'chat_pin_message':
      return app.l('im_chat_pin_message', g(1), [name(1), e(action.message)]);
    case 'chat_unpin_message':
      return app.l('im_chat_unpin_message', g(1), [name(1)]);
    case 'chat_invite_user_by_link':
      return app.l('im_chat_invite_user_by_link', g(0), [name(0)]);
    case 'chat_invite_user':
      if(actID == author.id) return app.l('im_chat_returned_user', g(0), [name(0)]);
      else if(full) return app.l('im_chat_invite_user', g(0), [name(0), name(1, 1)]);
      else return app.l('im_chat_invite_user_short', g(0), [name(1, 1)]);
    case 'chat_kick_user':
      if(actID == author.id) return app.l('im_chat_left_user', g(0), [name(0)]);
      else if(full) return app.l('im_chat_kick_user', g(0), [name(0), name(1, 1)]);
      else return app.l('im_chat_kick_user_short', g(0), [name(1, 1)]);
    default:
      console.warn('[messages] Неизвестное действие:', action.type);
      return action.type;
  }
}

function getDate(timestamp, { addTime, shortMonth, fullText } = {}) {
  let thisDate = new Date(),
      date = new Date(timestamp * 1000),
      f = (t) => t < 10 ? `0${t}` : t,
      months = app.l('months');

  let thisYear = thisDate.getFullYear() == date.getFullYear(),
      thisMonth = thisYear && thisDate.getMonth() == date.getMonth(),
      thisDay = thisMonth && thisDate.getDate() == date.getDate(),
      yesterday = thisMonth && thisDate.getDate() - 1 == date.getDate(),
      time = `${f(date.getHours())}:${f(date.getMinutes())}`,
      month = months[date.getMonth()];

  if(shortMonth && month.length > 3) month = month.slice(0, 3) + '.';

  if(thisDay) {
    if(fullText) return app.l('today') + ' ' + app.l('at_n', null, [time]);
    else return addTime ? time : app.l('today');
  } else if(yesterday) return app.l('yesterday');
  else if(thisYear) return `${date.getDate()} ${month}`;
  else return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

async function toggleChat(chatID) {
  let oldChatID = this.$store.state.activeChat,
      conversation = this.$store.state.conversations[oldChatID],
      peer = conversation && conversation.peer,
      messagesList = qs('.dialog_messages_list'),
      dialogInput = qs('.dialog_input');

  if(oldChatID == chatID) return;

  // закрытие диалога
  if((!chatID && peer) || (chatID && oldChatID)) {
    peer.scrollTop = messagesList.scrollTop;
    if(dialogInput) peer.inputText = dialogInput.innerHTML;

    // если чел находится внизу диалога
    if(messagesList.scrollTop + messagesList.clientHeight == messagesList.scrollHeight) {
      peer.scrolledToEnd = true;
    } else peer.scrolledToEnd = false;
  }

  this.$store.commit('setChat', chatID);

  // открытие диалога
  if(chatID) {
    await this.$nextTick();

    let newConv = this.$store.state.conversations[chatID],
        newPeer = newConv && newConv.peer,
        hasScrollTop = newPeer.scrollTop != undefined;

    if(newPeer) {
      if(dialogInput) dialogInput.innerHTML = newPeer.inputText || '';

      if(newPeer.scrolledToEnd || !hasScrollTop) {
        qs('.typing_wrap').scrollIntoView();
      } else if(hasScrollTop) {
        qs('.dialog_messages_list').scrollTop = newPeer.scrollTop;
      }
    }
  }
}

module.exports = {
  getServiceMessage,
  getDate,
  toggleChat
}
