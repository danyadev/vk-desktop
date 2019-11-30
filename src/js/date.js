import { ru } from 'date-fns/locale';
import getTranslate from './getTranslate';
import {
  format,
  formatDistanceStrict,
  isYesterday,
  isSameDay,
  differenceInSeconds,
  differenceInHours,
  differenceInCalendarYears
} from 'date-fns';

// Возвращает дату в виде час:минута
export function getTime(date) {
  return format(date, 'HH:mm', { locale: ru });
}

// Возвращает дату в виде:
// 1) Сегодня, 2 мая
// 2) Вчера, 1 мая
// 3) 21 апреля
// 4) 7 декабря 2018
export function getMessageDate(date) {
  const day = format(date, 'd MMMM', { locale: ru });
  const now = new Date();

  if(isSameDay(date, now)) {
    return `${getTranslate('today')}, ${day}`;
  } else if(isYesterday(date)) {
    return `${getTranslate('yesterday')}, ${day}`;
  } else if(differenceInCalendarYears(now, date)) {
    return `${day} ${date.getFullYear()}`;
  } else {
    return day;
  }
}

// Возвращает дату в виде:
// 1) Сегодня в 12:43
// 2) Вчера в 13:22
// 3) 13 сент. в 17:24
// 4) 18 мая 2018 в 16:54
export function getFullMessageDate(date) {
  const at = getTranslate('date_at');
  const now = new Date();

  if(isSameDay(date, now)) {
    return `${getTranslate('today')} ${at} ${getTime(date)}`;
  } else if(isYesterday(date)) {
    return `${getTranslate('yesterday')} ${at} ${getTime(date)}`;
  } else if(!differenceInCalendarYears(now, date)) {
    return format(date, `d MMM ${at} p`, { locale: ru });
  } else {
    return format(date, `d MMM y ${at} p`, { locale: ru });
  }
}

// Возвращает дату в виде:
// 1) 16:21
// 2) Вчера
// 3) 5 мар.
// 4) 3 мар. 2018
export function getShortDate(date) {
  const now = new Date();

  if(isSameDay(date, now)) {
    return getTime(date);
  } else if(isYesterday(date)) {
    return getTranslate('yesterday');
  } else if(differenceInCalendarYears(now, date)) {
    return format(date, 'd MMM yyyy', { locale: ru });
  } else {
    return format(date, 'd MMM', { locale: ru });
  }
}

// Возвращает дату в виде:
// 1) Был в сети только что
// 2) Был в сети час назад
// 3) Был в сети 2 часа назад
// 4) Был в сети сегодня в 12:43
// 5) Был в сети 13 июня в 17:24
// 6) Был в сети 18 июня 2018 в 16:54
export function getLastOnlineDate(date, sex) {
  const at = getTranslate('date_at');
  const now = new Date();
  let time;

  if(differenceInSeconds(now, date) < 30) {
    time = getTranslate('date_now');
  } else if(differenceInHours(now, date) < 4) {
    time = formatDistanceStrict(date, now, { locale: ru, addSuffix: true }).replace(/1 /, '');
  } else if(isSameDay(date, now)) {
    time = `${getTranslate('today')} ${at} ` + getTime(date);
  } else if(!differenceInCalendarYears(now, date)) {
    time = format(date, `d MMMM ${at} p`, { locale: ru });
  } else {
    time = format(date, `d MMMM y ${at} p`, { locale: ru });
  }

  return getTranslate('im_chat_was_online', sex, [time]);
}
