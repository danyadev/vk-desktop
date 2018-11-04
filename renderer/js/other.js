module.exports = {
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  endScroll: (callback, num = 0) => {
    return function(event) {
      let wrap = event.target,
          scrolled = wrap.scrollTop,
          all = wrap.scrollHeight - wrap.offsetHeight;

      if(all - scrolled - num <= 0) callback(this, event);
    }
  },
  regexp: {
    url: /(([a-zа-я]+:\/\/)?([\wа-я\.]+\.[\wа-я]{2,6}\.?)(\S+)?)/gi,
    push: /\[(club|id)(\d+)\|(.+?)\]/gi
  }
}
