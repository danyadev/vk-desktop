import { EventEmitter } from 'events';
import vkapi from './vkapi';
import store from './store/';
import { version as AppVersion } from 'package-json';

// Минимальный fields для получения профилей в приложении
export const fields = 'photo_50,photo_100,verified,sex,status,first_name_acc,last_name_acc,online,last_seen,online_info,screen_name';

// Список нужных регулярных выражений
export const regexp = {
  push: /\[(club|id)(\d+)\|(.+?)\]/gi
};

// User-Agents для выполнения запросов
export const VKDesktopUserAgent = `VKDesktop/${AppVersion}`;
export const AndroidUserAgent = 'VKAndroidApp/5.36-3760';

// Заменяем опасные для разметки символы в выводимых данных на безопасные
export function escape(text) {
  if(text == null) return '';

  return String(text)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
}

// Возвращает рандомное число в указанном диапазоне
export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Возвращает одну из фотографий:
// p1 - фото для обычных дисплеев
// p2 - фото для Retina дисплеев, в 2 раза больше p1
export function getPhoto(p1, p2) {
  const x2 = devicePixelRatio > 1;

  return p2
    ? x2 ? p2 : p1
    : p1 && (x2 ? p1.photo_100 : p1.photo_50);
}

// Возвращает фотографию нужного размера из обьекта фотографий
export function getPhotoFromSizes(sizes, size) {
  const photo = sizes.find((ph) => ph.type == size);

  return photo || sizes[sizes.length-1];
}

// Пишет текст с большой буквы
// привет всем -> Привет всем
export function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

// Вызывает переданную функцию после прохождения delay мс после последнего вызова экземпляра
export function debounce(fn, delay) {
  let timerId;

  return function(...args) {
    if(timerId) clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delay);
  }
}

// Вызывает переданную функцию, если после последнего вызова прошло более delay мс
export function throttle(fn, delay) {
  let lastCall = 0;

  return function(...args) {
    const now = Date.now();

    if(now - lastCall < delay) return;
    lastCall = now;

    fn.apply(this, args);
  }
}

// Вызывает переданную функцию только после прохождения delay мс
// т.е. неважно, сколько раз мы вызвали функцию
export function callWithDelay(fn, delay) {
  let timerId, fnArgs;

  return function(...args) {
    fnArgs = args;

    if(!timerId) {
      timerId = setTimeout(() => {
        fn.apply(this, fnArgs);
        timerId = null;
      }, delay);
    }
  }
}

// Создает промис, который разрешается за указанное время
export function timer(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
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

// Возвращает функцию, которая вызывает колбэк, если юзер долистал
// список до конца, чтобы загрузить новую часть списка
export function endScroll(callback, reverse) {
  return function({ scrollTop, scrollHeight, offsetHeight }) {
    // Если блок пустой либо видимая область блока = 0px, то игнорировать это событие.
    // Обычно возникает когда у блока стоит display: none или он скрыт другим способом.
    if(!scrollHeight || !offsetHeight) return;

    const isScrolledUp = scrollTop <= 100;
    const isScrolledDown = scrollTop + offsetHeight + 100 >= scrollHeight;

    const isScrolled = reverse
      ? (reverse == -1 ? (isScrolledUp || isScrolledDown) : isScrolledUp)
      : isScrolledDown;

    if(isScrolled) {
      callback.call(this, {
        isUp: isScrolledUp,
        isDown: isScrolledDown
      });
    }
  }
}

// Шина событий вне Vue
export const eventBus = new EventEmitter();

// Загрузка профилей
const loadingProfiles = [];
let isLoadingProfiles = false;

export async function loadProfile(id) {
  if(id && loadingProfiles.find((uid) => uid == id)) return;
  if(id) loadingProfiles.push(id);
  if(isLoadingProfiles) return;

  isLoadingProfiles = true;

  const profiles = loadingProfiles.slice();
  const data = await vkapi('execute.getProfiles', {
    fields: fields,
    profile_ids: profiles.join(',')
  });

  store.commit('addProfiles', data);

  loadingProfiles.splice(0, profiles.length);
  isLoadingProfiles = false;

  if(loadingProfiles.length) loadProfile();
}
