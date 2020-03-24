import getTranslate from '../getTranslate';

export function format(date, mask) {
  const addZero = (num) => num < 10 ? '0' + num : num;
  const months = getTranslate('months');

  const tokens = {
    // год (----)
    yyyy: date.getFullYear,

    // месяц (полное название; которкое название; 01-12; 1-12)
    MMMM: () => months[date.getMonth()],
    MMM: () => tokens.MMMM().slice(0, 3),
    MM: () => addZero(tokens.M()),
    M: () => date.getMonth() + 1,

    // день (01-31; 1-31)
    dd: () => addZero(tokens.d()),
    d: date.getDate,

    // час (01-23; 1-23)
    hh: () => addZero(tokens.h()),
    h: date.getHours,

    // минута (01-59; 1-59)
    mm: () => addZero(tokens.m()),
    m: () => date.getMinutes(),

    // секунда (01-59; 1-59)
    ss: () => addZero(tokens.s()),
    s: () => date.getSeconds()
  };

  Object.entries(tokens).forEach(([token, replacer]) => {
    mask = mask.replace(token, replacer);
  });

  return mask;
}
