'use strict';

const { shell } = require('electron').remote;

Object.defineProperty(Array.prototype, 'move', {
  value(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
  },
  enumerable: false
});

// Функция вызывается когда delay больше прошедшего времени
function throttle(fn, delay) {
  let lastCall = 0;

  return (...args) => {
    let now = new Date().getTime();
    if(now - lastCall < delay) return;
    lastCall = now;
    return fn(...args);
  }
}

// При вызове нескольких функций подряд в промежутке delay
// будет вызван fn только в самом конце
function debounce(fn, delay) {
  let timerId;

  return (...args) => {
    if(timerId) clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  }
}

function endScroll(callback, endDistance = 0) {
  return function(event) {
    let wrap = event.target,
        scrolled = wrap.scrollTop,
        all = wrap.scrollHeight - wrap.offsetHeight;

    if(all - scrolled - endDistance <= 0) callback(this, event);
  }
}

function isEqual(a, b) {
  let i = a.length;
  if(i != b.length) return false;

  while(i--) {
    if(a[i] != b[i]) return false;
  }

  return true;
}

function getNewIndex(arr, num) {
  for(let i=0; i<arr.length; i++) {
    if(i == 0 && arr[i] > num) return 0;
    if(arr[i] <= num && (!arr[i+1] || arr[i+1] >= num)) {
      return i + 1;
    }
  }

  return arr.length;
}

async function openLink(link) {
  // Для работы shell.openExternal обязательно должен быть указан протокол.
  // Лично я поддерживаю только эти 4 протокола, ибо они самые популярные.
  if(!/^(http|https|ftp|ftps):\/\//i.test(link)) link = 'https://' + link;

  let vkcomRE = /^(http|https):\/\/vk\.com\/(im|im\.php)\?sel=(\d+)/i,
      mvkcomRE = /^(http|https):\/\/m\.vk\.com\/(mail|mail\.php)\?act=show&(peer|chat)=(\d+)/i,
      vkmeRE = /^(http|https):\/\/vk\.me\/(.+)/i,
      joinRE = /^(http|https):\/\/vk\.me\/join\//i;

  if(joinRE.test(link)) app.$modals.open('chat-preview', link);
  else if(vkcomRE.test(link)) {
    let peer_id = link.match(vkcomRE)[4].split('&')[0];
    if(peer_id.indexOf('/') != -1) return shell.openExternal(link);
    if(peer_id[0] == 'c') peer_id = 2e9 + +peer_id.slice(1);

    app.$store.commit('messages/setChat', peer_id);
  } else if(vkmeRE.test(link)) {
    let data = link.match(vkmeRE)[2].split('&')[0];
    if(data.indexOf('/') != -1) return shell.openExternal(link);

    let id = data.match(/(id|club)(\d+)/);

    if(id) data = id[1] == 'id' ? id[2] : -id[2];
    else {
      let profiles = Object.values(app.$store.state.profiles),
          user = profiles.find((user) => user.screen_name == data);

      if(user) data = user.id;
      else {
        app.$toast('Load link...');
        let [{ id }] = await vkapi('users.get', { user_ids: data });
        data = id;
      }
    }

    app.$store.commit('messages/setChat', data);
  } else if(mvkcomRE.test(link)) {
    let data = link.match(mvkcomRE),
        peer_id = data[3] == 'chat' ? 2e9 + +data[4] : data[4];

    app.$store.commit('messages/setChat', peer_id);
  } else shell.openExternal(link);
}

module.exports = {
  throttle,
  debounce,
  endScroll,
  isEqual,
  getNewIndex,
  openLink,
  fields: 'photo_50,photo_100,verified,sex,first_name_acc,last_name_acc,online,last_seen,screen_name',
  timer: (t) => new Promise((r) => setTimeout(r, t)),
  escape: (t) => String(t || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;'),
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  isObject: (data) => data instanceof Object && !Array.isArray(data),
  regexp: {
    url: /(((http|https|ftp|ftps):\/\/)?([a-zа-я\.\-0-9]+\.[a-zа-я]{2,6}\.?)(\/\S*)?)(?=\s|\n|$)/gi,
    push: /\[(club|id)(\d+)\|(.+?)\]/gi
  }
}
