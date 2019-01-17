'use strict';

Object.defineProperty(Array.prototype, 'move', {
  value(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
  },
  enumerable: false
});

Object.defineProperty(Vue.prototype, 'l', {
  value(name, key, replaces) {
    if(!replaces && Array.isArray(key)) {
      replaces = key;
      key = null;
    }

    let data = this.$store.state.lang[name];
    if(![null, undefined].includes(key)) data = data[key];

    if(Array.isArray(replaces)) {
      for(let i in replaces) {
        let regexp = new RegExp(`\\{${i}\\}`, 'g');

        data = String(data).replace(regexp, replaces[i]);
      }
    }

    return data;
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

function getWordEnding(num, variants = [0, 1, 2]) {
  let num1 = Math.abs(num) % 100,
      num2 = num1 % 10;

  if(num1 > 10 && num1 < 20) return variants[2];
  if(num2 > 1 && num2 < 5) return variants[1];
  if(num2 == 1) return variants[0];

  return variants[2];
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

module.exports = {
  throttle,
  debounce,
  endScroll,
  getWordEnding,
  isEqual,
  getNewIndex,
  fields: 'photo_50,verified,sex,first_name_acc,last_name_acc,online,last_seen',
  timer: (t) => new Promise((r) => setTimeout(r, t)),
  escape: (t) => t.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  isObject: (data) => data instanceof Object && !Array.isArray(data),
  regexp: {
    url: /(([a-z]+:\/\/)?([a-zа-я\.]+\.[a-zа-я]{2,6}\.?)(\/\S+)?)/gi,
    push: /\[(club|id)(\d+)\|(.+?)\]/gi
  }
}
