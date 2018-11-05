module.exports = {
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  escape: (t) => String(t).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  endScroll(callback, num = 0) {
    return function(event) {
      let wrap = event.target,
          scrolled = wrap.scrollTop,
          all = wrap.scrollHeight - wrap.offsetHeight;

      if(all - scrolled - num <= 0) callback(this, event);
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
  regexp: {
    url: /(([a-zа-я]+:\/\/)?([\w\.]+\.[a-zа-я]{2,6}\.?)(\S+)?)/gi,
    push: /\[(club|id)(\d+)\|(.+?)\]/gi
  }
}
