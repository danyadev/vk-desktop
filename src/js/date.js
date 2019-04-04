// В будущем добавится en и uk
import { ru } from 'date-fns/locale/ru';
import { format, subDays, isSameDay } from 'date-fns';
import getTranslate from './getTranslate';

// Используется в списке диалогов
export function getShortDate(date) {
  const now = new Date();

  if(isSameDay(date, now)) return format(date, 'HH:mm', { locale: ru });
  else if(isSameDay(subDays(now, 1), date)) return getTranslate('yesterday');
  else if(date.getFullYear() != now.getFullYear()) return date.getFullYear();
  else return format(date, 'd MMM', { locale: ru });
}
