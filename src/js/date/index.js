import getTranslate from '../getTranslate';
import {
  format,
  isSameDay,
  isYesterday,
  isSameYear
} from './utils';

function getTime(date) {
  return format(date, 'hh:mm');
}

// 1) 16:21
// 2) вчера
// 3) 5 мар
// 4) 3 мар 2018
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
