// Минимальный fields при получении юзеров в приложении
export const fields = 'photo_50,photo_100,verified,sex,first_name_acc,last_name_acc,online,last_seen,screen_name';

// Вызов функции после прохождения интервала delay
// после последнего вызова обертки
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
