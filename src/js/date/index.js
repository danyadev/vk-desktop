import {
  format,
  formatDistance,
  isYesterday,
  isSameDay,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInMonths,
  differenceInYears
} from './utils';
import getTranslate from '../getTranslate';

export function getTime(date) {
  return format(date, 'hh:mm');
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

// 1) (ничего; в случае, если разница меньше минуты)
// 2) 1м - 59м
// 3) 1ч - 23ч
// 4) 1д - 2д
// 5) 1 мар
// 6) 01.03.19
export function getShortTime(date, now) {
  const getSymbol = getTranslate.bind(this, 'date_symbols');
  let time;

  if (differenceInYears(now, date)) {
    return format(date, 'dd.MM.yy');
  }

  if (differenceInMonths(now, date)) {
    return format(date, 'd MMM');
  }

  if ((time = differenceInDays(now, date))) {
    return time < 3
      ? time + getSymbol('day')
      : format(date, 'd MMM');
  }

  if ((time = differenceInHours(now, date))) {
    return time + getSymbol('hour');
  }

  if ((time = differenceInMinutes(now, date))) {
    return time + getSymbol('minute');
  }

  return '';
}
