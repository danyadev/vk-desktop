import { ru } from 'date-fns/locale';
import getTranslate from './getTranslate';
import {
  format,
  formatDistanceStrict,
  subDays,
  isSameDay,
  differenceInSeconds,
  differenceInHours,
  differenceInCalendarYears
} from 'date-fns';

export function getTime(date) {
  // В будущем здесь будет автоматически указываться
  // локаль и эта функция будет иметь смысл :)
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
  } else if(isSameDay(subDays(now, 1), date)) {
    return `${getTranslate('yesterday')}, ${day}`;
  } else if(differenceInCalendarYears(now, date)) {
    return `${day} ${date.getFullYear()}`;
  } else {
    return day;
  }
}

// Используется в списке диалогов
export function getShortDate(date) {
  const now = new Date();

  if(isSameDay(date, now)) return format(date, 'HH:mm', { locale: ru });
  else if(isSameDay(subDays(now, 1), date)) return getTranslate('yesterday');
  else if(date.getFullYear() != now.getFullYear()) return date.getFullYear();
  else return format(date, 'd MMM', { locale: ru });
}

// Используется в шапке чата
export function getLastOnlineDate(date, sex = 0) {
  const at = getTranslate('date_at');
  const now = new Date();
  let time;

  if(differenceInSeconds(now, date) < 30) {
    time = getTranslate('date_now');
  } else if(differenceInHours(now, date) < 4) {
    time = formatDistanceStrict(date, now, { locale: ru, addSuffix: true });
  } else if(!differenceInCalendarYears(now, date)) {
    time = format(date, `d MMMM ${at} p`, { locale: ru });
  } else {
    time = format(date, `d MMMM y ${at} p`, { locale: ru });
  }

  return getTranslate('im_chat_was_online', sex, [time]);
}
