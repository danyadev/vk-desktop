'use strict';

Object.defineProperty(Array.prototype, 'move', {
  value: function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
  },
  enumerable: false
});

module.exports = {
  timer: (t) => new Promise((r) => setTimeout(r, t)),
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  isObject: (data) => data instanceof Object && !Array.isArray(data),
  endScroll(callback, endDistance = 0) {
    return function(event) {
      let wrap = event.target,
          scrolled = wrap.scrollTop,
          all = wrap.scrollHeight - wrap.offsetHeight;

      if(all - scrolled - endDistance <= 0) callback(this, event);
    }
  },
  getWordEnding(num, variants) {
    let num1 = Math.abs(num) % 100,
        num2 = num1 % 10;

    if(num1 > 10 && num1 < 20) return variants[2];
    if(num2 > 1 && num2 < 5) return variants[1];
    if(num2 == 1) return variants[0];

    return variants[2];
  },
  getTextWithEmoji(nodes) {
    let text = '';

    for(let node of nodes || []) {
      if(node.nodeName == 'IMG') text += node.alt;
      else if(node.nodeName == 'BR') text += '<br>';
      else text += node.data || node.innerText || '';
    }

    return text;
  },
  isEqual(a, b) {
    let i = a.length;
    if(i != b.length) return false;

    while(i--) {
      if(a[i] != b[i]) return false;
    }

    return true;
  },
  regexp: {
    url: /(([a-zа-я]+:\/\/)?([a-zа-я\.]+\.[a-zа-я]{2,6}\.?)(\S+))/gi,
    push: /\[(club|id)(\d+)\|(.+?)\]/gi
  }
}
