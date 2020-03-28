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

function getTime(date) {
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

// 1) Был в сети только что
// 2) Был в сети час назад
// 3) Был в сети 2 часа назад
// 4) Был в сети сегодня в 12:30
// 5) Был в сети 1 марта в 12:30
// 6) Был в сети 1 марта 2019 в 12:30
export function getLastOnlineDate(date, isGirl) {
  const time = `${getTranslate('date_at')} ${getTime(date)}`;
  const now = new Date();
  let formatted;

  if (differenceInSeconds(now, date) < 60) {
    formatted = getTranslate('date_now');
  } else if (differenceInHours(now, date) < 4) {
    formatted = formatDistance(now, date);
  } else if (isSameDay(now, date)) {
    formatted = `${getTranslate('today')} ${time}`;
  } else if (!differenceInYears(now, date)) {
    formatted = format(date, `d MMMM ${time}`);
  } else {
    formatted = format(date, `d MMMM y ${time}`);
  }

  return getTranslate('im_chat_was_online', isGirl, [formatted]);
}
