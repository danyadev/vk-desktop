import fs from 'fs';
import { EventEmitter } from 'events';
import { reactive } from 'vue';
import electron from 'electron';
import os from 'os';
import path from 'path';
import { version } from '../../package.json';
import { usersStorage } from './store/Storage';
import request from './request';
import vkapi from './vkapi';
import store from './store';
import copyObject from './copyObject';
import debug from './debug';

debug(
  '[init] ' +
  `os ${os.type()} (${os.platform()}) ${os.release()} ${os.arch()}; ` +
  `electron ${process.versions.electron}; ` +
  `app ${version}; ` +
  `user_id ${store.state.users.activeUserID || '(не авторизован)'}\n`
);

// --- Переменные

export const VKDesktopUserAgent =
  `VKDesktop/${version} (${os.platform()}; ${os.release()}; ${os.arch()})`;
export const AndroidUserAgent =
  'VKAndroidApp/6.7-5621 (Android 10; SDK 29; arm64-v8a; VK Desktop; ru; 1920x720)';

export const fields = 'photo_50,photo_100,verified,sex,status,first_name_acc,last_name_acc,online,last_seen,online_info,domain';

export const eventBus = new EventEmitter();

export const currentWindow = electron.remote.getCurrentWindow();

// --- Основные утилиты

export function timer(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function escape(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function unescape(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

export function isObject(obj) {
  return obj && !Array.isArray(obj) && typeof obj === 'object';
}

export function toUrlParams(object) {
  return new URLSearchParams(object).toString();
}

// --- Функции-обертки

// Вызывает переданную функцию через delay мс после последнего вызова
export function debounce(fn, delay) {
  let timerId;

  return function(...args) {
    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delay);
  };
}

// Вызывает переданную функцию, если после последнего вызова прошло более delay мс.
// Это значит, что функция может вообще не вызваться, что не всегда нужно
export function throttle(fn, delay) {
  let lastCall = 0;

  return function(...args) {
    const now = Date.now();

    if (now - lastCall < delay) {
      return;
    }

    lastCall = now;
    fn.apply(this, args);
  };
}

// Вызывает переданную функцию через delay мс после первого вызова
export function callWithDelay(fn, delay) {
  let timerId;
  let fnArgs;

  return function(...args) {
    fnArgs = args;

    if (!timerId) {
      timerId = setTimeout(() => {
        fn.apply(this, fnArgs);
        timerId = null;
      }, delay);
    }
  };
}

// Выполняет асинхронную функцию только когда прошлая функция уже была выполнена
export function createQueueManager(fn) {
  const queue = [];
  let isExecuting = false;

  async function executeQueue() {
    const { args, resolve, context } = queue.shift();

    resolve(await fn.apply(context, args));

    if (queue.length) {
      executeQueue();
    } else {
      isExecuting = false;
    }
  }

  return function(...args) {
    return new Promise((resolve) => {
      queue.push({ args, resolve, context: this });

      if (queue.length === 1 && !isExecuting) {
        isExecuting = true;
        executeQueue();
      }
    });
  };
}

// Создает парсер текста, который делит текст на блоки с помощью регулярки.
// parseText вызывается если кусок текста не входит в регулярку
// parseText(value (кусок текста), ...args (параметры, переданные в экземпляр парсера)) {}
// parseElement вызывается если кусок текста уже входит в регулярку
// parseElement(value, match (вывод регулярки), ...args) {}
// Эти функции обязательны и должны вернуть массив, который затем добавится к ответу
// Пример:
// const parser = createParser({
//   regexp: /element/g,
//   parseText: (value, ...args) => [{ type: 'text', value }],
//   parseElement: (value, match, ...args) => [{ type: 'el', value }]
// });
// const result = parser('text element', 'arg1', 'arg2');
// result = [{ type: 'text', value: 'text ' }, { type: 'el', value: 'element' }];
export function createParser({ regexp, parseText, parseElement }) {
  return function(text, ...args) {
    const blocks = [];
    let offset = 0;

    for (const match of text.matchAll(regexp)) {
      const { 0: result, index } = match;

      if (index !== offset) {
        blocks.push(...parseText(text.slice(offset, index), ...args));
      }

      blocks.push(...parseElement(result, match, ...args));

      offset = index + result.length;
    }

    if (text.length !== offset) {
      blocks.push(...parseText(text.slice(offset, text.length), ...args));
    }

    return blocks;
  };
}

export function mouseOverWrapper(fn) {
  return (event) => {
    const root = event.currentTarget;

    if (!event.fromElement || !root.contains(event.fromElement)) {
      fn(event);
    }
  };
}

export function mouseOutWrapper(fn) {
  return (event) => {
    const root = event.currentTarget;

    if (!event.toElement || !root.contains(event.toElement)) {
      fn(event);
    }
  };
}

// --- Остальные вспомогательные функции

export function moveArrItem(arr, from, to) {
  arr.splice(to, 0, arr.splice(from, 1)[0]);
  return arr;
}

export function createCallablePromise() {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  promise.resolve = resolve;
  promise.reject = reject;

  return promise;
}

// 125 -> 125
// 12.732 -> 12K
// 5.324.267 -> 5M
export function convertCount(count) {
  if (count >= 1e6) {
    return Math.floor(count / 1e6) + 'M';
  } else if (count >= 1e3) {
    return Math.floor(count / 1e3) + 'K';
  }

  return count;
}

export function getPhoto(obj) {
  return obj && (devicePixelRatio > 1 ? obj.photo_100 : obj.photo_50);
}

// Возвращает фотографию нужного размера из объекта фотографий
export function getPhotoFromSizes(sizes, size, isDoc) {
  const find = (type) => sizes.find((photo) => photo.type === type);
  const optionalTypes = isDoc ? ['z', 'y', 'x', 'm', 's'] : ['w', 'z', 'y'];

  if (Array.isArray(size)) {
    for (let i = 0; i < size.length; i++) {
      const photo = find(size[i]);

      if (photo) {
        return photo;
      }
    }

    return;
  }

  const index = optionalTypes.indexOf(size);

  if (index !== -1) {
    for (let i = index; i < optionalTypes.length; i++) {
      const photo = find(optionalTypes[i]);

      if (photo) {
        return photo;
      }
    }

    return isDoc ? find('o') : find('x');
  }

  return find(size);
}

// Собирает массивы профилей и групп в единый массив, где у групп отрицательный id
export function concatProfiles(profiles, groups) {
  profiles = profiles || [];
  groups = groups || [];

  return profiles.concat(
    groups.reduce((list, group) => {
      group.id = -group.id;
      list.push(group);
      return list;
    }, [])
  );
}

// Возвращает функцию, которая вызывает колбэк, если юзер долистал
// список до конца (или в начало), чтобы загрузить новую часть списка
export function endScroll(callback, reverse) {
  return function({ viewport: { scrollTop, scrollHeight, offsetHeight } }) {
    // Если блок пустой либо видимая область блока = 0px.
    // Обычно возникает когда у блока стоит display: none или он скрыт другим способом.
    if (!scrollHeight || !offsetHeight) {
      return;
    }

    const isScrolledUp = scrollTop <= 100;
    const isScrolledDown = scrollTop + offsetHeight + 100 >= scrollHeight;

    // reverse = 0: проверять скролл вниз
    // reverse = 1: проверять скролл вверх
    // reverse = -1: проверять все сразу
    const isScrolled = reverse
      ? (reverse === -1 ? (isScrolledUp || isScrolledDown) : isScrolledUp)
      : isScrolledDown;

    if (isScrolled) {
      callback.call(this, {
        isUp: isScrolledUp,
        isDown: isScrolledDown
      });
    }
  };
}

export function logout() {
  const { activeUserID } = store.state.users;
  const usersData = copyObject(usersStorage.data);

  usersData.activeUserID = null;
  delete usersData.users[activeUserID];

  usersStorage.update(usersData);

  window.location.reload();
}

const loadingProfiles = [];
let isLoadingProfiles = false;

export async function loadProfile(id) {
  if (loadingProfiles.includes(id)) {
    return;
  } else if (id) {
    loadingProfiles.push(id);
  }

  if (isLoadingProfiles) {
    return;
  }

  isLoadingProfiles = true;

  const profiles = loadingProfiles.slice();
  const newProfiles = await vkapi('execute.getProfiles', {
    profile_ids: profiles.join(','),
    func_v: 2,
    fields
  });

  store.commit('addProfiles', newProfiles);

  loadingProfiles.splice(0, profiles.length);
  isLoadingProfiles = false;

  if (loadingProfiles.length) {
    loadProfile();
  }
}

export function getAppName(app_id) {
  switch (app_id) {
    case 2274003:
      return 'Android';
    case 3140623:
    case 3087106:
      return 'iPhone';
    case 3682744:
      return 'iPad';
    case 6146827:
    case 6482950:
    case 6481715:
      return 'VK Me';
    case 3502561:
    case 3502557:
      return 'Windows Phone';
    case 5027722:
      return 'VK Messenger';
    case 6121396:
      return 'VK Admin';
    case 2685278:
      return 'Kate Mobile';
    case 6717234:
      return 'VK Desktop';
    case 6614620:
      return 'Laney';
    case 5632485:
      return 'SpaceVK';
    case 6328039:
    case 6328868:
    case 6820516:
      return 'VK mp3 mod';
  }
}

export async function downloadFile({ getUrl, progress }) {
  const files = electron.remote.dialog.showOpenDialogSync({
    properties: ['openDirectory']
  });

  if (files) {
    const url = await getUrl();
    const [name] = (new URL(url)).pathname.split('/').reverse();

    await request(url, {
      raw: true,
      pipe: fs.createWriteStream(path.join(files[0], name)),
      progress
    });
  }
}

export const windowSize = reactive({
  width: window.innerWidth,
  height: window.innerHeight
});

window.addEventListener('resize', () => {
  windowSize.width = window.innerWidth;
  windowSize.height = window.innerHeight;
});

// export function onTransitionEnd(el, anyTarget) {
//   return new Promise((resolve) => {
//     function onTransitionEndListener(event) {
//       if (!anyTarget && event.target !== el) {
//         return;
//       }
//
//       el.removeEventListener('transitionend', onTransitionEndListener);
//       resolve();
//     }
//
//     el.addEventListener('transitionend', onTransitionEndListener);
//   });
// }

// export function parseMp3Link(url) {
//   if (url.includes('.mp3?')) {
//     return url;
//   }
//
//   const match = url.match(
//     url.startsWith('https://ps')
//       ? /(https:\/\/.+)\/.+?\/audios\/(.+?)\/index\.m3u8\?extra=(.+)/
//       : /(https:\/\/.+)\/.+?\/(.+?)\/index\.m3u8\?extra=(.+)/
//   );
//
//   return `${match[1]}/${match[2]}.mp3?extra=${match[3]}`;
// }
