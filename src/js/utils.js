import { EventEmitter } from 'events';
import { version } from 'package-json';
import store from './store';
import { usersStorage } from './store/Storage';
import copyObject from './copyObject';

const deviceInfo = '(1; 1; 1; 1; 1; 1)';
export const VKDesktopUserAgent = `VKDesktop/${version} ${deviceInfo}`;
export const AndroidUserAgent = `VKAndroidApp/5.50-4431 ${deviceInfo}`;

export const fields = 'photo_50,photo_100,verified,sex,status,first_name_acc,last_name_acc,online,last_seen,online_info,domain';

export function timer(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export const eventBus = new EventEmitter();

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

// 125 -> 125
// 12.732 -> 12K
// 5.324.267 -> 5M
export function convertCount(count) {
  if (count >= 1e6) return Math.floor(count / 1e6) + 'M';
  if (count >= 1e3) return Math.floor(count / 1e3) + 'K';

  return count;
}

export function onTransitionEnd(el, anyTarget) {
  return new Promise((resolve) => {
    function onTransitionEndListener(event) {
      if (!anyTarget && event.target !== el) return;

      el.removeEventListener('transitionend', onTransitionEndListener);
      resolve();
    }

    el.addEventListener('transitionend', onTransitionEndListener);
  });
}

export function logout() {
  const { activeUser } = store.state.users;
  const usersData = copyObject(usersStorage.data);

  usersData.activeUser = null;
  delete usersData.users[activeUser];

  usersStorage.update(usersData);

  window.location.reload();
}
