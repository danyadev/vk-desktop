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
