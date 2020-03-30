import getTranslate from '../getTranslate';
import {
  format,
  formatDistance,
  isYesterday,
  isSameDay,
  isSameYear,
  differenceInSeconds,
  differenceInHours,
  differenceInYears
} from './utils';

export function getTime(date) {
  return format(date, 'hh:mm');
}

// 1) 12:30
// 2) вчера
// 3) 1 мар
// 4) 1 мар 2019
export function getShortDate(date) {
  const now = new Date();

  if (isSameDay(date, now)) {
    return getTime(date);
  } else if (isYesterday(date)) {
    return getTranslate('yesterday');
  } else if (isSameYear(now, date)) {
    return format(date, 'd MMM');
  } else {
    return format(date, 'd MMM yyyy');
  }
}

// мар / марта (fullMonth)
// 1) сегодня в 12:30
// 2) вчера в 12:30
// 3) 1 мар в 12:30
// 4) 1 мар 2019 в 12:30
export function getFullDate(date, fullMonth) {
  const time = `${getTranslate('date_at')} ${getTime(date)}`;
  const monthToken = fullMonth ? 'MMMM' : 'MMM';
  const now = new Date();

  if (isSameDay(date, now)) {
    return `${getTranslate('today')} ${time}`;
  } else if (isYesterday(date)) {
    return `${getTranslate('yesterday')} ${time}`;
  } else if (!differenceInYears(now, date)) {
    return format(date, `d ${monthToken} ${time}`);
  } else {
    return format(date, `d ${monthToken} yyyy ${time}`);
  }
}

// Был / Была (isGirl)
// 1) Был в сети только что
// 2) Был в сети час назад
// 3) Был в сети 2 часа назад
// 4) Был в сети сегодня в 12:30
// 5) Был в сети вчера в 12:30
// 6) Был в сети 1 марта в 12:30
// 7) Был в сети 1 марта 2019 в 12:30
export function getLastOnlineDate(date, isGirl) {
  const now = new Date();
  let formatted;

  if (differenceInSeconds(now, date) < 60) {
    formatted = getTranslate('date_now');
  } else if (differenceInHours(now, date) < 4) {
    formatted = formatDistance(now, date);
  } else {
    formatted = getFullDate(date, true);
  }

  return getTranslate('im_chat_was_online', isGirl, [formatted]);
}

// 1) сегодня, 1 марта
// 2) вчера, 1 марта
// 3) 1 марта
// 4) 1 марта 2019
export function getDay(date) {
  const day = format(date, 'd MMMM');
  const now = new Date();

  if (isSameDay(date, now)) {
    return `${getTranslate('today')}, ${day}`;
  } else if (isYesterday(date)) {
    return `${getTranslate('yesterday')}, ${day}`;
  } else if (!differenceInYears(now, date)) {
    return day;
  } else {
    return `${day} ${date.getFullYear()}`;
  }
}
