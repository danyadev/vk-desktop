import getTranslate from '../getTranslate';

function floor(num) {
  return num < 0 ? Math.ceil(num) : Math.floor(num);
}

export function format(date, mask) {
  const addZero = (num) => (num < 10 ? '0' + num : num);
  const months = getTranslate('months');

  const tokens = {
    // год (nnnn; nn)
    yyyy: () => date.getFullYear(),
    yy: () => ('' + date.getFullYear()).slice(-2),

    // месяц (полное название; короткое название; 01-12; 1-12)
    MMMM: () => months[date.getMonth()],
    MMM: () => tokens.MMMM().slice(0, 3),
    MM: () => addZero(tokens.M()),
    M: () => date.getMonth() + 1,

    // день (01-31; 1-31)
    dd: () => addZero(tokens.d()),
    d: () => date.getDate(),

    // час (01-23; 1-23)
    hh: () => addZero(tokens.h()),
    h: () => date.getHours(),

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

function copyDate(date) {
  return new Date(typeof date === 'number' ? date : date.getTime());
}

function startOfDay(date) {
  const copy = copyDate(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, count) {
  const copy = copyDate(date);
  copy.setDate(copy.getDate() + count);
  return copy;
}

function compareAsc(d1, d2) {
  const diff = differenceInMilliseconds(d1, d2);

  if (diff < 0) {
    return -1;
  }

  if (diff > 0) {
    return 1;
  }

  return 0;
}

export function isSameDay(d1, d2) {
  return startOfDay(d1).getTime() === startOfDay(d2).getTime();
}

export function isYesterday(date) {
  return isSameDay(date, addDays(Date.now(), -1));
}

function differenceInMilliseconds(d1, d2) {
  return d1.getTime() - d2.getTime();
}

export function differenceInSeconds(d1, d2) {
  return floor(differenceInMilliseconds(d1, d2) / 1000);
}

export function differenceInMinutes(d1, d2) {
  return floor(differenceInSeconds(d1, d2) / 60);
}

export function differenceInHours(d1, d2) {
  return floor(differenceInMinutes(d1, d2) / 60);
}

export function differenceInDays(d1, d2) {
  return floor(differenceInHours(d1, d2) / 24);
}

function differenceInCalendarMonths(d1, d2) {
  return differenceInYears(d1, d2) * 12 + d1.getMonth() - d2.getMonth();
}

export function differenceInMonths(d1, d2) {
  const sign = compareAsc(d1, d2);
  const diff = differenceInCalendarMonths(d1, d2);
  const d1Copy = copyDate(d1);

  d1Copy.setMonth(d1Copy.getMonth() - sign * diff);

  const isLastMonthNotFull = compareAsc(d1Copy, d2) === -sign;

  return sign * (diff - isLastMonthNotFull);
}

export function differenceInYears(d1, d2) {
  return d1.getFullYear() - d2.getFullYear();
}

// Поддерживаются минуты и часы
export function formatDistance(d1, d2) {
  const seconds = differenceInSeconds(d1, d2);

  function getDistanceTranslate(name, value) {
    return getTranslate(name, [value === 1 ? '' : value], value);
  }

  if (seconds < 3600) {
    return getDistanceTranslate('minutes_ago', Math.round(seconds / 60));
  } else {
    return getDistanceTranslate('hours_ago', Math.round(seconds / 3600));
  }
}
