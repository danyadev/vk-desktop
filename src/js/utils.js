// Минимальный fields для получения профилей в приложении
export const fields = 'photo_50,photo_100,verified,sex,status,first_name_acc,last_name_acc,online,last_seen,screen_name';

// Список нужных регулярных выражений
export const regexp = {
  push: /\[(club|id)(\d+)\|(.+?)\]/gi
}

// Заменяем опасные для разметки символы в выводимых данных на безопасные
export function escape(text = '') {
  if(text == null) return '';

  return String(text)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
}

// Вызывает переданную функцию после прохождения delay мс после последнего вызова экземпляра
export function debounce(fn, delay) {
  let timerId;

  return (...args) => {
    if(timerId) clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  }
}

// Собирает массивы профилей и групп в единый массив, где у групп отрицательный id
export function concatProfiles(profiles = [], groups = []) {
  groups = groups.reduce((list, group) => {
    group.id = -group.id;
    list.push(group);
    return list;
  }, []);

  return profiles.concat(groups);
}

// Возвращает одну из фотографий:
// p1 - фото для обычных дисплеев
// p2 - фото для Retina дисплеев, в 2 раза больше p1
export function getPhoto(p1, p2) {
  return devicePixelRatio >= 2 ? p2 : p1;
}
